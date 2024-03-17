import { createSortingRule } from '../utils/create-sorting-rule'
import { createEslintRule } from '../utils/create-eslint-rule'
import { complete } from '../utils/complete'

type MESSAGE_ID = 'unexpectedUnionTypesOrder'

type Group<T extends string[]> = 'nullable' | T[number]

type Options<T extends string[]> = [
  Partial<{
    'custom-groups': { [key in T[number]]: string[] | string }
    type: 'alphabetical' | 'line-length' | 'natural'
    groups: (Group<T>[] | Group<T>)[]
    'ignore-case': boolean
    order: 'desc' | 'asc'
  }>,
]

export const RULE_NAME = 'sort-union-types'

export default createEslintRule<Options<string[]>, MESSAGE_ID>({
  name: RULE_NAME,
  meta: {
    type: 'suggestion',
    docs: {
      description: 'enforce sorted union types',
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
          groups: {
            type: 'array',
          },
          'custom-groups': {
            type: 'object',
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      unexpectedUnionTypesOrder:
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
    TSUnionType: node => {
      let options = complete(context.options.at(0), {
        type: 'alphabetical',
        'ignore-case': false,
        'custom-groups': {},
        order: 'asc',
        groups: [],
      } as const)

      let nodes = node.types

      createSortingRule({
        getName: type => context.sourceCode.text.slice(...type.range),
        definedGroups: (define, type) => {
          if (
            type.type === 'TSNullKeyword' ||
            type.type === 'TSUndefinedKeyword'
          ) {
            define('nullable')
          }
        },
        unexpectedOrderMessage: 'unexpectedUnionTypesOrder',
        context,
        options,
        nodes,
      })
    },
  }),
})
