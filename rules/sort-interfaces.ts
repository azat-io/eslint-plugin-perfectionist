import { minimatch } from 'minimatch'

import type { SortingNode } from '../typings'

import { createEslintRule } from '../utils/create-eslint-rule'
import { getLinesBetween } from '../utils/get-lines-between'
import { getGroupNumber } from '../utils/get-group-number'
import { toSingleLine } from '../utils/to-single-line'
import { rangeToDiff } from '../utils/range-to-diff'
import { isPositive } from '../utils/is-positive'
import { SortOrder, SortType } from '../typings'
import { useGroups } from '../utils/use-groups'
import { sortNodes } from '../utils/sort-nodes'
import { makeFixes } from '../utils/make-fixes'
import { complete } from '../utils/complete'
import { pairwise } from '../utils/pairwise'
import { compare } from '../utils/compare'

type MESSAGE_ID = 'unexpectedInterfacePropertiesOrder'

type Group<T extends string[]> = 'multiline' | 'unknown' | T[number]

type Options<T extends string[]> = [
  Partial<{
    'custom-groups': { [key: string]: string[] | string }
    groups: (Group<T>[] | Group<T>)[]
    'partition-by-new-line': boolean
    'ignore-pattern': string[]
    'ignore-case': boolean
    order: SortOrder
    type: SortType
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
          'custom-groups': {
            type: 'object',
          },
          type: {
            enum: [
              SortType.alphabetical,
              SortType.natural,
              SortType['line-length'],
            ],
            default: SortType.alphabetical,
            type: 'string',
          },
          order: {
            enum: [SortOrder.asc, SortOrder.desc],
            default: SortOrder.asc,
            type: 'string',
          },
          'ignore-case': {
            type: 'boolean',
            default: false,
          },
          'ignore-pattern': {
            items: {
              type: 'string',
            },
            type: 'array',
          },
          groups: {
            type: 'array',
            default: [],
          },
          'partition-by-new-line': {
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
      type: SortType.alphabetical,
      order: SortOrder.asc,
    },
  ],
  create: context => ({
    TSInterfaceDeclaration: node => {
      if (node.body.body.length > 1) {
        let options = complete(context.options.at(0), {
          'partition-by-new-line': false,
          type: SortType.alphabetical,
          'ignore-case': false,
          order: SortOrder.asc,
          'ignore-pattern': [],
          'custom-groups': {},
          groups: [],
        })

        if (
          !options['ignore-pattern'].some(pattern =>
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
                options['partition-by-new-line'] &&
                lastElement &&
                getLinesBetween(
                  context.sourceCode,
                  lastElement,
                  elementSortingNode,
                )
              ) {
                accumulator.push([])
              }

              setCustomGroups(options['custom-groups'], name)

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

          for (let nodes of formattedMembers) {
            pairwise(nodes, (left, right) => {
              let leftNum = getGroupNumber(options.groups, left)
              let rightNum = getGroupNumber(options.groups, right)

              if (
                leftNum > rightNum ||
                (leftNum === rightNum &&
                  isPositive(compare(left, right, options)))
              ) {
                context.report({
                  messageId: 'unexpectedInterfacePropertiesOrder',
                  data: {
                    left: toSingleLine(left.name),
                    right: toSingleLine(right.name),
                  },
                  node: right.node,
                  fix: fixer => {
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

                    for (let group of Object.keys(grouped).sort()) {
                      sortedNodes.push(...sortNodes(grouped[group], options))
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
