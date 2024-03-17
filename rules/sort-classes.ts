import type { TSESTree } from '@typescript-eslint/types'

import { createSortingRule } from '../utils/create-sorting-rule'
import { createEslintRule } from '../utils/create-eslint-rule'
import { complete } from '../utils/complete'

type MESSAGE_ID = 'unexpectedClassesOrder'

type Group<T extends string[]> =
  | 'private-decorated-accessor-property'
  | 'decorated-accessor-property'
  | 'private-decorated-property'
  | 'static-private-method'
  | 'decorated-set-method'
  | 'decorated-get-method'
  | 'decorated-property'
  | 'decorated-method'
  | 'private-property'
  | 'static-property'
  | 'index-signature'
  | 'private-method'
  | 'static-method'
  | 'constructor'
  | 'get-method'
  | 'set-method'
  | 'property'
  | 'unknown'
  | T[number]
  | 'method'

type Options<T extends string[]> = [
  Partial<{
    'custom-groups': { [key in T[number]]: string[] | string }
    type: 'alphabetical' | 'line-length' | 'natural'
    groups: (Group<T>[] | Group<T>)[]
    'ignore-case': boolean
    order: 'desc' | 'asc'
  }>,
]

export const RULE_NAME = 'sort-classes'

export default createEslintRule<Options<string[]>, MESSAGE_ID>({
  name: RULE_NAME,
  meta: {
    type: 'suggestion',
    docs: {
      description: 'enforce sorted classes',
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
      unexpectedClassesOrder: 'Expected "{{right}}" to come before "{{left}}"',
    },
  },
  defaultOptions: [
    {
      type: 'alphabetical',
      order: 'asc',
    },
  ],
  create: context => ({
    ClassBody: node => {
      if (node.body.length > 1) {
        let options = complete(context.options.at(0), {
          groups: ['property', 'constructor', 'method', 'unknown'],
          type: 'alphabetical',
          'ignore-case': false,
          'custom-groups': {},
          order: 'asc',
        } as const)

        let nodes: TSESTree.ClassElement[] = node.body

        createSortingRule({
          getName: member => {
            if (member.type === 'StaticBlock') {
              return 'static'
            } else if (member.type === 'TSIndexSignature') {
              return context.sourceCode.text.slice(
                member.range.at(0),
                member.typeAnnotation?.range.at(0) ?? member.range.at(1),
              )
            }
            if (member.key.type === 'Identifier') {
              return member.key.name
            }
            return context.sourceCode.text.slice(...member.key.range)
          },
          definedGroups: (define, member, name) => {
            let isPrivate = name.startsWith('_') || name.startsWith('#')

            let isDecorated =
              'decorators' in member && member.decorators.length > 0

            if (member.type === 'MethodDefinition') {
              if (member.kind === 'constructor') {
                define('constructor')
              }

              let isPrivateMethod =
                member.accessibility === 'private' || isPrivate

              let isStaticMethod = member.static

              if (isDecorated) {
                if (member.kind === 'get') {
                  define('decorated-get-method')
                }

                if (member.kind === 'set') {
                  define('decorated-set-method')
                }

                define('decorated-method')
              }

              if (isPrivateMethod && isStaticMethod) {
                define('static-private-method')
              }

              if (isPrivateMethod) {
                define('private-method')
              }

              if (isStaticMethod) {
                define('static-method')
              }

              if (member.kind === 'get') {
                define('get-method')
              }

              if (member.kind === 'set') {
                define('set-method')
              }

              define('method')
            } else if (member.type === 'TSIndexSignature') {
              define('index-signature')
            } else if (member.type === 'AccessorProperty') {
              if (isDecorated) {
                if (member.accessibility === 'private' || isPrivate) {
                  define('private-decorated-accessor-property')
                }

                define('decorated-accessor-property')
              }
            } else if (member.type === 'PropertyDefinition') {
              if (isDecorated) {
                if (member.accessibility === 'private' || isPrivate) {
                  define('private-decorated-property')
                }

                define('decorated-property')
              }

              if (member.accessibility === 'private' || isPrivate) {
                define('private-property')
              }

              if (member.static) {
                define('static-property')
              }

              define('property')
            }
          },
          unexpectedOrderMessage: 'unexpectedClassesOrder',
          saveSameNameOrder: true,
          context,
          options,
          nodes,
        })
      }
    },
  }),
})
