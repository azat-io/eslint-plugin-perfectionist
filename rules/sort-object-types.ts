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
    type: 'alphabetical' | 'line-length' | 'natural'
    groups: (Group<T>[] | Group<T>)[]
    partitionByNewLine: boolean
    order: 'desc' | 'asc'
    ignoreCase: boolean
    customGroups: {}
  }>,
]

export const RULE_NAME = 'sort-object-types'

export default createEslintRule<Options<string[]>, MESSAGE_ID>({
  name: RULE_NAME,
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Enforce sorted object types',
    },
    fixable: 'code',
    schema: [
      {
        type: 'object',
        properties: {
          customGroups: {
            type: 'object',
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
            default: true,
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
      unexpectedObjectTypesOrder:
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
    TSTypeLiteral: node => {
      if (node.members.length > 1) {
        let options = complete(context.options.at(0), {
          partitionByNewLine: false,
          type: 'alphabetical',
          ignoreCase: true,
          customGroups: {},
          order: 'asc',
          groups: [],
        } as const)

        let sourceCode = getSourceCode(context)

        let formattedMembers: SortingNode[][] = node.members.reduce(
          (accumulator: SortingNode[][], member) => {
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

            if (
              leftNum > rightNum ||
              (leftNum === rightNum &&
                isPositive(compare(left, right, options)))
            ) {
              context.report({
                messageId: 'unexpectedObjectTypesOrder',
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

                  for (let group of Object.keys(grouped).sort(
                    (a, b) => Number(a) - Number(b),
                  )) {
                    sortedNodes.push(...sortNodes(grouped[group], options))
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
