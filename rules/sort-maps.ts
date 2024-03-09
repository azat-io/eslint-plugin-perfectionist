import type { TSESTree } from '@typescript-eslint/types'

import { createSortingRule } from '../utils/create-sorting-rule'
import { createEslintRule } from '../utils/create-eslint-rule'
import { complete } from '../utils/complete'

type MESSAGE_ID = 'unexpectedMapElementsOrder'

interface Options {
  type: 'alphabetical' | 'line-length' | 'natural'
  'ignore-case': boolean
  order: 'desc' | 'asc'
}

export const RULE_NAME = 'sort-maps'

export default createEslintRule<[Partial<Options>], MESSAGE_ID>({
  name: RULE_NAME,
  meta: {
    type: 'suggestion',
    docs: {
      description: 'enforce sorted Map elements',
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
        },
        additionalProperties: false,
      },
    ],
    messages: {
      unexpectedMapElementsOrder:
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
    NewExpression: node => {
      if (
        node.callee.type === 'Identifier' &&
        node.callee.name === 'Map' &&
        node.arguments.length &&
        node.arguments[0].type === 'ArrayExpression'
      ) {
        let [{ elements }] = node.arguments

        let options = complete<Options>(context.options.at(0), {
          type: 'alphabetical',
          'ignore-case': false,
          order: 'asc',
        })

        let nodeParts: TSESTree.Expression[][] = elements.reduce(
          (
            accumulator: TSESTree.Expression[][],
            element: TSESTree.SpreadElement | TSESTree.Expression | null,
          ) => {
            if (element === null || element.type === 'SpreadElement') {
              accumulator.push([])
            } else {
              accumulator.at(-1)!.push(element)
            }
            return accumulator
          },
          [[]],
        )

        for (let nodes of nodeParts) {
          createSortingRule({
            getName: element => {
              if (element.type === 'ArrayExpression') {
                let [left] = element.elements

                if (!left) {
                  return `${left}`
                } else if (left.type === 'Literal') {
                  return left.raw
                }
                return context.sourceCode.text.slice(...left.range)
              }
              return context.sourceCode.text.slice(...element.range)
            },
            unexpectedOrderMessage: 'unexpectedMapElementsOrder',
            context,
            options,
            nodes,
          })
        }
      }
    },
  }),
})
