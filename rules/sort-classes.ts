import type { TSESTree } from '@typescript-eslint/types'
import type { TSESLint } from '@typescript-eslint/utils'

import type {
  SortClassesOptions,
  Modifier,
  Selector,
} from './sort-classes.types'
import type { SortingNode } from '../typings'

import {
  singleCustomGroupNameGroupSchema,
  singleCustomGroupSortGroupSchema,
  singleCustomGroupJsonSchema,
} from './sort-classes.types'
import {
  getOverloadSignatureGroups,
  generateOfficialGroups,
  customGroupMatches,
  getCompareOptions,
} from './sort-classes-utils'
import { isPartitionComment } from '../utils/is-partition-comment'
import { getCommentBefore } from '../utils/get-comment-before'
import { createEslintRule } from '../utils/create-eslint-rule'
import { getGroupNumber } from '../utils/get-group-number'
import { getSourceCode } from '../utils/get-source-code'
import { toSingleLine } from '../utils/to-single-line'
import { rangeToDiff } from '../utils/range-to-diff'
import { getSettings } from '../utils/get-settings'
import { isPositive } from '../utils/is-positive'
import { useGroups } from '../utils/use-groups'
import { sortNodes } from '../utils/sort-nodes'
import { makeFixes } from '../utils/make-fixes'
import { complete } from '../utils/complete'
import { pairwise } from '../utils/pairwise'
import { compare } from '../utils/compare'

