import type { TSESTree } from '@typescript-eslint/types'

import type { SortingNode } from '../typings'

import { createEslintRule } from '../utils/create-eslint-rule'
import { getLinesBetween } from '../utils/get-lines-between'
import { getGroupNumber } from '../utils/get-group-number'
import { getSourceCode } from '../utils/get-source-code'
import { toSingleLine } from '../utils/to-single-line'
import { rangeToDiff } from '../utils/range-to-diff'
import { isPositive } from '../utils/is-positive'
import { sortNodes } from '../utils/sort-nodes'
import { makeFixes } from '../utils/make-fixes'
import { useGroups } from '../utils/use-groups'
import { complete } from '../utils/complete'
import { pairwise } from '../utils/pairwise'
import { compare } from '../utils/compare'

type MESSAGE_ID = 'unexpectedObjectTypesOrder'

type Group<T extends string[]> = 'multiline' | 'unknown' | T[number]

type Options<T extends string[]> = [
  Partial<{
    groupKind: 'required-first' | 'optional-first' | 'mixed'
    type: 'alphabetical' | 'line-length' | 'natural'
    groups: (Group<T>[] | Group<T>)[]
    partitionByNewLine: boolean
    order: 'desc' | 'asc'
    ignoreCase: boolean
    customGroups: {}
  }>,
]

