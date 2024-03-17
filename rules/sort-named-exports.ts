import { createSortingRule } from '../utils/create-sorting-rule'
import { createEslintRule } from '../utils/create-eslint-rule'
import { complete } from '../utils/complete'
import { GroupKind } from '../typings'

type MESSAGE_ID = 'unexpectedNamedExportsOrder'

type Options = [
  Partial<{
    type: 'alphabetical' | 'line-length' | 'natural'
    'group-kind': GroupKind
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
          'group-kind': {
            enum: [
              GroupKind.mixed,
              GroupKind['values-first'],
              GroupKind['types-first'],
            ],
            default: GroupKind.mixed,
            type: 'string',
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
        type Type = 'alphabetical' | 'line-length' | 'natural'
        type Order = 'desc' | 'asc'

        let options = complete(
          Object.assign({ groups: [] }, context.options.at(0)),
          {
            'group-kind': GroupKind.mixed,
            type: 'alphabetical' as Type,
            groups: [] as string[],
            order: 'asc' as Order,
            'ignore-case': false,
          },
        )

        let shouldGroupByKind = options['group-kind'] !== GroupKind.mixed
        let groupKindOrder =
          options['group-kind'] === GroupKind['values-first']
            ? ['value', 'type']
            : ['type', 'value']

        if (shouldGroupByKind) {
          options.groups = groupKindOrder
        }

        createSortingRule({
          unexpectedOrderMessage: 'unexpectedNamedExportsOrder',
          getName: specifier => specifier.local.name,
          nodes: node.specifiers,
          definedGroups: (define, specifier) => {
            define(specifier.exportKind)
          },
          context,
          options,
        })
      }
    },
  }),
})
