import { createSortingRule } from '../utils/create-sorting-rule'
import { createEslintRule } from '../utils/create-eslint-rule'
import { complete } from '../utils/complete'
import { GroupKind } from '../typings'

type MESSAGE_ID = 'unexpectedNamedImportsOrder'

interface Options {
  type: 'alphabetical' | 'line-length' | 'natural'
  'group-kind': GroupKind
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
      type Type = 'alphabetical' | 'line-length' | 'natural'
      type Order = 'desc' | 'asc'

      let specifiers = node.specifiers.filter(
        ({ type }) => type === 'ImportSpecifier',
      )

      let options = complete(
        Object.assign({ groups: [] }, context.options.at(0)),
        {
          'group-kind': GroupKind.mixed,
          type: 'alphabetical' as Type,
          groups: [] as string[],
          order: 'asc' as Order,
          'ignore-alias': true,
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
        unexpectedOrderMessage: 'unexpectedNamedImportsOrder',
        nodes: specifiers,
        getName: element => {
          if (options['ignore-alias'] && element.type === 'ImportSpecifier') {
            return element.imported.name
          }

          return element.local.name
        },
        definedGroups: (define, specifier) => {
          if ('importKind' in specifier) {
            define(specifier.importKind)
          }
        },
        context,
        options,
      })
    },
  }),
})
