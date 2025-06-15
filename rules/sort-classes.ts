import type { TSESTree } from '@typescript-eslint/types'

import type {
  SortClassesOptions,
  Modifier,
  Selector,
} from './sort-classes/types'
import type { SortingNodeWithDependencies } from '../utils/sort-nodes-by-dependencies'

import {
  buildCustomGroupsArrayJsonSchema,
  partitionByCommentJsonSchema,
  partitionByNewLineJsonSchema,
  newlinesBetweenJsonSchema,
  commonJsonSchemas,
  groupsJsonSchema,
  regexJsonSchema,
} from '../utils/common-json-schemas'
import {
  DEPENDENCY_ORDER_ERROR,
  MISSED_SPACING_ERROR,
  EXTRA_SPACING_ERROR,
  GROUP_ORDER_ERROR,
  ORDER_ERROR,
} from '../utils/report-errors'
import { validateNewlinesAndPartitionConfiguration } from '../utils/validate-newlines-and-partition-configuration'
import { buildGetCustomGroupOverriddenOptionsFunction } from '../utils/get-custom-groups-compare-options'
import { validateGeneratedGroupsConfiguration } from '../utils/validate-generated-groups-configuration'
import {
  singleCustomGroupJsonSchema,
  allModifiers,
  allSelectors,
} from './sort-classes/types'
import { validateCustomSortConfiguration } from '../utils/validate-custom-sort-configuration'
import { getOverloadSignatureGroups } from './sort-classes/get-overload-signature-groups'
import { generatePredefinedGroups } from '../utils/generate-predefined-groups'
import { sortNodesByDependencies } from '../utils/sort-nodes-by-dependencies'
import { getEslintDisabledLines } from '../utils/get-eslint-disabled-lines'
import { isNodeEslintDisabled } from '../utils/is-node-eslint-disabled'
import { doesCustomGroupMatch } from '../utils/does-custom-group-match'
import { sortNodesByGroups } from '../utils/sort-nodes-by-groups'
import { getNodeDecorators } from '../utils/get-node-decorators'
import { createEslintRule } from '../utils/create-eslint-rule'
import { getDecoratorName } from '../utils/get-decorator-name'
import { reportAllErrors } from '../utils/report-all-errors'
import { shouldPartition } from '../utils/should-partition'
import { getGroupIndex } from '../utils/get-group-index'
import { computeGroup } from '../utils/compute-group'
import { rangeToDiff } from '../utils/range-to-diff'
import { getSettings } from '../utils/get-settings'
import { isSortable } from '../utils/is-sortable'
import { complete } from '../utils/complete'
import { matches } from '../utils/matches'

/**
 * Cache computed groups by modifiers and selectors for performance
 */
let cachedGroupsByModifiersAndSelectors = new Map<string, string[]>()

type MESSAGE_ID =
  | 'unexpectedClassesDependencyOrder'
  | 'missedSpacingBetweenClassMembers'
  | 'extraSpacingBetweenClassMembers'
  | 'unexpectedClassesGroupOrder'
  | 'unexpectedClassesOrder'

let defaultOptions: Required<SortClassesOptions[0]> = {
  groups: [
    'index-signature',
    ['static-property', 'static-accessor-property'],
    ['static-get-method', 'static-set-method'],
    ['protected-static-property', 'protected-static-accessor-property'],
    ['protected-static-get-method', 'protected-static-set-method'],
    ['private-static-property', 'private-static-accessor-property'],
    ['private-static-get-method', 'private-static-set-method'],
    'static-block',
    ['property', 'accessor-property'],
    ['get-method', 'set-method'],
    ['protected-property', 'protected-accessor-property'],
    ['protected-get-method', 'protected-set-method'],
    ['private-property', 'private-accessor-property'],
    ['private-get-method', 'private-set-method'],
    'constructor',
    ['static-method', 'static-function-property'],
    ['protected-static-method', 'protected-static-function-property'],
    ['private-static-method', 'private-static-function-property'],
    ['method', 'function-property'],
    ['protected-method', 'protected-function-property'],
    ['private-method', 'private-function-property'],
    'unknown',
  ],
  ignoreCallbackDependenciesPatterns: [],
  fallbackSort: { type: 'unsorted' },
  partitionByComment: false,
  partitionByNewLine: false,
  newlinesBetween: 'ignore',
  specialCharacters: 'keep',
  type: 'alphabetical',
  ignoreCase: true,
  customGroups: [],
  locales: 'en-US',
  alphabet: '',
  order: 'asc',
}

