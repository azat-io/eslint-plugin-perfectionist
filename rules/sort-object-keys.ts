import type { TSESTree } from '@typescript-eslint/types'
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

type MESSAGE_ID = 'unexpectedObjectKeysOrder'

type Options = [
  Partial<{
    'ignore-case': boolean
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
      description: 'enforce sorted object keys',
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
          'ignore-case': {
            type: 'boolean',
            default: false,
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      unexpectedObjectKeysOrder:
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
    ObjectExpression: node => {
      if (node.properties.length > 1) {
        let options = complete(context.options.at(0), {
          type: SortType.alphabetical,
          'ignore-case': false,
          order: SortOrder.asc,
        })

        let source = context.getSourceCode()

        let formatProperties = (
          props: TSESTree.ObjectLiteralElement[],
        ): SortingNode[][] =>
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
                name = source.text.slice(...prop.key.range)
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

        formatProperties(node.properties).forEach(nodes => {
          pairwise(nodes, (first, second) => {
            if (compare(first, second, options)) {
              context.report({
                messageId: 'unexpectedObjectKeysOrder',
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
        })
      }
    },
  }),
})
