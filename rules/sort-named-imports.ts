import type { SortingNode } from '../typings'

import { createEslintRule } from '../utils/create-eslint-rule'
import { rangeToDiff } from '../utils/range-to-diff'
import { isPositive } from '../utils/is-positive'
import { SortOrder, SortType } from '../typings'
import { sortNodes } from '../utils/sort-nodes'
import { makeFixes } from '../utils/make-fixes'
import { complete } from '../utils/complete'
import { pairwise } from '../utils/pairwise'
import { compare } from '../utils/compare'

type MESSAGE_ID = 'unexpectedNamedImportsOrder'

type Options = [
  Partial<{
    'ignore-alias': boolean
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
          'ignore-alias': {
            type: 'boolean',
            default: false,
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      unexpectedNamedImportsOrder:
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
    ImportDeclaration: node => {
      let specifiers = node.specifiers.filter(
        ({ type }) => type === 'ImportSpecifier',
      )

      if (specifiers.length > 1) {
        let options = complete(context.options.at(0), {
          type: SortType.alphabetical,
          'ignore-alias': true,
          'ignore-case': false,
          order: SortOrder.asc,
        })

        let source = context.getSourceCode()

        let nodes: SortingNode[] = specifiers.map(specifier => {
          let { name } = specifier.local

          if (options['ignore-alias'] && specifier.type === 'ImportSpecifier') {
            ;({ name } = specifier.imported)
          }

          return {
            size: rangeToDiff(specifier.range),
            node: specifier,
            name,
          }
        })

        pairwise(nodes, (left, right) => {
          if (isPositive(compare(left, right, options))) {
            context.report({
              messageId: 'unexpectedNamedImportsOrder',
              data: {
                left: left.name,
                right: right.name,
              },
              node: right.node,
              fix: fixer =>
                makeFixes(fixer, nodes, sortNodes(nodes, options), source),
            })
          }
        })
      }
    },
  }),
})
