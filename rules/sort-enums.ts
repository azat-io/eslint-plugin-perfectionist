import type { PartitionComment, SortingNode } from '../typings'

import { isPartitionComment } from '../utils/is-partition-comment'
import { createEslintRule } from '../utils/create-eslint-rule'
import { getCommentBefore } from '../utils/get-comment-before'
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
    partitionByComment: PartitionComment
    order: 'desc' | 'asc'
    ignoreCase: boolean
  }>,
]

export const RULE_NAME = 'sort-enums'

export default createEslintRule<Options, MESSAGE_ID>({
  name: RULE_NAME,
  meta: {
    type: 'suggestion',
    docs: {
      description: 'enforce sorted TypeScript enums',
    },
    fixable: 'code',
    schema: [
      {
        type: 'object',
        properties: {
          partitionByComment: {
            default: false,
            type: ['boolean', 'string', 'array'],
          },
          type: {
            enum: ['alphabetical', 'natural', 'line-length'],
            default: 'alphabetical',
            type: 'string',
          },
          ignoreCase: {
            type: 'boolean',
            default: false,
          },
          order: {
            enum: ['asc', 'desc'],
            default: 'asc',
            type: 'string',
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      unexpectedEnumsOrder: 'Expected "{{right}}" to come before "{{left}}"',
    },
  },
  defaultOptions: [
    {
      type: 'alphabetical',
      order: 'asc',
    },
  ],
  create: context => ({
    TSEnumDeclaration: node => {
      if (
        node.members.length > 1 &&
        node.members.every(({ initializer }) => initializer)
      ) {
        let options = complete(context.options.at(0), {
          partitionByComment: false,
          type: 'alphabetical',
          ignoreCase: false,
          order: 'asc',
        } as const)

        let partitionComment = options.partitionByComment

        let formattedMembers: SortingNode[][] = node.members.reduce(
          (accumulator: SortingNode[][], member) => {
            let comment = getCommentBefore(member, context.sourceCode)

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
                : `${context.sourceCode.text.slice(...member.id.range)}`

            let sortingNode = {
              name,
              node: member,
              size: rangeToDiff(member.range),
            }
            accumulator.at(-1)!.push(sortingNode)
            return accumulator
          },
          [[]],
        )

        for (let nodes of formattedMembers) {
          pairwise(nodes, (left, right) => {
            if (isPositive(compare(left, right, options))) {
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
                    sortNodes(nodes, options),
                    context.sourceCode,
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
