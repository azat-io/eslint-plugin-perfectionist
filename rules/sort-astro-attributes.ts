import type { AST } from 'astro-eslint-parser'

import path from 'node:path'

import { createSortingRule } from '../utils/create-sorting-rule'
import { createEslintRule } from '../utils/create-eslint-rule'
import { complete } from '../utils/complete'

type Group<T extends string[]> =
  | 'astro-shorthand'
  | 'multiline'
  | 'shorthand'
  | 'unknown'
  | T[number]

type MESSAGE_ID = 'unexpectedAstroAttributesOrder'

type Options<T extends string[]> = [
  Partial<{
    'custom-groups': { [key in T[number]]: string[] | string }
    type: 'alphabetical' | 'line-length' | 'natural'
    groups: (Group<T>[] | Group<T>)[]
    'ignore-case': boolean
    order: 'desc' | 'asc'
  }>,
]

export const RULE_NAME = 'sort-astro-attributes'

export default createEslintRule<Options<string[]>, MESSAGE_ID>({
  name: RULE_NAME,
  meta: {
    type: 'suggestion',
    docs: {
      description: 'enforce sorted Astro attributes',
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
      unexpectedAstroAttributesOrder:
        'Expected "{{right}}" to come before "{{left}}"',
    },
  },
  defaultOptions: [
    {
      type: 'alphabetical',
      order: 'asc',
    },
  ],
  // @ts-ignore
  create: context => {
    if (path.extname(context.filename) !== '.astro') {
      return {}
    }

    return {
      JSXElement: (node: AST.JSXElement) => {
        let { attributes } = node.openingElement

        if (attributes.length > 1) {
          let options = complete(context.options.at(0), {
            type: 'alphabetical',
            'ignore-case': false,
            'custom-groups': {},
            order: 'asc',
            groups: [],
          })

          type AstroAttribute =
            | AST.AstroTemplateLiteralAttribute
            | AST.AstroShorthandAttribute
            | AST.JSXAttribute

          let parts: AstroAttribute[][] = attributes.reduce(
            (accumulator: AstroAttribute[][], attribute) => {
              if (attribute.type === 'JSXSpreadAttribute') {
                accumulator.push([])
                return accumulator
              }

              accumulator.at(-1)!.push(attribute)

              return accumulator
            },
            [[]],
          )

          for (let nodes of parts) {
            createSortingRule({
              getName: attribute =>
                typeof attribute.name.name === 'string'
                  ? attribute.name.name
                  : context.sourceCode.text.slice(...attribute.name.range),
              definedGroups: attribute => {
                if (attribute.type === 'AstroShorthandAttribute') {
                  return 'astro-shorthand'
                }

                if (attribute.value === null) {
                  return 'shorthand'
                }

                if (attribute.loc.start.line !== attribute.loc.end.line) {
                  return 'multiline'
                }
              },
              unexpectedOrderMessage: 'unexpectedAstroAttributesOrder',
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
