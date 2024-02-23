import { createSortingRule } from '../utils/create-sorting-rule'
import { createEslintRule } from '../utils/create-eslint-rule'
import { complete } from '../utils/complete'

type MESSAGE_ID = 'unexpectedNamedExportsOrder'

type Options = [
  Partial<{
    type: 'alphabetical' | 'line-length' | 'natural'
    'ignore-case': boolean
    order: 'desc' | 'asc'
  }>,
]

export const RULE_NAME = 'sort-named-exports'

export default createEslintRule<Options, MESSAGE_ID>({
  name: RULE_NAME,
  meta: {
    type: 'suggestion',
    docs: {
      description: 'enforce sorted named exports',
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
      unexpectedNamedExportsOrder:
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
    ExportNamedDeclaration: node => {
      if (node.specifiers.length > 1) {
        let options = complete(context.options.at(0), {
          'ignore-case': false,
          type: 'alphabetical',
          order: 'asc',
        } as const)

        createSortingRule({
          unexpectedOrderMessage: 'unexpectedNamedExportsOrder',
          getName: specifier => specifier.local.name,
          nodes: node.specifiers,
          context,
          options,
        })
      }
    },
  }),
})
