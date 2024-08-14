import type { TSESTree } from '@typescript-eslint/types'

import type { CompareOptions } from '../utils/compare'
import type { SortingNode } from '../typings'

import { isPartitionComment } from '../utils/is-partition-comment'
import { createEslintRule } from '../utils/create-eslint-rule'
import { getCommentBefore } from '../utils/get-comment-before'
import { getSourceCode } from '../utils/get-source-code'
import { toSingleLine } from '../utils/to-single-line'
import { rangeToDiff } from '../utils/range-to-diff'
import { isPositive } from '../utils/is-positive'
import { sortNodes } from '../utils/sort-nodes'
import { makeFixes } from '../utils/make-fixes'
import { complete } from '../utils/complete'
import { pairwise } from '../utils/pairwise'
import { compare } from '../utils/compare'

type MESSAGE_ID = 'unexpectedEnumsOrder'

type Options = [
  Partial<{
    type: 'alphabetical' | 'line-length' | 'natural'
    partitionByComment: string[] | boolean | string
    compareValues: boolean
    order: 'desc' | 'asc'
    ignoreCase: boolean
  }>,
]

export default createEslintRule<Options, MESSAGE_ID>({
  name: 'sort-enums',
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Enforce sorted TypeScript enums.',
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
          compareValues: {
            description: 'Compare enum values instead of names.',
            type: 'boolean',
          },
          partitionByComment: {
            description:
              'Allows you to use comments to separate the class members into logical groups.',
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
        },
        additionalProperties: false,
      },
    ],
    messages: {
      unexpectedEnumsOrder: 'Expected "{{right}}" to come before "{{left}}".',
    },
  },
  defaultOptions: [
    {
      type: 'alphabetical',
      order: 'asc',
      ignoreCase: true,
      compareValues: false,
      partitionByComment: false,
    },
  ],
  create: context => ({
    TSEnumDeclaration: node => {
      let getMembers = (nodeValue: TSESTree.TSEnumDeclaration) =>
        /* v8 ignore next 2 */
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        node.body?.members ?? nodeValue.members ?? []
      if (
        getMembers(node).length > 1 &&
        getMembers(node).every(({ initializer }) => initializer)
      ) {
        let options = complete(context.options.at(0), {
          partitionByComment: false,
          type: 'alphabetical',
          ignoreCase: true,
          order: 'asc',
          compareValues: false,
        } as const)

        let sourceCode = getSourceCode(context)
        let partitionComment = options.partitionByComment

        let formattedMembers: SortingNode[][] = getMembers(node).reduce(
          (accumulator: SortingNode[][], member) => {
            let comment = getCommentBefore(member, sourceCode)

            if (
              partitionComment &&
              comment &&
              isPartitionComment(partitionComment, comment.value)
            ) {
              accumulator.push([])
            }

            let name =
              member.id.type === 'Literal'
                ? `${member.id.value}`
                : `${sourceCode.text.slice(...member.id.range)}`

            let sortingNode = {
              size: rangeToDiff(member.range),
              node: member,
              name,
            }
            accumulator.at(-1)!.push(sortingNode)
            return accumulator
          },
          [[]],
        )

        let compareOptions: CompareOptions = {
          type: options.type,
          order: options.order,
          ignoreCase: options.ignoreCase,
          nodeValueGetter: options.compareValues
            ? sortingNode => {
                if (
                  sortingNode.node.type === 'TSEnumMember' &&
                  sortingNode.node.initializer?.type === 'Literal'
                ) {
                  return sortingNode.node.initializer.value?.toString() ?? ''
                }
                return ''
              }
            : undefined,
        }
        for (let nodes of formattedMembers) {
          pairwise(nodes, (left, right) => {
            if (isPositive(compare(left, right, compareOptions))) {
              context.report({
                messageId: 'unexpectedEnumsOrder',
                data: {
                  left: toSingleLine(left.name),
                  right: toSingleLine(right.name),
                },
                node: right.node,
                fix: fixer =>
                  makeFixes(
                    fixer,
                    nodes,
                    sortNodes(nodes, compareOptions),
                    sourceCode,
                    { partitionComment },
                  ),
              })
            }
          })
        }
      }
    },
  }),
})
