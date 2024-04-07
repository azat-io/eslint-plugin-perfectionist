import type { SortingNode } from '../typings'

import { createEslintRule } from '../utils/create-eslint-rule'
import { toSingleLine } from '../utils/to-single-line'
import { rangeToDiff } from '../utils/range-to-diff'
import { isPositive } from '../utils/is-positive'
import { SortOrder, SortType } from '../typings'
import { sortNodes } from '../utils/sort-nodes'
import { makeFixes } from '../utils/make-fixes'
import { complete } from '../utils/complete'
import { pairwise } from '../utils/pairwise'
import { compare } from '../utils/compare'

type MESSAGE_ID = 'unexpectedIntersectionTypesOrder'

type Options = [
  Partial<{
    'ignore-case': boolean
    order: SortOrder
    type: SortType
  }>,
]

export const RULE_NAME = 'sort-intersection-types'

export default createEslintRule<Options, MESSAGE_ID>({
  name: RULE_NAME,
  meta: {
    type: 'suggestion',
    docs: {
      description: 'enforce sorted intersection types',
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
        },
        additionalProperties: false,
      },
    ],
    messages: {
      unexpectedIntersectionTypesOrder:
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
    TSIntersectionType: node => {
      let options = complete(context.options.at(0), {
        type: SortType.alphabetical,
        'ignore-case': false,
        order: SortOrder.asc,
      })

      let nodes: SortingNode[] = node.types.map(type => ({
        group:
          type.type === 'TSNullKeyword' || type.type === 'TSUndefinedKeyword'
            ? 'nullable'
            : 'unknown',
        name: context.sourceCode.text.slice(...type.range),
        size: rangeToDiff(type.range),
        node: type,
      }))

      pairwise(nodes, (left, right) => {
        let compareValue = isPositive(compare(left, right, options))

        if (compareValue) {
          context.report({
            messageId: 'unexpectedIntersectionTypesOrder',
            data: {
              left: toSingleLine(left.name),
              right: toSingleLine(right.name),
            },
            node: right.node,
            fix: fixer => {
              let sortedNodes = sortNodes(nodes, options)

              return makeFixes(fixer, nodes, sortedNodes, context.sourceCode)
            },
          })
        }
      })
    },
  }),
})
