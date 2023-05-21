import { createEslintRule } from '~/utils/create-eslint-rule'
import { rangeToDiff } from '~/utils/range-to-diff'
import { SortType, SortOrder } from '~/typings'
import { sortNodes } from '~/utils/sort-nodes'
import type { SortingNode } from '~/typings'
import { complete } from '~/utils/complete'
import { compare } from '~/utils/compare'

type MESSAGE_ID = 'unexpectedNamedImportsOrder'

type Options = [
  Partial<{
    order: SortOrder
    type: SortType
  }>,
]

export const RULE_NAME = 'sort-named-imports'

export default createEslintRule<Options, MESSAGE_ID>({
  name: RULE_NAME,
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Enforce sorted named imports',
      recommended: false,
    },
    messages: {
      unexpectedNamedImportsOrder: 'Expected "{{second}}" to come before "{{first}}"',
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
    ImportDeclaration: node => {
      let options = complete(context.options.at(0), {
        type: SortType.natural,
        order: SortOrder.asc,
      })

      if (node.specifiers.length > 1) {
        let values: SortingNode[] = node.specifiers.map(specifier => {
          let {
            range,
            local: { name },
          } = specifier
          return {
            size: rangeToDiff(range),
            node: specifier,
            name,
          }
        })

        for (let i = 1; i < values.length; i++) {
          let first = values.at(i - 1)!
          let second = values.at(i)!

          if (compare(first, second, options)) {
            let secondNode = node.specifiers[i]

            context.report({
              messageId: 'unexpectedNamedImportsOrder',
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
      }
    },
  }),
})
