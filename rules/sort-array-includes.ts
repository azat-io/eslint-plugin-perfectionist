import type { TSESTree } from '@typescript-eslint/types'

import { createSortingRule } from '../utils/create-sorting-rule'
import { createEslintRule } from '../utils/create-eslint-rule'
import { complete } from '../utils/complete'

type MESSAGE_ID = 'unexpectedArrayIncludesOrder'

type Group<T extends string[]> = T[number] | 'spread'

type Options<T extends string[]> = [
  Partial<{
    'custom-groups': { [key in T[number]]: string[] | string }
    type: 'alphabetical' | 'line-length' | 'natural'
    groups: (Group<T>[] | Group<T>)[]
    'ignore-case': boolean
    order: 'desc' | 'asc'
  }>,
]

export const RULE_NAME = 'sort-array-includes'

export default createEslintRule<Options<string[]>, MESSAGE_ID>({
  name: RULE_NAME,
  meta: {
    type: 'suggestion',
    docs: {
      description: 'enforce sorted arrays before include method',
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
      unexpectedArrayIncludesOrder:
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
    MemberExpression: node => {
      if (
        (node.object.type === 'ArrayExpression' ||
          node.object.type === 'NewExpression') &&
        node.property.type === 'Identifier' &&
        node.property.name === 'includes'
      ) {
        let options = complete(context.options.at(0), {
          type: 'alphabetical',
          'ignore-case': false,
          'custom-groups': {},
          order: 'asc',
          groups: [],
        })

        let nodes = (
          node.object.type === 'ArrayExpression'
            ? node.object.elements.filter(element => element !== null)
            : node.object.arguments
        ) as (TSESTree.SpreadElement | TSESTree.Expression)[]

        createSortingRule({
          getName: element =>
            element.type === 'Literal'
              ? `${element.value}`
              : context.sourceCode.text.slice(...element.range),
          definedGroups: element => {
            if (element.type === 'SpreadElement') {
              return 'spread'
            }
          },
          unexpectedOrderMessage: 'unexpectedArrayIncludesOrder',
          context,
          options,
          nodes,
        })
      }
    },
  }),
})