export default createEslintRule<Options<string[]>, MESSAGE_ID>({
  name: 'sort-object-types',
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Enforce sorted object types.',
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
          partitionByNewLine: {
            description:
              'Allows to use spaces to separate the nodes into logical groups.',
            type: 'boolean',
          },
          groupKind: {
            description: 'Specifies top-level groups.',
            type: 'string',
            enum: ['mixed', 'required-first', 'optional-first'],
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
      unexpectedObjectTypesOrder:
        'Expected "{{right}}" to come before "{{left}}".',
    },
  },
  defaultOptions: [
    {
      type: 'alphabetical',
      order: 'asc',
      ignoreCase: true,
      partitionByNewLine: false,
      groupKind: 'mixed',
      groups: [],
      customGroups: {},
    },
  ],
  create: context => ({
    TSTypeLiteral: node => {
      if (node.members.length > 1) {
        let options = complete(context.options.at(0), {
          partitionByNewLine: false,
          type: 'alphabetical',
          groupKind: 'mixed',
          ignoreCase: true,
          customGroups: {},
          order: 'asc',
          groups: [],
        } as const)

        let sourceCode = getSourceCode(context)

        let formattedMembers: SortingNode<TSESTree.TypeElement>[][] =
          node.members.reduce(
            (accumulator: SortingNode<TSESTree.TypeElement>[][], member) => {
              let name: string
              let raw = sourceCode.text.slice(
                member.range.at(0),
                member.range.at(1),
              )
              let lastMember = accumulator.at(-1)?.at(-1)

              let { getGroup, defineGroup, setCustomGroups } = useGroups(
                options.groups,
              )

              let formatName = (value: string): string =>
                value.replace(/(,|;)$/, '')

              if (member.type === 'TSPropertySignature') {
                if (member.key.type === 'Identifier') {
                  ;({ name } = member.key)
                } else if (member.key.type === 'Literal') {
                  name = `${member.key.value}`
                } else {
                  name = sourceCode.text.slice(
                    member.range.at(0),
                    member.typeAnnotation?.range.at(0),
                  )
                }
              } else if (member.type === 'TSIndexSignature') {
                let endIndex: number =
                  member.typeAnnotation?.range.at(0) ?? member.range.at(1)!

                name = formatName(
                  sourceCode.text.slice(member.range.at(0), endIndex),
                )
              } else {
                name = formatName(
                  sourceCode.text.slice(member.range.at(0), member.range.at(1)),
                )
              }

              setCustomGroups(options.customGroups, name)

              if (member.loc.start.line !== member.loc.end.line) {
                defineGroup('multiline')
              }

              let endsWithComma = raw.endsWith(';') || raw.endsWith(',')
              let endSize = endsWithComma ? 1 : 0

              let memberSortingNode = {
                size: rangeToDiff(member.range) - endSize,
                node: member,
                name,
              }

              if (
                options.partitionByNewLine &&
                lastMember &&
                getLinesBetween(sourceCode, lastMember, memberSortingNode)
              ) {
                accumulator.push([])
              }

              accumulator.at(-1)?.push({
                ...memberSortingNode,
                group: getGroup(),
              })

              return accumulator
            },
            [[]],
          )

        for (let nodes of formattedMembers) {
          pairwise(nodes, (left, right) => {
            let leftNum = getGroupNumber(options.groups, left)
            let rightNum = getGroupNumber(options.groups, right)

            let getIsOptionalValue = (nodeValue: TSESTree.TypeElement) => {
              if (
                nodeValue.type === 'TSCallSignatureDeclaration' ||
                nodeValue.type === 'TSConstructSignatureDeclaration' ||
                nodeValue.type === 'TSIndexSignature'
              ) {
                return false
              }
              return nodeValue.optional
            }

            let isLeftOptional = getIsOptionalValue(left.node)
            let isRightOptional = getIsOptionalValue(right.node)

            let compareValue
            if (
              options.groupKind === 'optional-first' &&
              isLeftOptional &&
              !isRightOptional
            ) {
              compareValue = false
            } else if (
              options.groupKind === 'optional-first' &&
              !isLeftOptional &&
              isRightOptional
            ) {
              compareValue = true
            } else if (
              options.groupKind === 'required-first' &&
              !isLeftOptional &&
              isRightOptional
            ) {
              compareValue = false
            } else if (
              options.groupKind === 'required-first' &&
              isLeftOptional &&
              !isRightOptional
            ) {
              compareValue = true
            } else if (leftNum > rightNum) {
              compareValue = true
            } else if (leftNum === rightNum) {
              compareValue = isPositive(compare(left, right, options))
            } else {
              compareValue = false
            }

            if (compareValue) {
              context.report({
                messageId: 'unexpectedObjectTypesOrder',
                data: {
                  left: toSingleLine(left.name),
                  right: toSingleLine(right.name),
                },
                node: right.node,
                fix: fixer => {
                  let groupedByKind
                  if (options.groupKind !== 'mixed') {
                    groupedByKind = nodes.reduce<
                      SortingNode<TSESTree.TypeElement>[][]
                    >(
                      (accumulator, currentNode) => {
                        let requiredIndex =
                          options.groupKind === 'required-first' ? 0 : 1
                        let optionalIndex =
                          options.groupKind === 'required-first' ? 1 : 0

                        if (getIsOptionalValue(currentNode.node)) {
                          accumulator[optionalIndex].push(currentNode)
                        } else {
                          accumulator[requiredIndex].push(currentNode)
                        }
                        return accumulator
                      },
                      [[], []],
                    )
                  } else {
                    groupedByKind = [nodes]
                  }

                  let sortedNodes: SortingNode[] = []

                  for (let nodesByKind of groupedByKind) {
                    let grouped: {
                      [key: string]: SortingNode[]
                    } = {}

                    for (let currentNode of nodesByKind) {
                      let groupNum = getGroupNumber(options.groups, currentNode)

                      if (!(groupNum in grouped)) {
                        grouped[groupNum] = [currentNode]
                      } else {
                        grouped[groupNum] = sortNodes(
                          [...grouped[groupNum], currentNode],
                          options,
                        )
                      }
                    }

                    for (let group of Object.keys(grouped).sort(
                      (a, b) => Number(a) - Number(b),
                    )) {
                      sortedNodes.push(...sortNodes(grouped[group], options))
                    }
                  }

                  return makeFixes(fixer, nodes, sortedNodes, sourceCode)
                },
              })
            }
          })
        }
      }
    },
  }),
})