interface SortClassSortingNodes
  extends SortingNodeWithDependencies<TSESTree.ClassElement> {
  overloadSignaturesGroupId: number | null
}

export default createEslintRule<SortClassesOptions, MESSAGE_ID>({
  create: context => ({
    ClassBody: node => {
      if (!isSortable(node.body)) {
        return
      }

      let settings = getSettings(context.settings)
      let options = complete(context.options.at(0), settings, defaultOptions)
      validateCustomSortConfiguration(options)
      validateGeneratedGroupsConfiguration({
        modifiers: allModifiers,
        selectors: allSelectors,
        options,
      })
      validateNewlinesAndPartitionConfiguration(options)

      let { sourceCode, id } = context
      let eslintDisabledLines = getEslintDisabledLines({
        ruleName: id,
        sourceCode,
      })
      let className = node.parent.id?.name
      let getDependencyName = (props: {
        nodeNameWithoutStartingHash: string
        isPrivateHash: boolean
        isStatic: boolean
      }): string =>
        `${props.isStatic ? 'static ' : ''}${props.isPrivateHash ? '#' : ''}${props.nodeNameWithoutStartingHash}`
      /**
       * Class methods should not be considered as dependencies
       * because they can be put in any order without causing a reference error.
       */
      let classMethodsDependencyNames = new Set(
        node.body
          .map(member => {
            if (
              (member.type === 'MethodDefinition' ||
                member.type === 'TSAbstractMethodDefinition') &&
              'name' in member.key
            ) {
              return getDependencyName({
                isPrivateHash: member.key.type === 'PrivateIdentifier',
                nodeNameWithoutStartingHash: member.key.name,
                isStatic: member.static,
              })
            }
            return null
          })
          .filter(Boolean),
      )
      let extractDependencies = (
        expression: TSESTree.StaticBlock | TSESTree.Expression,
        isMemberStatic: boolean,
      ): string[] => {
        let dependencies: string[] = []

        let checkNode = (nodeValue: TSESTree.Node): void => {
          if (
            nodeValue.type === 'MemberExpression' &&
            (nodeValue.object.type === 'ThisExpression' ||
              (nodeValue.object.type === 'Identifier' &&
                nodeValue.object.name === className)) &&
            (nodeValue.property.type === 'Identifier' ||
              nodeValue.property.type === 'PrivateIdentifier')
          ) {
            let isStaticDependency =
              isMemberStatic || nodeValue.object.type === 'Identifier'
            let dependencyName = getDependencyName({
              isPrivateHash: nodeValue.property.type === 'PrivateIdentifier',
              nodeNameWithoutStartingHash: nodeValue.property.name,
              isStatic: isStaticDependency,
            })
            if (!classMethodsDependencyNames.has(dependencyName)) {
              dependencies.push(dependencyName)
            }
          }

          if (nodeValue.type === 'Property') {
            traverseNode(nodeValue.key)
            traverseNode(nodeValue.value)
          }

          if (nodeValue.type === 'ConditionalExpression') {
            traverseNode(nodeValue.test)
            traverseNode(nodeValue.consequent)
            traverseNode(nodeValue.alternate)
          }

          if (
            'expression' in nodeValue &&
            typeof nodeValue.expression !== 'boolean'
          ) {
            traverseNode(nodeValue.expression)
          }

          if ('object' in nodeValue) {
            traverseNode(nodeValue.object)
          }

          if ('callee' in nodeValue) {
            traverseNode(nodeValue.callee)
          }

          if ('init' in nodeValue && nodeValue.init) {
            traverseNode(nodeValue.init)
          }

          if ('body' in nodeValue && nodeValue.body) {
            traverseNode(nodeValue.body)
          }

          if ('left' in nodeValue) {
            traverseNode(nodeValue.left)
          }

          if ('right' in nodeValue) {
            traverseNode(nodeValue.right)
          }

          if ('elements' in nodeValue) {
            let elements = nodeValue.elements.filter(
              currentNode => currentNode !== null,
            )
            for (let element of elements) {
              traverseNode(element)
            }
          }

          if ('argument' in nodeValue && nodeValue.argument) {
            traverseNode(nodeValue.argument)
          }

          if ('arguments' in nodeValue) {
            let shouldIgnore = false
            if (nodeValue.type === 'CallExpression') {
              let functionName =
                'name' in nodeValue.callee ? nodeValue.callee.name : null
              shouldIgnore =
                functionName !== null &&
                matches(
                  functionName,
                  options.ignoreCallbackDependenciesPatterns,
                )
            }
            if (!shouldIgnore) {
              for (let argument of nodeValue.arguments) {
                traverseNode(argument)
              }
            }
          }

          if ('declarations' in nodeValue) {
            for (let declaration of nodeValue.declarations) {
              traverseNode(declaration)
            }
          }

          if ('properties' in nodeValue) {
            for (let property of nodeValue.properties) {
              traverseNode(property)
            }
          }

          if ('expressions' in nodeValue) {
            for (let nodeExpression of nodeValue.expressions) {
              traverseNode(nodeExpression)
            }
          }
        }

        let traverseNode = (
          nodeValue: TSESTree.Node[] | TSESTree.Node,
        ): void => {
          if (Array.isArray(nodeValue)) {
            for (let nodeItem of nodeValue) {
              traverseNode(nodeItem)
            }
          } else {
            checkNode(nodeValue)
          }
        }

        traverseNode(expression)
        return dependencies
      }
      let overloadSignatureGroups = getOverloadSignatureGroups(node.body)
      let formattedNodes: SortClassSortingNodes[][] = node.body.reduce(
        (accumulator: SortClassSortingNodes[][], member) => {
          let name: string
          let dependencies: string[] = []

          if (member.type === 'StaticBlock') {
            name = 'static'
          } else if (member.type === 'TSIndexSignature') {
            name = sourceCode.text.slice(
              member.range.at(0),
              member.typeAnnotation?.range.at(0) ?? member.range.at(1),
            )
          } else if (member.key.type === 'Identifier') {
            ;({ name } = member.key)
          } else {
            name = sourceCode.getText(member.key)
          }

          let isPrivateHash =
            'key' in member && member.key.type === 'PrivateIdentifier'

          let decorated = false
          let decorators: string[] = []

          if ('decorators' in member) {
            decorators = getNodeDecorators(member).map(decorator =>
              getDecoratorName({ sourceCode, decorator }),
            )
            decorated = decorators.length > 0
          }

          let memberValue: undefined | string
          let modifiers: Modifier[] = []
          let selectors: Selector[] = []
          let addSafetySemicolonWhenInline: boolean = true
          switch (member.type) {
            case 'TSAbstractPropertyDefinition':
            case 'PropertyDefinition':
              /**
               * Member is necessarily a property similarly to above for methods,
               * prioritize 'static', 'declare', 'decorated', 'abstract',
               * 'override' and 'readonly' over accessibility modifiers.
               */
              if ('static' in member && member.static) {
                modifiers.push('static')
              }

              if ('declare' in member && member.declare) {
                modifiers.push('declare')
              }

              if (member.type === 'TSAbstractPropertyDefinition') {
                modifiers.push('abstract')
              }

              if (decorated) {
                modifiers.push('decorated')
              }

              if ('override' in member && member.override) {
                modifiers.push('override')
              }

              if ('readonly' in member && member.readonly) {
                modifiers.push('readonly')
              }

              if (
                'accessibility' in member &&
                member.accessibility === 'protected'
              ) {
                modifiers.push('protected')
              } else if (
                ('accessibility' in member &&
                  member.accessibility === 'private') ||
                isPrivateHash
              ) {
                modifiers.push('private')
              } else {
                modifiers.push('public')
              }

              if ('optional' in member && member.optional) {
                modifiers.push('optional')
              }

              if (
                member.value?.type === 'ArrowFunctionExpression' ||
                member.value?.type === 'FunctionExpression'
              ) {
                if (member.value.async) {
                  modifiers.push('async')
                }
                selectors.push('function-property')
              } else if (member.value) {
                memberValue = sourceCode.getText(member.value)
                dependencies = extractDependencies(member.value, member.static)
              }

              selectors.push('property')
              break

            case 'TSAbstractMethodDefinition':
            case 'MethodDefinition':
              /**
               * By putting the static modifier before accessibility modifiers, we
               * prioritize 'static' over those in cases like:
               * config: ['static-method', 'public-method']
               * element: public static method();
               * Element will be classified as 'static-method' before
               * 'public-method'.
               */
              if (member.static) {
                modifiers.push('static')
              }
              if (member.type === 'TSAbstractMethodDefinition') {
                modifiers.push('abstract')
              } else if (!node.parent.declare) {
                addSafetySemicolonWhenInline = false
              }

              if (decorated) {
                modifiers.push('decorated')
              }

              if (member.override) {
                modifiers.push('override')
              }

              if (member.accessibility === 'protected') {
                modifiers.push('protected')
              } else if (member.accessibility === 'private' || isPrivateHash) {
                modifiers.push('private')
              } else {
                modifiers.push('public')
              }

              if (member.optional) {
                modifiers.push('optional')
              }

              if (member.value.async) {
                modifiers.push('async')
              }

              if (member.kind === 'constructor') {
                selectors.push('constructor')
              }

              if (member.kind === 'get') {
                selectors.push('get-method')
              }

              if (member.kind === 'set') {
                selectors.push('set-method')
              }
              selectors.push('method')

              break

            case 'TSAbstractAccessorProperty':
            case 'AccessorProperty':
              if (member.static) {
                modifiers.push('static')
              }

              if (member.type === 'TSAbstractAccessorProperty') {
                modifiers.push('abstract')
              }

              if (decorated) {
                modifiers.push('decorated')
              }

              if (member.override) {
                modifiers.push('override')
              }

              if (member.accessibility === 'protected') {
                modifiers.push('protected')
              } else if (member.accessibility === 'private' || isPrivateHash) {
                modifiers.push('private')
              } else {
                modifiers.push('public')
              }
              selectors.push('accessor-property')

              break

            case 'TSIndexSignature':
              if (member.static) {
                modifiers.push('static')
              }

              if (member.readonly) {
                modifiers.push('readonly')
              }

              selectors.push('index-signature')

              break

            case 'StaticBlock':
              addSafetySemicolonWhenInline = false

              selectors.push('static-block')

              dependencies = extractDependencies(member, true)

              break
          }

          let predefinedGroups = generatePredefinedGroups({
            cache: cachedGroupsByModifiersAndSelectors,
            selectors,
            modifiers,
          })
          let group = computeGroup({
            customGroupMatcher: customGroup =>
              doesCustomGroupMatch({
                elementValue: memberValue,
                elementName: name,
                customGroup,
                decorators,
                modifiers,
                selectors,
              }),
            predefinedGroups,
            options,
          })

          /**
           * Members belonging to the same overload signature group should have
           * the same size in order to keep line-length sorting between them
           * consistent.
           *
           * It is unclear what should be considered the size of an overload
           * signature group. Take the size of the implementation by default.
           */
          let overloadSignatureGroupMemberIndex =
            overloadSignatureGroups.findIndex(overloadSignatures =>
              overloadSignatures.includes(member),
            )
          let overloadSignatureGroupMember =
            overloadSignatureGroups[overloadSignatureGroupMemberIndex]?.at(-1)

          let sortingNode: Omit<SortClassSortingNodes, 'partitionId'> = {
            dependencyNames: [
              getDependencyName({
                nodeNameWithoutStartingHash: name.startsWith('#')
                  ? name.slice(1)
                  : name,
                isStatic: modifiers.includes('static'),
                isPrivateHash,
              }),
            ],
            overloadSignaturesGroupId:
              overloadSignatureGroupMemberIndex === -1
                ? null
                : overloadSignatureGroupMemberIndex,
            size: overloadSignatureGroupMember
              ? rangeToDiff(overloadSignatureGroupMember, sourceCode)
              : rangeToDiff(member, sourceCode),
            isEslintDisabled: isNodeEslintDisabled(member, eslintDisabledLines),
            addSafetySemicolonWhenInline,
            node: member,
            dependencies,
            group,
            name,
          }

          let lastSortingNode = accumulator.at(-1)?.at(-1)

          if (
            shouldPartition({
              lastSortingNode,
              sortingNode,
              sourceCode,
              options,
            })
          ) {
            accumulator.push([])
          }

          accumulator.at(-1)!.push({
            ...sortingNode,
            partitionId: accumulator.length,
          })

          return accumulator
        },
        [[]],
      )

      let sortNodesExcludingEslintDisabled = (
        ignoreEslintDisabledNodes: boolean,
      ): SortClassSortingNodes[] => {
        let nodesSortedByGroups = formattedNodes.flatMap(nodes =>
          sortNodesByGroups({
            isNodeIgnored: sortingNode =>
              getGroupIndex(options.groups, sortingNode) ===
              options.groups.length,
            getOptionsByGroupIndex:
              buildGetCustomGroupOverriddenOptionsFunction(options),
            ignoreEslintDisabledNodes,
            groups: options.groups,
            nodes,
          }),
        )

        return sortNodesByDependencies(nodesSortedByGroups, {
          ignoreEslintDisabledNodes,
        })
      }

      let nodes = formattedNodes.flat()

      reportAllErrors<MESSAGE_ID, SortClassSortingNodes>({
        newlinesBetweenValueGetter: ({
          computedNewlinesBetween,
          right,
          left,
        }): 'ignore' | number => {
          if (
            left.overloadSignaturesGroupId !== null &&
            left.overloadSignaturesGroupId === right.overloadSignaturesGroupId
          ) {
            return 0
          }
          return computedNewlinesBetween
        },
        availableMessageIds: {
          missedSpacingBetweenMembers: 'missedSpacingBetweenClassMembers',
          extraSpacingBetweenMembers: 'extraSpacingBetweenClassMembers',
          unexpectedDependencyOrder: 'unexpectedClassesDependencyOrder',
          unexpectedGroupOrder: 'unexpectedClassesGroupOrder',
          unexpectedOrder: 'unexpectedClassesOrder',
        },
        sortNodesExcludingEslintDisabled,
        sourceCode,
        options,
        context,
        nodes,
      })
    },
  }),
  meta: {
    schema: [
      {
        properties: {
          ...commonJsonSchemas,
          customGroups: buildCustomGroupsArrayJsonSchema({
            singleCustomGroupJsonSchema,
          }),
          ignoreCallbackDependenciesPatterns: regexJsonSchema,
          partitionByComment: partitionByCommentJsonSchema,
          partitionByNewLine: partitionByNewLineJsonSchema,
          newlinesBetween: newlinesBetweenJsonSchema,
          groups: groupsJsonSchema,
        },
        additionalProperties: false,
        type: 'object',
      },
    ],
    messages: {
      unexpectedClassesDependencyOrder: DEPENDENCY_ORDER_ERROR,
      missedSpacingBetweenClassMembers: MISSED_SPACING_ERROR,
      extraSpacingBetweenClassMembers: EXTRA_SPACING_ERROR,
      unexpectedClassesGroupOrder: GROUP_ORDER_ERROR,
      unexpectedClassesOrder: ORDER_ERROR,
    },
    docs: {
      url: 'https://perfectionist.dev/rules/sort-classes',
      description: 'Enforce sorted classes.',
      recommended: true,
    },
    type: 'suggestion',
    fixable: 'code',
  },
  defaultOptions: [defaultOptions],
  name: 'sort-classes',
})
