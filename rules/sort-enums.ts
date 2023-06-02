import type { SortingNode } from '../typings'

import { AST_NODE_TYPES } from '@typescript-eslint/types'

import { createEslintRule } from '../utils/create-eslint-rule'
import { rangeToDiff } from '../utils/range-to-diff'
import { SortType, SortOrder } from '../typings'
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
            default: SortType.natural,
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
      unexpectedEnumsOrder: 'Expected "{{second}}" to come before "{{first}}"',
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
      let options = complete(context.options.at(0), {
        type: SortType.alphabetical,
        order: SortOrder.asc,
        'ignore-case': false,
      })

      if (node.members.length > 1) {
        let source = context.getSourceCode()

        let nodes: SortingNode[] = node.members.map(member => ({
          name:
            member.id.type === AST_NODE_TYPES.Literal
              ? `${member.id.value}`
              : `${source.text.slice(...member.id.range)}`,
          size: rangeToDiff(member.range),
          node: member,
        }))

        pairwise(nodes, (first, second) => {
          if (compare(first, second, options)) {
            context.report({
              messageId: 'unexpectedEnumsOrder',
              data: {
                first: first.name,
                second: second.name,
              },
              node: second.node,
              fix: fixer =>
                makeFixes(fixer, nodes, sortNodes(nodes, options), source),
            })
          }
        })
      }
    },
  }),
})
