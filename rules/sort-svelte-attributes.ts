import type { AST } from 'svelte-eslint-parser'

import path from 'node:path'

import { createSortingRule } from '../utils/create-sorting-rule'
import { createEslintRule } from '../utils/create-eslint-rule'
import { complete } from '../utils/complete'

type MESSAGE_ID = 'unexpectedSvelteAttributesOrder'

type Group<T extends string[]> =
  | 'svelte-shorthand'
  | 'multiline'
  | 'shorthand'
  | 'unknown'
  | T[number]

type Options<T extends string[]> = [
  Partial<{
    'custom-groups': { [key in T[number]]: string[] | string }
    type: 'alphabetical' | 'line-length' | 'natural'
    groups: (Group<T>[] | Group<T>)[]
    'ignore-case': boolean
    order: 'desc' | 'asc'
  }>,
]

export const RULE_NAME = 'sort-svelte-attributes'

export default createEslintRule<Options<string[]>, MESSAGE_ID>({
  name: RULE_NAME,
  meta: {
    type: 'suggestion',
    docs: {
      description: 'enforce sorted Svelte attributes',
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
      unexpectedSvelteAttributesOrder:
        'Expected "{{right}}" to come before "{{left}}"',
    },
  },
  defaultOptions: [
    {
      type: 'alphabetical',
      order: 'asc',
    },
  ],
  create: context => {
    if (path.extname(context.filename) !== '.svelte') {
      return {}
    }

    return {
      SvelteStartTag: (node: AST.SvelteStartTag) => {
        if (node.attributes.length > 1) {
          let options = complete(context.options.at(0), {
            type: 'alphabetical',
            'ignore-case': false,
            'custom-groups': {},
            order: 'asc',
            groups: [],
          })

          type Node =
            | AST.SvelteShorthandAttribute
            | AST.SvelteSpecialDirective
            | AST.SvelteStyleDirective
            | AST.SvelteAttribute
            | AST.SvelteDirective

          let parts: Node[][] = node.attributes.reduce(
            (accumulator: Node[][], attribute) => {
              if (attribute.type === 'SvelteSpreadAttribute') {
                accumulator.push([])
              } else {
                accumulator.at(-1)!.push(attribute)
              }

              return accumulator
            },
            [[]],
          )

          for (let nodes of parts) {
            createSortingRule({
              getName: attribute => {
                if (attribute.key.type === 'SvelteSpecialDirectiveKey') {
                  return context.sourceCode.text.slice(...attribute.key.range)
                }
                if (typeof attribute.key.name === 'string') {
                  return attribute.key.name
                }
                return context.sourceCode.text.slice(...attribute.key.range!)
              },
              definedGroups: (define, attribute) => {
                if (attribute.type === 'SvelteShorthandAttribute') {
                  define('svelte-shorthand')
                  define('shorthand')
                }

                if (
                  !('value' in attribute) ||
                  (Array.isArray(attribute.value) && !attribute.value.at(0))
                ) {
                  define('shorthand')
                }

                if (attribute.loc.start.line !== attribute.loc.end.line) {
                  define('multiline')
                }
              },
              unexpectedOrderMessage: 'unexpectedSvelteAttributesOrder',
              context,
              options,
              nodes,
            })
          }
        }
      },
    }
  },
})
