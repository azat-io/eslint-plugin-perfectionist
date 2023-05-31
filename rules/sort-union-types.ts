import { createEslintRule } from '~/utils/create-eslint-rule'
import { toSingleLine } from '~/utils/to-single-line'
import { rangeToDiff } from '~/utils/range-to-diff'
import { SortType, SortOrder } from '~/typings'
import { sortNodes } from '~/utils/sort-nodes'
import type { SortingNode } from '~/typings'
import { complete } from '~/utils/complete'
import { pairwise } from '~/utils/pairwise'
import { compare } from '~/utils/compare'

type MESSAGE_ID = 'unexpectedUnionTypesOrder'

type Options = [
  Partial<{
    order: SortOrder
    type: SortType
  }>,
]

export const RULE_NAME = 'sort-union-types'

export default createEslintRule<Options, MESSAGE_ID>({
  name: RULE_NAME,
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Enforce sorted union types',
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
          order: {
            enum: [SortOrder.asc, SortOrder.desc],
            default: SortOrder.asc,
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      unexpectedUnionTypesOrder:
        'Expected "{{second}}" to come before "{{first}}"',
    },
  },
  defaultOptions: [
    {
      type: SortType.alphabetical,
      order: SortOrder.asc,
    },
  ],
  create: context => ({
    TSUnionType: node => {
      let source = context.getSourceCode()

      let options = complete(context.options.at(0), {
        type: SortType.alphabetical,
        order: SortOrder.asc,
      })

      let nodes: SortingNode[] = node.types.map(type => ({
        size: rangeToDiff(type.range),
        node: type,
        name: source.text.slice(...type.range),
      }))

      pairwise(nodes, (first, second) => {
        if (compare(first, second, options)) {
          context.report({
            messageId: 'unexpectedUnionTypesOrder',
            data: {
              first: toSingleLine(first.name),
              second: toSingleLine(second.name),
            },
            node: second.node,
            fix: fixer =>
              sortNodes(fixer, {
                options,
                source,
                nodes,
              }),
          })
        }
      })
    },
  }),
})
