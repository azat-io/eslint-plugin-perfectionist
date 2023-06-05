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

type MESSAGE_ID = 'unexpectedNamedImportsOrder'

type Options = [
  Partial<{
    'ignore-case': boolean
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
      description: 'enforce sorted named imports',
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
      unexpectedNamedImportsOrder:
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
    ImportDeclaration: node => {
      let specifiers = node.specifiers.filter(
        ({ type }) => type === AST_NODE_TYPES.ImportSpecifier,
      )

      if (specifiers.length > 1) {
        let options = complete(context.options.at(0), {
          type: SortType.alphabetical,
          'ignore-case': false,
          order: SortOrder.asc,
        })

        let source = context.getSourceCode()

        let nodes: SortingNode[] = specifiers.map(specifier => ({
          size: rangeToDiff(specifier.range),
          name: specifier.local.name,
          node: specifier,
        }))

        pairwise(nodes, (first, second) => {
          if (compare(first, second, options)) {
            context.report({
              messageId: 'unexpectedNamedImportsOrder',
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
