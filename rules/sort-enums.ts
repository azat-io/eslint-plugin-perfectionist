import type { TSESTree } from '@typescript-eslint/types'

import type { PartitionComment } from '../typings'

import { isPartitionComment } from '../utils/is-partition-comment'
import { createSortingRule } from '../utils/create-sorting-rule'
import { createEslintRule } from '../utils/create-eslint-rule'
import { getCommentBefore } from '../utils/get-comment-before'
import { complete } from '../utils/complete'

type MESSAGE_ID = 'unexpectedEnumsOrder'

type Options = [
  Partial<{
    type: 'alphabetical' | 'line-length' | 'natural'
    'partition-by-comment': PartitionComment
    'ignore-case': boolean
    order: 'desc' | 'asc'
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
          'ignore-case': {
            type: 'boolean',
            default: false,
          },
          'partition-by-comment': {
            type: ['boolean', 'string', 'array'],
            default: false,
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
          'partition-by-comment': false,
          type: 'alphabetical',
          'ignore-case': false,
          order: 'asc',
        } as const)

        let parts = node.members.reduce(
          (accumulator: TSESTree.TSEnumMember[][], member) => {
            let comment = getCommentBefore(member, context.sourceCode)
            if (
              options['partition-by-comment'] &&
              comment &&
              isPartitionComment(options['partition-by-comment'], comment.value)
            ) {
              accumulator.push([])
            }
            accumulator.at(-1)!.push(member)
            return accumulator
          },
          [[]],
        )

        for (let nodes of parts) {
          createSortingRule({
            getName: member =>
              member.id.type === 'Literal'
                ? `${member.id.value}`
                : `${context.sourceCode.text.slice(...member.id.range)}`,
            unexpectedOrderMessage: 'unexpectedEnumsOrder',
            context,
            options,
            nodes,
          })
        }
      }
    },
  }),
})
