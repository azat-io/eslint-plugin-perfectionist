import type { TSESTree } from '@typescript-eslint/types'
import type { TSESLint } from '@typescript-eslint/utils'

import type {
  SortClassesOptions,
  Modifier,
  Selector,
} from './sort-classes.types'
import type { SortingNodeWithDependencies } from '../utils/sort-nodes-by-dependencies'

import {
  partitionByCommentJsonSchema,
  partitionByNewLineJsonSchema,
  specialCharactersJsonSchema,
  newlinesBetweenJsonSchema,
  ignoreCaseJsonSchema,
  localesJsonSchema,
  groupsJsonSchema,
  orderJsonSchema,
  typeJsonSchema,
} from '../utils/common-json-schemas'
import {
  singleCustomGroupJsonSchema,
  customGroupNameJsonSchema,
  customGroupSortJsonSchema,
  allModifiers,
  allSelectors,
} from './sort-classes.types'
import {
  getFirstUnorderedNodeDependentOn,
  sortNodesByDependencies,
} from '../utils/sort-nodes-by-dependencies'
import { validateNewlinesAndPartitionConfiguration } from '../utils/validate-newlines-and-partition-configuration'
import {
  getOverloadSignatureGroups,
  customGroupMatches,
  getCompareOptions,
} from './sort-classes-utils'
import { validateGeneratedGroupsConfiguration } from './validate-generated-groups-configuration'
import { generatePredefinedGroups } from '../utils/generate-predefined-groups'
import { getEslintDisabledLines } from '../utils/get-eslint-disabled-lines'
import { isNodeEslintDisabled } from '../utils/is-node-eslint-disabled'
import { hasPartitionComment } from '../utils/is-partition-comment'
import { sortNodesByGroups } from '../utils/sort-nodes-by-groups'
import { getCommentsBefore } from '../utils/get-comments-before'
import { makeNewlinesFixes } from '../utils/make-newlines-fixes'
import { getNewlinesErrors } from '../utils/get-newlines-errors'
import { createEslintRule } from '../utils/create-eslint-rule'
import { getLinesBetween } from '../utils/get-lines-between'
import { getGroupNumber } from '../utils/get-group-number'
import { getSourceCode } from '../utils/get-source-code'
import { toSingleLine } from '../utils/to-single-line'
import { rangeToDiff } from '../utils/range-to-diff'
import { getSettings } from '../utils/get-settings'
import { isSortable } from '../utils/is-sortable'
import { useGroups } from '../utils/use-groups'
import { makeFixes } from '../utils/make-fixes'
import { complete } from '../utils/complete'
import { pairwise } from '../utils/pairwise'
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
  partitionByComment: false,
  partitionByNewLine: false,
  newlinesBetween: 'ignore',
  specialCharacters: 'keep',
  type: 'alphabetical',
  ignoreCase: true,
  customGroups: [],
  locales: 'en-US',
  order: 'asc',
}

