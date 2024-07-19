import type { SortingNode } from '../typings'

import { createEslintRule } from '../utils/create-eslint-rule'
import { getSourceCode } from '../utils/get-source-code'
import { toSingleLine } from '../utils/to-single-line'
import { rangeToDiff } from '../utils/range-to-diff'
import { isPositive } from '../utils/is-positive'
import { sortNodes } from '../utils/sort-nodes'
import { makeFixes } from '../utils/make-fixes'
import { complete } from '../utils/complete'
import { pairwise } from '../utils/pairwise'
import { compare } from '../utils/compare'

type MESSAGE_ID = 'unexpectedUnionTypesOrder'

type Options = [
  Partial<{
    type: 'alphabetical' | 'line-length' | 'natural'
    order: 'desc' | 'asc'
    ignoreCase: boolean
  }>,
]

export const RULE_NAME = 'sort-union-types'

export default createEslintRule<Options, MESSAGE_ID>({
  name: RULE_NAME,
  meta: {
    type: 'suggestion',
    docs: {
      description: 'enforce sorted union types',
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
          ignoreCase: {
            type: 'boolean',
            default: true,
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      unexpectedUnionTypesOrder:
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
    TSUnionType: node => {
      let options = complete(context.options.at(0), {
        type: 'alphabetical',
        ignoreCase: true,
        order: 'asc',
      } as const)

      let sourceCode = getSourceCode(context)

      let nodes: SortingNode[] = node.types.map(type => ({
        name: sourceCode.text.slice(...type.range),
        size: rangeToDiff(type.range),
        node: type,
      }))

      pairwise(nodes, (left, right) => {
        let compareValue = isPositive(compare(left, right, options))

        if (compareValue) {
          context.report({
            messageId: 'unexpectedUnionTypesOrder',
            data: {
              left: toSingleLine(left.name),
              right: toSingleLine(right.name),
            },
            node: right.node,
            fix: fixer => {
              let sortedNodes: SortingNode[] = sortNodes(nodes, options)
              return makeFixes(fixer, nodes, sortedNodes, sourceCode)
            },
          })
        }
      })
    },
  }),
})
