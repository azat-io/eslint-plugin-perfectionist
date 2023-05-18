import { createEslintRule } from '~/utils/create-eslint-rule'
import { rangeToDiff } from '~/utils/range-to-diff'
import { SortType, SortOrder } from '~/typings'
import { sortNodes } from '~/utils/sort-nodes'
import type { SortingNode } from '~/typings'
import { complete } from '~/utils/complete'
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
    messages: {
      unexpectedUnionTypesOrder: 'Expected "{{second}}" to come before "{{first}}"',
    },
    fixable: 'code',
    schema: [
      {
        type: 'object',
        properties: {
          type: {
            enum: [SortType.natural, SortType['line-length']],
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
  },
  defaultOptions: [
    {
      type: SortType.natural,
      order: SortOrder.asc,
    },
  ],
  create: context => ({
    TSUnionType: node => {
      let source = context.getSourceCode().text

      let options = complete(context.options.at(0), {
        type: SortType.natural,
        order: SortOrder.asc,
      })

      let values: SortingNode[] = node.types.map(type => {
        let { range } = type
        let name: string = source.slice(...range)

        return {
          size: rangeToDiff(range),
          node: type,
          name,
        }
      })

      for (let i = 1; i < values.length; i++) {
        let firstIndex = i - 1
        let secondIndex = i
        let first = values.at(firstIndex)!
        let second = values.at(secondIndex)!

        if (compare(first, second, options)) {
          let secondNode = node.types[secondIndex]

          context.report({
            messageId: 'unexpectedUnionTypesOrder',
            data: {
              first: first.name,
              second: second.name,
            },
            node: secondNode,
            fix: fixer => {
              let sourceCode = context.getSourceCode()
              let { text } = sourceCode
              return sortNodes(fixer, text, values, options)
            },
          })
        }
      }
    },
  }),
})