export default createEslintRule<SortClassesOptions, MESSAGE_ID>({
  create: context => ({
    ClassBody: node => {
      if (!isSortable(node.body)) {
        return
      }

      let settings = getSettings(context.settings)
      let options = complete(context.options.at(0), settings, defaultOptions)
      validateGeneratedGroupsConfiguration({
        customGroups: options.customGroups,
        modifiers: allModifiers,
        selectors: allSelectors,
        groups: options.groups,
      })
      validateNewlinesAndPartitionConfiguration(options)
      let sourceCode = getSourceCode(context)
      let eslintDisabledLines = getEslintDisabledLines({
        ruleName: context.id,
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
                options.ignoreCallbackDependenciesPatterns.some(pattern =>
                  matches(functionName, pattern),
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
      let formattedNodes: SortingNodeWithDependencies[][] = node.body.reduce(
        (accumulator: SortingNodeWithDependencies[][], member) => {
          let name: string
          let dependencies: string[] = []
          let { defineGroup, getGroup } = useGroups(options)

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
            decorated = member.decorators.length > 0
            for (let decorator of member.decorators) {
              if (decorator.expression.type === 'Identifier') {
                decorators.push(decorator.expression.name)
              } else if (
                decorator.expression.type === 'CallExpression' &&
                decorator.expression.callee.type === 'Identifier'
              ) {
                decorators.push(decorator.expression.callee.name)
              }
            }
          }

          let memberValue: undefined | string
          let modifiers: Modifier[] = []
          let selectors: Selector[] = []
          let addSafetySemicolonWhenInline: boolean = true
          if (
            member.type === 'MethodDefinition' ||
            member.type === 'TSAbstractMethodDefinition'
          ) {
            // By putting the static modifier before accessibility modifiers,
            // We prioritize 'static' over those in cases like:
            // Config: ['static-method', 'public-method']
            // Element: public static method();
            // Element will be classified as 'static-method' before 'public-method'
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
          } else if (member.type === 'TSIndexSignature') {
            if (member.static) {
              modifiers.push('static')
            }

            if (member.readonly) {
              modifiers.push('readonly')
            }

            selectors.push('index-signature')
          } else if (member.type === 'StaticBlock') {
            addSafetySemicolonWhenInline = false

            selectors.push('static-block')

            dependencies = extractDependencies(member, true)
          } else if (
            member.type === 'AccessorProperty' ||
            member.type === 'TSAbstractAccessorProperty'
          ) {
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
          } else {
            // Member is necessarily a Property
            // Similarly to above for methods, prioritize 'static', 'declare', 'decorated', 'abstract', 'override' and 'readonly'
            // Over accessibility modifiers
            if (member.static) {
              modifiers.push('static')
            }

            if (member.declare) {
              modifiers.push('declare')
            }

            if (member.type === 'TSAbstractPropertyDefinition') {
              modifiers.push('abstract')
            }

            if (decorated) {
              modifiers.push('decorated')
            }

            if (member.override) {
              modifiers.push('override')
            }

            if (member.readonly) {
              modifiers.push('readonly')
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
          }

          for (let officialGroup of generatePredefinedGroups({
            cache: cachedGroupsByModifiersAndSelectors,
            selectors,
            modifiers,
          })) {
            defineGroup(officialGroup)
          }

          for (let customGroup of options.customGroups) {
            if (
              customGroupMatches({
                elementValue: memberValue,
                elementName: name,
                customGroup,
                decorators,
                modifiers,
                selectors,
              })
            ) {
              defineGroup(customGroup.groupName, true)
              // If the custom group is not referenced in the `groups` option, it will be ignored
              if (getGroup() === customGroup.groupName) {
                break
              }
            }
          }

          // Members belonging to the same overload signature group should have the same size in order to keep line-length sorting between them consistent.
          // It is unclear what should be considered the size of an overload signature group. Take the size of the implementation by default.
          let overloadSignatureGroupMember = overloadSignatureGroups
            .find(overloadSignatures => overloadSignatures.includes(member))
            ?.at(-1)

          let sortingNode: SortingNodeWithDependencies = {
            dependencyName: getDependencyName({
              nodeNameWithoutStartingHash: name.startsWith('#')
                ? name.slice(1)
                : name,
              isStatic: modifiers.includes('static'),
              isPrivateHash,
            }),
            size: overloadSignatureGroupMember
              ? rangeToDiff(overloadSignatureGroupMember, sourceCode)
              : rangeToDiff(member, sourceCode),
            isEslintDisabled: isNodeEslintDisabled(member, eslintDisabledLines),
            addSafetySemicolonWhenInline,
            group: getGroup(),
            node: member,

            dependencies,
            name,
          }

          let lastMember = accumulator.at(-1)?.at(-1)

          if (
            (options.partitionByNewLine &&
              lastMember &&
              getLinesBetween(sourceCode, lastMember, sortingNode)) ||
            (options.partitionByComment &&
              hasPartitionComment(
                options.partitionByComment,
                getCommentsBefore({
                  node: member,
                  sourceCode,
                }),
              ))
          ) {
            accumulator.push([])
          }

          accumulator.at(-1)!.push(sortingNode)

          return accumulator
        },
        [[]],
      )

      let sortNodesIgnoringEslintDisabledNodes = (
        ignoreEslintDisabledNodes: boolean,
      ): SortingNodeWithDependencies[] =>
        sortNodesByDependencies(
          formattedNodes.flatMap(nodes =>
            sortNodesByGroups(nodes, options, {
              isNodeIgnored: sortingNode =>
                getGroupNumber(options.groups, sortingNode) ===
                options.groups.length,
              getGroupCompareOptions: groupNumber =>
                getCompareOptions(options, groupNumber),
              ignoreEslintDisabledNodes,
            }),
          ),
          {
            ignoreEslintDisabledNodes,
          },
        )
      let sortedNodes = sortNodesIgnoringEslintDisabledNodes(false)
      let sortedNodesExcludingEslintDisabled =
        sortNodesIgnoringEslintDisabledNodes(true)
      let nodes = formattedNodes.flat()

      pairwise(nodes, (left, right) => {
        let leftNumber = getGroupNumber(options.groups, left)
        let rightNumber = getGroupNumber(options.groups, right)

        let indexOfLeft = sortedNodes.indexOf(left)
        let indexOfRight = sortedNodes.indexOf(right)
        let indexOfRightExcludingEslintDisabled =
          sortedNodesExcludingEslintDisabled.indexOf(right)

        let messageIds: MESSAGE_ID[] = []
        let firstUnorderedNodeDependentOnRight =
          getFirstUnorderedNodeDependentOn(right, nodes)
        if (
          firstUnorderedNodeDependentOnRight ||
          indexOfLeft > indexOfRight ||
          indexOfLeft >= indexOfRightExcludingEslintDisabled
        ) {
          if (firstUnorderedNodeDependentOnRight) {
            messageIds.push('unexpectedClassesDependencyOrder')
          } else {
            messageIds.push(
              leftNumber === rightNumber
                ? 'unexpectedClassesOrder'
                : 'unexpectedClassesGroupOrder',
            )
          }
        }

        messageIds = [
          ...messageIds,
          ...getNewlinesErrors({
            missedSpacingError: 'missedSpacingBetweenClassMembers',
            extraSpacingError: 'extraSpacingBetweenClassMembers',
            rightNum: rightNumber,
            leftNum: leftNumber,
            sourceCode,
            options,
            right,
            left,
          }),
        ]

        for (let messageId of messageIds) {
          context.report({
            fix: (fixer: TSESLint.RuleFixer) => [
              ...makeFixes({
                sortedNodes: sortedNodesExcludingEslintDisabled,
                sourceCode,
                options,
                fixer,
                nodes,
              }),
              ...makeNewlinesFixes({
                sortedNodes: sortedNodesExcludingEslintDisabled,
                sourceCode,
                options,
                fixer,
                nodes,
              }),
            ],
            data: {
              nodeDependentOnRight: firstUnorderedNodeDependentOnRight?.name,
              right: toSingleLine(right.name),
              left: toSingleLine(left.name),
              rightGroup: right.group,
              leftGroup: left.group,
            },
            node: right.node,
            messageId,
          })
        }
      })
    },
  }),
  meta: {
    schema: [
      {
        properties: {
          customGroups: {
            items: {
              oneOf: [
                {
                  properties: {
                    ...customGroupNameJsonSchema,
                    ...customGroupSortJsonSchema,
                    anyOf: {
                      items: {
                        properties: {
                          ...singleCustomGroupJsonSchema,
                        },
                        description: 'Custom group.',
                        additionalProperties: false,
                        type: 'object',
                      },
                      type: 'array',
                    },
                  },
                  description: 'Custom group block.',
                  additionalProperties: false,
                  type: 'object',
                },
                {
                  properties: {
                    ...customGroupNameJsonSchema,
                    ...customGroupSortJsonSchema,
                    ...singleCustomGroupJsonSchema,
                  },
                  description: 'Custom group.',
                  additionalProperties: false,
                  type: 'object',
                },
              ],
            },
            description: 'Specifies custom groups.',
            type: 'array',
          },
          ignoreCallbackDependenciesPatterns: {
            description:
              'Patterns that should be ignored when detecting dependencies in method callbacks.',
            items: {
              type: 'string',
            },
            type: 'array',
          },
          partitionByComment: {
            ...partitionByCommentJsonSchema,
            description:
              'Allows to use comments to separate the class members into logical groups.',
          },
          partitionByNewLine: partitionByNewLineJsonSchema,
          specialCharacters: specialCharactersJsonSchema,
          newlinesBetween: newlinesBetweenJsonSchema,
          ignoreCase: ignoreCaseJsonSchema,
          locales: localesJsonSchema,
          groups: groupsJsonSchema,
          order: orderJsonSchema,
          type: typeJsonSchema,
        },
        additionalProperties: false,
        type: 'object',
      },
    ],
    messages: {
      unexpectedClassesGroupOrder:
        'Expected "{{right}}" ({{rightGroup}}) to come before "{{left}}" ({{leftGroup}}).',
      unexpectedClassesDependencyOrder:
        'Expected dependency "{{right}}" to come before "{{nodeDependentOnRight}}".',
      missedSpacingBetweenClassMembers:
        'Missed spacing between "{{left}}" and "{{right}}" objects.',
      extraSpacingBetweenClassMembers:
        'Extra spacing between "{{left}}" and "{{right}}" objects.',
      unexpectedClassesOrder: 'Expected "{{right}}" to come before "{{left}}".',
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