type MESSAGE_ID = 'unexpectedClassesGroupOrder' | 'unexpectedClassesOrder'

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
          ignoreCase: {
            description:
              'Controls whether sorting should be case-sensitive or not.',
            type: 'boolean',
          },
          partitionByComment: {
            description:
              'Allows to use comments to separate the nodes into logical groups.',
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
            anyOf: [
              {
                type: 'object',
                additionalProperties: {
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
              {
                type: 'array',
                items: {
                  description: 'Advanced custom groups.',
                  oneOf: [
                    {
                      description: 'Custom group block.',
                      type: 'object',
                      additionalProperties: false,
                      properties: {
                        ...singleCustomGroupNameGroupSchema,
                        ...singleCustomGroupSortGroupSchema,
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
                        ...singleCustomGroupNameGroupSchema,
                        ...singleCustomGroupSortGroupSchema,
                        ...singleCustomGroupJsonSchema,
                      },
                    },
                  ],
                },
              },
            ],
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      unexpectedClassesGroupOrder:
        'Expected "{{right}}" ({{rightGroup}}) to come before "{{left}}" ({{leftGroup}}).',
      unexpectedClassesOrder: 'Expected "{{right}}" to come before "{{left}}".',
    },
  },
  defaultOptions: [
    {
      type: 'alphabetical',
      order: 'asc',
      ignoreCase: true,
      partitionByComment: false,
      groups: [
        'static-block',
        'index-signature',
        'static-property',
        ['protected-property', 'protected-accessor-property'],
        ['private-property', 'private-accessor-property'],
        ['property', 'accessor-property'],
        'constructor',
        'static-method',
        'protected-method',
        'private-method',
        'method',
        ['get-method', 'set-method'],
        'unknown',
      ],
      customGroups: [],
    },
  ],
  create: context => ({
    ClassBody: node => {
      if (node.body.length > 1) {
        let settings = getSettings(context.settings)

        let options = complete(context.options.at(0), settings, {
          groups: [
            'static-block',
            'index-signature',
            'static-property',
            ['protected-property', 'protected-accessor-property'],
            ['private-property', 'private-accessor-property'],
            ['property', 'accessor-property'],
            'constructor',
            'static-method',
            'protected-method',
            'private-method',
            'method',
            ['get-method', 'set-method'],
            'unknown',
          ],
          partitionByComment: false,
          type: 'alphabetical',
          ignoreCase: true,
          customGroups: [],
          order: 'asc',
        } as const)

        let sourceCode = getSourceCode(context)

        let extractDependencies = (
          expression: TSESTree.Expression,
        ): string[] => {
          let dependencies: string[] = []

          let checkNode = (nodeValue: TSESTree.Node) => {
            if (
              nodeValue.type === 'MemberExpression' &&
              nodeValue.object.type === 'ThisExpression' &&
              nodeValue.property.type === 'Identifier'
            ) {
              dependencies.push(nodeValue.property.name)
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

            if ('arguments' in nodeValue) {
              nodeValue.arguments.forEach(traverseNode)
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

        let formattedNodes: SortingNode[][] = node.body.reduce(
          (accumulator: SortingNode[][], member) => {
            let comment = getCommentBefore(member, sourceCode)

            if (
              options.partitionByComment &&
              comment &&
              isPartitionComment(options.partitionByComment, comment.value)
            ) {
              accumulator.push([])
            }

            let name: string
            let dependencies: string[] = []
            let { getGroup, defineGroup, setCustomGroups } = useGroups(
              options.groups,
            )

            if (member.type === 'StaticBlock') {
              name = 'static'
            } else if (member.type === 'TSIndexSignature') {
              name = sourceCode.text.slice(
                member.range.at(0),
                member.typeAnnotation?.range.at(0) ?? member.range.at(1),
              )
            } else {
              if (member.key.type === 'Identifier') {
                ;({ name } = member.key)
              } else {
                name = sourceCode.text.slice(...member.key.range)
              }
            }

            let isPrivateHash =
              'key' in member && member.key.type === 'PrivateIdentifier'
            let decorated =
              'decorators' in member && member.decorators.length > 0
            let decorators: string[] = []

            let modifiers: Modifier[] = []
            let selectors: Selector[] = []

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
              }

              if (decorated) {
                modifiers.push('decorated')
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
              selectors.push('static-block')
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
                selectors.push('function-property')
              }

              selectors.push('property')
            }
            for (let officialGroup of generateOfficialGroups(
              modifiers,
              selectors,
            )) {
              defineGroup(officialGroup)
            }

            if (Array.isArray(options.customGroups)) {
              for (let customGroup of options.customGroups) {
                if (
                  customGroupMatches({
                    customGroup,
                    elementName: name,
                    modifiers,
                    selectors,
                    decorators,
                  })
                ) {
                  defineGroup(customGroup.groupName, true)
                  break
                }
              }
            } else {
              setCustomGroups(options.customGroups, name, {
                override: true,
              })
            }

            if (member.type === 'PropertyDefinition' && member.value) {
              dependencies = extractDependencies(member.value)
            }

            // Members belonging to the same overload signature group should have the same size in order to keep line-length sorting between them consistent.
            // It is unclear what should be considered the size of an overload signature group. Take the size of the implementation by default.
            let overloadSignatureGroupMember = overloadSignatureGroups
              .find(overloadSignatures => overloadSignatures.includes(member))
              ?.at(-1)

            let value: SortingNode = {
              size: overloadSignatureGroupMember
                ? rangeToDiff(overloadSignatureGroupMember.range)
                : rangeToDiff(member.range),
              group: getGroup(),
              node: member,
              dependencies,
              name,
            }

            accumulator.at(-1)!.push(value)

            return accumulator
          },
          [[]],
        )

        for (let nodes of formattedNodes) {
          pairwise(nodes, (left, right) => {
            let leftNum = getGroupNumber(options.groups, left)
            let rightNum = getGroupNumber(options.groups, right)
            // Ignore nodes belonging to `unknown` group when that group is not referenced in the
            // `groups` option.
            let isLeftOrRightIgnored =
              leftNum === options.groups.length ||
              rightNum === options.groups.length
            if (isLeftOrRightIgnored) {
              continue;
            }

            let compareValue = false
            if (leftNum > rightNum) {
              compareValue = true
            } else if (leftNum === rightNum) {
              let compareOptions = getCompareOptions(options, leftNum)
              compareValue = compareOptions
                ? isPositive(compare(left, right, compareOptions))
                : false
            }

            if (compareValue) {
              context.report({
                messageId:
                  leftNum !== rightNum
                    ? 'unexpectedClassesGroupOrder'
                    : 'unexpectedClassesOrder',
                data: {
                  left: toSingleLine(left.name),
                  leftGroup: left.group,
                  right: toSingleLine(right.name),
                  rightGroup: right.group,
                },
                node: right.node,
                fix: (fixer: TSESLint.RuleFixer) => {
                  let nodesByGroupNumber: {
                    [key: number]: SortingNode[]
                  } = {}
                  for (let sortingNode of nodes) {
                    let groupNum = getGroupNumber(options.groups, sortingNode)
                    nodesByGroupNumber[groupNum] =
                      nodesByGroupNumber[groupNum] ?? []
                    nodesByGroupNumber[groupNum].push(sortingNode)
                  }
                  let sortedNodes: SortingNode[] = []
                  for (let groupNumber of Object.keys(nodesByGroupNumber).sort(
                    (a, b) => Number(a) - Number(b),
                  )) {
                    let compareOptions = getCompareOptions(
                      options,
                      Number(groupNumber),
                    )
                    if (!compareOptions) {
                      sortedNodes.push(
                        ...nodesByGroupNumber[Number(groupNumber)],
                      )
                      continue
                    }
                    sortedNodes.push(
                      ...sortNodes(
                        nodesByGroupNumber[Number(groupNumber)],
                        compareOptions,
                      ),
                    )
                  }

                  return makeFixes(fixer, nodes, sortedNodes, sourceCode, {
                    partitionComment: options.partitionByComment,
                  })
                },
              })
            }
          })
        }
      }
    },
  }),
})
