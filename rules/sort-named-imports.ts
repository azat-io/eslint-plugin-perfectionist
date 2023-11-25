import { createSortingRule } from '../utils/create-sorting-rule'
import { createEslintRule } from '../utils/create-eslint-rule'
import { complete } from '../utils/complete'

type MESSAGE_ID = 'unexpectedNamedImportsOrder'

interface Options {
  type: 'alphabetical' | 'line-length' | 'natural'
  'ignore-alias': boolean
  'ignore-case': boolean
  order: 'desc' | 'asc'
}

export const RULE_NAME = 'sort-named-imports'

export default createEslintRule<[Partial<Options>], MESSAGE_ID>({
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
      type: 'alphabetical',
      order: 'asc',
    },
  ],
  create: context => ({
    ImportDeclaration: node => {
      let specifiers = node.specifiers.filter(
        ({ type }) => type === 'ImportSpecifier',
      )

      let options = complete<Options>(context.options.at(0), {
        type: 'alphabetical',
        'ignore-alias': true,
        'ignore-case': false,
        order: 'asc',
      })

      return createSortingRule({
        unexpectedOrderMessage: 'unexpectedNamedImportsOrder',
        nodes: specifiers,
        getName: element => {
          if (options['ignore-alias'] && element.type === 'ImportSpecifier') {
            return element.imported.name
          }

          return element.local.name
        },
        context,
        options,
      })
    },
  }),
})
