import type { TSESTree } from '@typescript-eslint/types'
import type { TSESLint } from '@typescript-eslint/utils'

import type { SortingNode } from '../../typings'

import { isPartitionComment } from '../../utils/is-partition-comment'
import { getCommentBefore } from '../../utils/get-comment-before'
import { createEslintRule } from '../../utils/create-eslint-rule'
import { getGroupNumber } from '../../utils/get-group-number'
import { generateOfficialGroups } from './sort-classes-utils'
import { getSourceCode } from '../../utils/get-source-code'
import { toSingleLine } from '../../utils/to-single-line'
import { rangeToDiff } from '../../utils/range-to-diff'
import { isPositive } from '../../utils/is-positive'
import { useGroups } from '../../utils/use-groups'
import { sortNodes } from '../../utils/sort-nodes'
import { makeFixes } from '../../utils/make-fixes'
import { complete } from '../../utils/complete'
import { pairwise } from '../../utils/pairwise'
import { compare } from '../../utils/compare'

type MESSAGE_ID = 'unexpectedClassesOrder'

type Group = 'unknown' | string

type Options = [
  Partial<{
    customGroups: { [key: string]: string[] | string }
    type: 'alphabetical' | 'line-length' | 'natural'
    partitionByComment: string[] | boolean | string
    groups: (Group[] | Group)[]
    order: 'desc' | 'asc'
    ignoreCase: boolean
  }>,
]

export default createEslintRule<Options, MESSAGE_ID>({
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
        },
        additionalProperties: false,
      },
    ],
    messages: {
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
        'index-signature',
        'static-property',
        'protected-property',
        'private-property',
        'property',
        'constructor',
        'static-method',
        'protected-method',
        'private-method',
        'method',
        ['get-method', 'set-method'],
        'unknown',
      ],
      customGroups: {},
    },
  ],
  create: context => ({
    ClassBody: node => {
      if (node.body.length > 1) {
        let options = complete(context.options.at(0), {
          groups: [
            'index-signature',
            'static-property',
            'protected-property',
            'private-property',
            'property',
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
          customGroups: {},
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

            let isPrivateName = name.startsWith('_') || name.startsWith('#')
            let decorated =
              'decorators' in member && member.decorators.length > 0

            let modifiers: string[] = []
            let selectors: string[] = []
            if (
              member.type === 'MethodDefinition' ||
              member.type === 'TSAbstractMethodDefinition'
            ) {
              // By putting the abstract modifier before accessibility modifiers,
              // we prioritize 'abstract' over those in cases like:
              // Config: ['abstract-method', 'public-method']
              // Element: public abstract method();
              // Element will be classified as 'abstract-method' before 'public-method'
              if (member.type === 'TSAbstractMethodDefinition') {
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
              } else if (member.accessibility === 'private' || isPrivateName) {
                modifiers.push('private')
              } else {
                modifiers.push('public')
              }
              if (member.static) {
                modifiers.push('static')
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
              selectors.push('index-signature')
            } else if (
              member.type === 'AccessorProperty' ||
              member.type === 'TSAbstractAccessorProperty'
            ) {
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
              } else if (member.accessibility === 'private' || isPrivateName) {
                modifiers.push('private')
              } else {
                modifiers.push('public')
              }
              if (member.static) {
                modifiers.push('static')
              }
              selectors.push('accessor-property')
            } else if (
              member.type === 'PropertyDefinition' ||
              member.type === 'TSAbstractPropertyDefinition'
            ) {
              // Similarly to above for methods, prioritize 'abstract', 'override' and 'readonly'
              // over accessibility modifiers
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
              } else if (member.accessibility === 'private' || isPrivateName) {
                modifiers.push('private')
              } else {
                modifiers.push('public')
              }

              if (member.static) {
                modifiers.push('static')
              }

              selectors.push('property')
            }
            for (let officialGroup of generateOfficialGroups(
              modifiers,
              selectors,
            )) {
              defineGroup(officialGroup)
            }
            setCustomGroups(options.customGroups, name, {
              override: true,
            })

            if (member.type === 'PropertyDefinition' && member.value) {
              dependencies = extractDependencies(member.value)
            }

            let value = {
              size: rangeToDiff(member.range),
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

            if (
              left.name !== right.name &&
              (leftNum > rightNum ||
                (leftNum === rightNum &&
                  isPositive(compare(left, right, options))))
            ) {
              context.report({
                messageId: 'unexpectedClassesOrder',
                data: {
                  left: toSingleLine(left.name),
                  right: toSingleLine(right.name),
                },
                node: right.node,
                fix: (fixer: TSESLint.RuleFixer) => {
                  let grouped = nodes.reduce(
                    (
                      accumulator: {
                        [key: string]: SortingNode[]
                      },
                      sortingNode,
                    ) => {
                      let groupNum = getGroupNumber(options.groups, sortingNode)

                      if (!(groupNum in accumulator)) {
                        accumulator[groupNum] = [sortingNode]
                      } else {
                        accumulator[groupNum] = sortNodes(
                          [...accumulator[groupNum], sortingNode],
                          options,
                        )
                      }

                      return accumulator
                    },
                    {},
                  )

                  let sortedNodes: SortingNode[] = []

                  for (let group of Object.keys(grouped).sort(
                    (a, b) => Number(a) - Number(b),
                  )) {
                    sortedNodes.push(...sortNodes(grouped[group], options))
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
