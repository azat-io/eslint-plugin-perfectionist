import type { Options } from './sort-class-decorators'

import { createEslintRule } from '../utils/create-eslint-rule'
import { sortDecorators } from './sort-class-decorators'

type MESSAGE_ID =
  | 'unexpectedMethodDecoratorsGroupOrder'
  | 'unexpectedMethodDecoratorsOrder'

export default createEslintRule<Options<string[]>, MESSAGE_ID>({
  name: 'sort-method-decorators',
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Enforce sorted method decorators.',
    },
    fixable: 'code',
    schema: [
      {
        type: 'object',
        properties: {
          type: {
            description: 'Specifies the sorting method.',
            type: 'string',
            enum: ['alphabetical', 'natural', 'line-length'],
          },
          order: {
            description:
              'Determines whether the sorted items should be in ascending or descending order.',
            type: 'string',
            enum: ['asc', 'desc'],
          },
          matcher: {
            description: 'Specifies the string matcher.',
            type: 'string',
            enum: ['minimatch', 'regex'],
          },
          ignoreCase: {
            description:
              'Controls whether sorting should be case-sensitive or not.',
            type: 'boolean',
          },
          partitionByComment: {
            description:
              'Allows you to use comments to separate the decorators into logical groups.',
            anyOf: [
              {
                type: 'boolean',
              },
              {
                type: 'string',
              },
              {
                type: 'array',
                items: {
                  type: 'string',
                },
              },
            ],
          },
          groups: {
            description: 'Specifies the order of the groups.',
            type: 'array',
            items: {
              oneOf: [
                {
                  type: 'string',
                },
                {
                  type: 'array',
                  items: {
                    type: 'string',
                  },
                },
              ],
            },
          },
          customGroups: {
            description: 'Specifies custom groups.',
            type: 'object',
            additionalProperties: {
              oneOf: [
                {
                  type: 'string',
                },
                {
                  type: 'array',
                  items: {
                    type: 'string',
                  },
                },
              ],
            },
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      unexpectedMethodDecoratorsGroupOrder:
        'Expected "{{right}}" ({{rightGroup}}) to come before "{{left}}" ({{leftGroup}}).',
      unexpectedMethodDecoratorsOrder:
        'Expected "{{right}}" to come before "{{left}}".',
    },
  },
  defaultOptions: [
    {
      type: 'alphabetical',
      order: 'asc',
      ignoreCase: true,
      partitionByComment: false,
      matcher: 'minimatch',
      groups: [],
      customGroups: {},
    },
  ],
  create: context => ({
    MethodDefinition: methodDefinition =>
      sortDecorators(
        context,
        'unexpectedMethodDecoratorsOrder',
        'unexpectedMethodDecoratorsGroupOrder',
        methodDefinition.decorators,
      ),
  }),
})
