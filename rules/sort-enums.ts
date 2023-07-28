import { AST_NODE_TYPES } from '@typescript-eslint/types'

import type { SortingNode } from '../typings'

import { createEslintRule } from '../utils/create-eslint-rule'
import { toSingleLine } from '../utils/to-single-line'
import { rangeToDiff } from '../utils/range-to-diff'
import { SortOrder, SortType } from '../typings'
import { sortNodes } from '../utils/sort-nodes'
import { makeFixes } from '../utils/make-fixes'
import { complete } from '../utils/complete'
import { pairwise } from '../utils/pairwise'
import { compare } from '../utils/compare'

type MESSAGE_ID = 'unexpectedEnumsOrder'

type Options = [
  Partial<{
    'ignore-case': boolean
    order: SortOrder
    type: SortType
  }>,
]

export const RULE_NAME = 'sort-enums'

export default createEslintRule<Options, MESSAGE_ID>({
  name: RULE_NAME,
  meta: {
    type: 'suggestion',
    docs: {
      description: 'enforce sorted TypeScript enums',
      recommended: false,
    },
    fixable: 'code',
    schema: [
      {
        type: 'object',
        properties: {
          type: {
            enum: [
              SortType.alphabetical,
              SortType.natural,
              SortType['line-length'],
            ],
            default: SortType.alphabetical,
          },
          'ignore-case': {
            type: 'boolean',
            default: false,
          },
          order: {
            enum: [SortOrder.asc, SortOrder.desc],
            default: SortOrder.asc,
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
      type: SortType.alphabetical,
      order: SortOrder.asc,
    },
  ],
  create: context => ({
    TSEnumDeclaration: node => {
      if (
        node.members.length > 1 &&
        node.members.every(({ initializer }) => initializer)
      ) {
        let options = complete(context.options.at(0), {
          type: SortType.alphabetical,
          order: SortOrder.asc,
          'ignore-case': false,
        })

        let source = context.getSourceCode()

        let nodes: SortingNode[] = node.members.map(member => ({
          name:
            member.id.type === AST_NODE_TYPES.Literal
              ? `${member.id.value}`
              : `${source.text.slice(...member.id.range)}`,
          size: rangeToDiff(member.range),
          node: member,
        }))

        pairwise(nodes, (left, right) => {
          if (compare(left, right, options)) {
            context.report({
              messageId: 'unexpectedEnumsOrder',
              data: {
                left: toSingleLine(left.name),
                right: toSingleLine(right.name),
              },
              node: right.node,
              fix: fixer =>
                makeFixes(fixer, nodes, sortNodes(nodes, options), source),
            })
          }
        })
      }
    },
  }),
})
