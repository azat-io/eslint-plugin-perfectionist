import { minimatch } from 'minimatch'

import type { SortingNode } from '../typings'

import { createEslintRule } from '../utils/create-eslint-rule'
import { isMemberOptional } from '../utils/is-member-optional'
import { getLinesBetween } from '../utils/get-lines-between'
import { getGroupNumber } from '../utils/get-group-number'
import { toSingleLine } from '../utils/to-single-line'
import { rangeToDiff } from '../utils/range-to-diff'
import { isPositive } from '../utils/is-positive'
import { useGroups } from '../utils/use-groups'
import { sortNodes } from '../utils/sort-nodes'
import { makeFixes } from '../utils/make-fixes'
import { OptionalityOrder } from '../typings'
import { complete } from '../utils/complete'
import { pairwise } from '../utils/pairwise'
import { compare } from '../utils/compare'

type MESSAGE_ID = 'unexpectedInterfacePropertiesOrder'

type Group<T extends string[]> = 'multiline' | 'unknown' | T[number]

type Options<T extends string[]> = [
  Partial<{
    customGroups: { [key: string]: string[] | string }
    type: 'alphabetical' | 'line-length' | 'natural'
    optionalityOrder: OptionalityOrder
    groups: (Group<T>[] | Group<T>)[]
    partitionByNewLine: boolean
    ignorePattern: string[]
    order: 'desc' | 'asc'
    ignoreCase: boolean
  }>,
]

export const RULE_NAME = 'sort-interfaces'

