import type { TSESTree } from '@typescript-eslint/types'
import type { TSESLint } from '@typescript-eslint/utils'

import type {
  SortClassesOptions,
  Modifier,
  Selector,
} from './sort-classes.types'
import type { SortingNodeWithDependencies } from '../utils/sort-nodes-by-dependencies'

import {
  validateGroupsConfiguration,
  getOverloadSignatureGroups,
  generateOfficialGroups,
  customGroupMatches,
  getCompareOptions,
} from './sort-classes-utils'
import {
  singleCustomGroupJsonSchema,
  customGroupNameJsonSchema,
  customGroupSortJsonSchema,
} from './sort-classes.types'
import {
  getFirstUnorderedNodeDependentOn,
  sortNodesByDependencies,
} from '../utils/sort-nodes-by-dependencies'
import { hasPartitionComment } from '../utils/is-partition-comment'
import { sortNodesByGroups } from '../utils/sort-nodes-by-groups'
import { getCommentsBefore } from '../utils/get-comments-before'
import { createEslintRule } from '../utils/create-eslint-rule'
import { getGroupNumber } from '../utils/get-group-number'
import { getSourceCode } from '../utils/get-source-code'
import { toSingleLine } from '../utils/to-single-line'
import { rangeToDiff } from '../utils/range-to-diff'
import { getSettings } from '../utils/get-settings'
import { useGroups } from '../utils/use-groups'
import { makeFixes } from '../utils/make-fixes'
import { complete } from '../utils/complete'
import { pairwise } from '../utils/pairwise'

type MESSAGE_ID =
  | 'unexpectedClassesDependencyOrder'
  | 'unexpectedClassesGroupOrder'
  | 'unexpectedClassesOrder'

const defaultGroups: SortClassesOptions[0]['groups'] = [
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
]

