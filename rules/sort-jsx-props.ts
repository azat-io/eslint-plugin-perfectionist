import type { TSESTree } from '@typescript-eslint/types'

import path from 'node:path'

import { createSortingRule } from '../utils/create-sorting-rule'
import { createEslintRule } from '../utils/create-eslint-rule'
import { complete } from '../utils/complete'

type MESSAGE_ID = 'unexpectedJSXPropsOrder'

type Group<T extends string[]> =
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

export const RULE_NAME = 'sort-jsx-props'

export default createEslintRule<Options<string[]>, MESSAGE_ID>({
  name: RULE_NAME,
  meta: {
    type: 'suggestion',
    docs: {
      description: 'enforce sorted JSX props',
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
      unexpectedJSXPropsOrder: 'Expected "{{right}}" to come before "{{left}}"',
    },
  },
  defaultOptions: [
    {
      type: 'alphabetical',
      order: 'asc',
    },
  ],
  create: context => {
    if (
      ['.svelte', '.astro', '.vue'].includes(path.extname(context.filename))
    ) {
      return {}
    }
    return {
      JSXElement: node => {
        let options = complete(context.options.at(0), {
          type: 'alphabetical',
          'ignore-case': false,
          'custom-groups': {},
          order: 'asc',
          groups: [],
        })

        let nodeParts = node.openingElement.attributes.reduce(
          (
            accumulator: TSESTree.JSXAttribute[][],
            attribute: TSESTree.JSXSpreadAttribute | TSESTree.JSXAttribute,
          ) => {
            if (attribute.type === 'JSXSpreadAttribute') {
              accumulator.push([])
            } else {
              accumulator.at(-1)!.push(attribute)
            }
            return accumulator
          },
          [[]],
        )

        for (let nodes of nodeParts) {
          createSortingRule({
            getName: element => {
              if (element.name.type === 'JSXNamespacedName') {
                return `${element.name.namespace.name}:${element.name.name.name}`
              }
              return element.name.name
            },
            definedGroups: element => {
              if (element.value === null) {
                return 'shorthand'
              }

              if (element.loc.start.line !== element.loc.end.line) {
                return 'multiline'
              }
            },
            unexpectedOrderMessage: 'unexpectedJSXPropsOrder',
            context,
            options,
            nodes,
          })
        }
      },
    }
  },
})