export default createEslintRule<Options<string[]>, MESSAGE_ID>({
  name: RULE_NAME,
  meta: {
    type: 'suggestion',
    docs: {
      description: 'enforce sorted interface properties',
    },
    fixable: 'code',
    schema: [
      {
        type: 'object',
        properties: {
          customGroups: {
            type: 'object',
          },
          optionalityOrder: {
            enum: [
              OptionalityOrder.ignore,
              OptionalityOrder['optional-first'],
              OptionalityOrder['required-first'],
            ],
            default: OptionalityOrder.ignore,
            type: 'string',
          },
          type: {
            enum: ['alphabetical', 'natural', 'line-length'],
            default: 'alphabetical',
            type: 'string',
          },
          order: {
            enum: ['asc', 'desc'],
            default: 'asc',
            type: 'string',
          },
          ignoreCase: {
            type: 'boolean',
            default: false,
          },
          ignorePattern: {
            items: {
              type: 'string',
            },
            type: 'array',
          },
          groups: {
            type: 'array',
            default: [],
          },
          partitionByNewLine: {
            type: 'boolean',
            default: false,
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      unexpectedInterfacePropertiesOrder:
        'Expected "{{right}}" to come before "{{left}}"',
    },
  },
  defaultOptions: [
    {
      type: 'alphabetical',
      order: 'asc',
    },
  ],
  create: context => ({
    TSInterfaceDeclaration: node => {
      if (node.body.body.length > 1) {
        let options = complete(context.options.at(0), {
          optionalityOrder: OptionalityOrder.ignore,
          partitionByNewLine: false,
          type: 'alphabetical',
          ignoreCase: false,
          ignorePattern: [],
          customGroups: {},
          order: 'asc',
          groups: [],
        } as const)

        if (
          !options.ignorePattern.some(pattern =>
            minimatch(node.id.name, pattern, {
              nocomment: true,
            }),
          )
        ) {
          let formattedMembers: SortingNode[][] = node.body.body.reduce(
            (accumulator: SortingNode[][], element) => {
              if (element.type === 'TSCallSignatureDeclaration') {
                accumulator.push([])
                return accumulator
              }

              let lastElement = accumulator.at(-1)?.at(-1)
              let name: string

              let { getGroup, defineGroup, setCustomGroups } = useGroups(
                options.groups,
              )

              if (element.type === 'TSPropertySignature') {
                if (element.key.type === 'Identifier') {
                  ;({ name } = element.key)
                } else if (element.key.type === 'Literal') {
                  name = `${element.key.value}`
                } else {
                  let end: number =
                    element.typeAnnotation?.range.at(0) ??
                    element.range.at(1)! - (element.optional ? '?'.length : 0)

                  name = context.sourceCode.text.slice(element.range.at(0), end)
                }
              } else if (element.type === 'TSIndexSignature') {
                let endIndex: number =
                  element.typeAnnotation?.range.at(0) ?? element.range.at(1)!

                name = context.sourceCode.text.slice(
                  element.range.at(0),
                  endIndex,
                )
              } else {
                let endIndex: number =
                  element.returnType?.range.at(0) ?? element.range.at(1)!

                name = context.sourceCode.text.slice(
                  element.range.at(0),
                  endIndex,
                )
              }

              let elementSortingNode = {
                size: rangeToDiff(element.range),
                node: element,
                name,
              }

              if (
                options.partitionByNewLine &&
                lastElement &&
                getLinesBetween(
                  context.sourceCode,
                  lastElement,
                  elementSortingNode,
                )
              ) {
                accumulator.push([])
              }

              setCustomGroups(options.customGroups, name)

              if (element.loc.start.line !== element.loc.end.line) {
                defineGroup('multiline')
              }

              accumulator.at(-1)!.push({
                ...elementSortingNode,
                group: getGroup(),
              })

              return accumulator
            },
            [[]],
          )

          let toSorted = (nodes: SortingNode[]) => {
            let grouped: {
              [key: string]: SortingNode[]
            } = {}

            for (let currentNode of nodes) {
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

            let sortedNodes: SortingNode[] = []

            for (let group of Object.keys(grouped).sort(
              (a, b) => Number(a) - Number(b),
            )) {
              sortedNodes.push(...sortNodes(grouped[group], options))
            }

            return sortedNodes
          }

          let checkGroupSort = (left: SortingNode, right: SortingNode) => {
            let leftNum = getGroupNumber(options.groups, left)
            let rightNum = getGroupNumber(options.groups, right)

            return (
              leftNum > rightNum ||
              (leftNum === rightNum &&
                isPositive(compare(left, right, options)))
            )
          }

          let { optionalityOrder } = options

          let checkOrder = (
            members: SortingNode[],
            left: SortingNode,
            right: SortingNode,
            iteration: number,
          ) => {
            if (optionalityOrder === OptionalityOrder.ignore) {
              return checkGroupSort(left, right)
            }

            let switchIndex = members.findIndex(
              (_, i) =>
                i &&
                isMemberOptional(members[i - 1].node) !==
                  isMemberOptional(members[i].node),
            )

            if (iteration < switchIndex && iteration + 1 !== switchIndex) {
              return checkGroupSort(left, right)
            }

            if (isMemberOptional(left.node) !== isMemberOptional(right.node)) {
              return (
                isMemberOptional(left.node) !==
                (optionalityOrder === OptionalityOrder['optional-first'])
              )
            }

            return checkGroupSort(left, right)
          }

          for (let nodes of formattedMembers) {
            pairwise(nodes, (left, right, iteration) => {
              if (checkOrder(nodes, left, right, iteration)) {
                context.report({
                  messageId: 'unexpectedInterfacePropertiesOrder',
                  data: {
                    left: toSingleLine(left.name),
                    right: toSingleLine(right.name),
                  },
                  node: right.node,
                  fix: fixer => {
                    let sortedNodes

                    if (optionalityOrder !== OptionalityOrder.ignore) {
                      let optionalNodes = nodes.filter(member =>
                        isMemberOptional(member.node),
                      )
                      let requiredNodes = nodes.filter(
                        member => !isMemberOptional(member.node),
                      )

                      sortedNodes =
                        optionalityOrder === OptionalityOrder['optional-first']
                          ? [
                              ...toSorted(optionalNodes),
                              ...toSorted(requiredNodes),
                            ]
                          : [
                              ...toSorted(requiredNodes),
                              ...toSorted(optionalNodes),
                            ]
                    } else {
                      sortedNodes = toSorted(nodes)
                    }

                    return makeFixes(
                      fixer,
                      nodes,
                      sortedNodes,
                      context.sourceCode,
                    )
                  },
                })
              }
            })
          }
        }
      }
    },
  }),
})
