import type { TSESTree } from '@typescript-eslint/types'

import { AST_NODE_TYPES } from '@typescript-eslint/types'

import { createEslintRule } from '~/utils/create-eslint-rule'
import { rangeToDiff } from '~/utils/range-to-diff'
import { SortType, SortOrder } from '~/typings'
import { sortNodes } from '~/utils/sort-nodes'
import type { SortingNode } from '~/typings'
import { complete } from '~/utils/complete'
import { compare } from '~/utils/compare'

type MESSAGE_ID = 'unexpectedObjectKeysOrder'

type Options = [
  Partial<{
    order: SortOrder
    type: SortType
  }>,
]

export const RULE_NAME = 'sort-object-keys'

export default createEslintRule<Options, MESSAGE_ID>({
  name: RULE_NAME,
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Enforce sorted object keys',
      recommended: false,
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
    messages: {
      unexpectedObjectKeysOrder: 'Expected "{{second}}" to come before "{{first}}"',
    },
  },
  defaultOptions: [
    {
      type: SortType.natural,
      order: SortOrder.asc,
    },
  ],
  create: context => ({
    ObjectExpression: node => {
      if (node.properties.length > 1) {
        let options = complete(context.options.at(0), {
          type: SortType.natural,
          order: SortOrder.asc,
        })

        let source = context.getSourceCode().text

        let formatProperties = (props: TSESTree.ObjectLiteralElement[]): SortingNode[][] =>
          props.reduce(
            (accumulator: SortingNode[][], prop) => {
              if (prop.type === AST_NODE_TYPES.SpreadElement) {
                accumulator.push([])
                return accumulator
              }

              let name: string

              if (prop.key.type === AST_NODE_TYPES.Identifier) {
                ;({ name } = prop.key)
              } else if (prop.key.type === AST_NODE_TYPES.Literal) {
                name = `${prop.key.value}`
              } else {
                name = source.slice(...prop.key.range)
              }

              let value = {
                size: rangeToDiff(prop.range),
                node: prop,
                name,
              }

              accumulator.at(-1)!.push(value)

              return accumulator
            },
            [[]],
          )

        formatProperties(node.properties).forEach(values => {
          if (values.length > 1) {
            for (let i = 1; i < values.length; i++) {
              let first = values.at(i - 1)!
              let second = values.at(i)!

              if (compare(first, second, options)) {
                context.report({
                  messageId: 'unexpectedObjectKeysOrder',
                  data: {
                    first: first.name,
                    second: second.name,
                  },
                  node: second.node,
                  fix: fixer => sortNodes(fixer, source, values, options),
                })
              }
            }
          }
        })
      }
    },
  }),
})