export default createEslintRule<SortClassesOptions, MESSAGE_ID>({
  name: 'sort-classes',
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Enforce sorted classes.',
    },
    fixable: 'code',
    schema: [
      {
        type: 'object',
        properties: {
          type: {
            description: 'Specifies the sorting method.',
            type: 'string',
            enum: ['alphabetical', 'natural', 'line-length'],
          },
          order: {
            description:
              'Determines whether the sorted items should be in ascending or descending order.',
            type: 'string',
            enum: ['asc', 'desc'],
          },
          matcher: {
            description: 'Specifies the string matcher.',
            type: 'string',
            enum: ['minimatch', 'regex'],
          },
          ignoreCase: {
            description:
              'Controls whether sorting should be case-sensitive or not.',
            type: 'boolean',
          },
          specialCharacters: {
            description:
              'Controls how special characters should be handled before sorting.',
            type: 'string',
            enum: ['remove', 'trim', 'keep'],
          },
          partitionByComment: {
            description:
              'Allows to use comments to separate the class members into logical groups.',
            anyOf: [
              {
                type: 'array',
                items: {
                  type: 'string',
                },
              },
              {
                type: 'boolean',
              },
              {
                type: 'string',
              },
            ],
          },
          groups: {
            description: 'Specifies the order of the groups.',
            type: 'array',
            items: {
              oneOf: [
                {
                  type: 'string',
                },
                {
                  type: 'array',
                  items: {
                    type: 'string',
                  },
                },
              ],
            },
          },
          customGroups: {
            description: 'Specifies custom groups.',
            type: 'array',
            items: {
              oneOf: [
                {
                  description: 'Custom group block.',
                  type: 'object',
                  additionalProperties: false,
                  properties: {
                    ...customGroupNameJsonSchema,
                    ...customGroupSortJsonSchema,
                    anyOf: {
                      type: 'array',
                      items: {
                        description: 'Custom group.',
                        type: 'object',
                        additionalProperties: false,
                        properties: {
                          ...singleCustomGroupJsonSchema,
                        },
                      },
                    },
                  },
                },
                {
                  description: 'Custom group.',
                  type: 'object',
                  additionalProperties: false,
                  properties: {
                    ...customGroupNameJsonSchema,
                    ...customGroupSortJsonSchema,
                    ...singleCustomGroupJsonSchema,
                  },
                },
              ],
            },
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      unexpectedClassesGroupOrder:
        'Expected "{{right}}" ({{rightGroup}}) to come before "{{left}}" ({{leftGroup}}).',
      unexpectedClassesOrder: 'Expected "{{right}}" to come before "{{left}}".',
      unexpectedClassesDependencyOrder:
        'Expected dependency "{{right}}" to come before "{{nodeDependentOnRight}}".',
    },
  },
  defaultOptions: [
    {
      type: 'alphabetical',
      order: 'asc',
      ignoreCase: true,
      specialCharacters: 'keep',
      matcher: 'minimatch',
      partitionByComment: false,
      groups: defaultGroups,
      customGroups: [],
    },
  ],
  create: context => ({
    ClassBody: node => {
      if (node.body.length > 1) {
        let settings = getSettings(context.settings)

        let options = complete(context.options.at(0), settings, {
          groups: defaultGroups,
          matcher: 'minimatch',
          partitionByComment: false,
          type: 'alphabetical',
          ignoreCase: true,
          specialCharacters: 'keep',
          customGroups: [],
          order: 'asc',
        } as const)

        validateGroupsConfiguration(options.groups, options.customGroups)

        let sourceCode = getSourceCode(context)
        let className = node.parent.id?.name

        let getDependencyName = (nodeName: string, isStatic: boolean) =>
          `${isStatic ? 'static ' : ''}${nodeName}`

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
                return getDependencyName(member.key.name, member.static)
              }
              return null
            })
            .filter(m => m !== null),
        )

        let extractDependencies = (
          expression: TSESTree.StaticBlock | TSESTree.Expression,
          isMemberStatic: boolean,
        ): string[] => {
          let dependencies: string[] = []

          let checkNode = (nodeValue: TSESTree.Node) => {
            if (
              nodeValue.type === 'MemberExpression' &&
              (nodeValue.object.type === 'ThisExpression' ||
                (nodeValue.object.type === 'Identifier' &&
                  nodeValue.object.name === className)) &&
              nodeValue.property.type === 'Identifier'
            ) {
              let isStaticDependency =
                isMemberStatic || nodeValue.object.type === 'Identifier'
              let dependencyName = getDependencyName(
                nodeValue.property.name,
                isStaticDependency,
              )
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
              nodeValue.elements
                .filter(currentNode => currentNode !== null)
                .forEach(traverseNode)
            }

            if ('argument' in nodeValue && nodeValue.argument) {
              traverseNode(nodeValue.argument)
            }

            if ('arguments' in nodeValue) {
              nodeValue.arguments.forEach(traverseNode)
            }

            if ('declarations' in nodeValue) {
              nodeValue.declarations.forEach(traverseNode)
            }

            if ('properties' in nodeValue) {
              nodeValue.properties.forEach(traverseNode)
            }

            if ('expressions' in nodeValue) {
              nodeValue.expressions.forEach(traverseNode)
            }
          }

          let traverseNode = (nodeValue: TSESTree.Node[] | TSESTree.Node) => {
            if (Array.isArray(nodeValue)) {
              nodeValue.forEach(traverseNode)
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
            let comments = getCommentsBefore(member, sourceCode)

            if (
              options.partitionByComment &&
              hasPartitionComment(
                options.partitionByComment,
                comments,
                options.matcher,
              )
            ) {
              accumulator.push([])
            }

            let name: string
            let dependencies: string[] = []
            let { getGroup, defineGroup } = useGroups(options)

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
              // we prioritize 'static' over those in cases like:
              // Config: ['static-method', 'public-method']
              // Element: public static method();
              // Element will be classified as 'static-method' before 'public-method'
              if (member.static) {
                modifiers.push('static')
              }
              if (member.type === 'TSAbstractMethodDefinition') {
                modifiers.push('abstract')
              } else {
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
              // over accessibility modifiers
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

              let isFunctionProperty =
                member.value?.type === 'ArrowFunctionExpression' ||
                member.value?.type === 'FunctionExpression'
              if (isFunctionProperty) {
                selectors.push('function-property')
              }

              if (!isFunctionProperty && member.value) {
                memberValue = sourceCode.getText(member.value)
              }

              selectors.push('property')

              if (
                member.type === 'PropertyDefinition' &&
                member.value &&
                !isFunctionProperty
              ) {
                dependencies = extractDependencies(member.value, member.static)
              }
            }

            for (let officialGroup of generateOfficialGroups(
              modifiers,
              selectors,
            )) {
              defineGroup(officialGroup)
            }

            for (let customGroup of options.customGroups) {
              if (
                customGroupMatches({
                  customGroup,
                  elementName: name,
                  elementValue: memberValue,
                  modifiers,
                  selectors,
                  decorators,
                  matcher: options.matcher,
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
              size: overloadSignatureGroupMember
                ? rangeToDiff(overloadSignatureGroupMember, sourceCode)
                : rangeToDiff(member, sourceCode),
              group: getGroup(),
              node: member,
              dependencies,
              name,
              addSafetySemicolonWhenInline,
              dependencyName: getDependencyName(
                name,
                modifiers.includes('static'),
              ),
            }

            accumulator.at(-1)!.push(sortingNode)

            return accumulator
          },
          [[]],
        )

        let sortedNodes = formattedNodes
          .map(nodes =>
            sortNodesByGroups(nodes, options, {
              getGroupCompareOptions: groupNumber =>
                getCompareOptions(options, groupNumber),
              isNodeIgnored: sortingNode =>
                getGroupNumber(options.groups, sortingNode) ===
                options.groups.length,
            }),
          )
          .flat()

        sortedNodes = sortNodesByDependencies(sortedNodes)
        let nodes = formattedNodes.flat()

        pairwise(nodes, (left, right) => {
          let leftNum = getGroupNumber(options.groups, left)
          let rightNum = getGroupNumber(options.groups, right)

          let indexOfLeft = sortedNodes.indexOf(left)
          let indexOfRight = sortedNodes.indexOf(right)
          let firstUnorderedNodeDependentOnRight =
            getFirstUnorderedNodeDependentOn(right, nodes)
          if (
            firstUnorderedNodeDependentOnRight ||
            indexOfLeft > indexOfRight
          ) {
            let messageId: MESSAGE_ID
            if (firstUnorderedNodeDependentOnRight) {
              messageId = 'unexpectedClassesDependencyOrder'
            } else {
              messageId =
                leftNum !== rightNum
                  ? 'unexpectedClassesGroupOrder'
                  : 'unexpectedClassesOrder'
            }
            context.report({
              messageId,
              data: {
                left: toSingleLine(left.name),
                leftGroup: left.group,
                right: toSingleLine(right.name),
                rightGroup: right.group,
                nodeDependentOnRight: firstUnorderedNodeDependentOnRight?.name,
              },
              node: right.node,
              fix: (fixer: TSESLint.RuleFixer) =>
                makeFixes(fixer, nodes, sortedNodes, sourceCode, options),
            })
          }
        })
      }
    },
  }),
})
