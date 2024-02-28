import type { AST } from 'vue-eslint-parser'

import path from 'node:path'

import { createSortingRule } from '../utils/create-sorting-rule'
import { createEslintRule } from '../utils/create-eslint-rule'
import { complete } from '../utils/complete'

type MESSAGE_ID = 'unexpectedVueAttributesOrder'

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

export const RULE_NAME = 'sort-vue-attributes'

export default createEslintRule<Options<string[]>, MESSAGE_ID>({
  name: RULE_NAME,
  meta: {
    type: 'suggestion',
    docs: {
      description: 'enforce sorted Vue attributes',
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
      unexpectedVueAttributesOrder:
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
    if (path.extname(context.filename) !== '.vue') {
      return {}
    }

    if (!('defineTemplateBodyVisitor' in context.sourceCode.parserServices)) {
      return {}
    }

    let { defineTemplateBodyVisitor } = context.sourceCode.parserServices as {
      defineTemplateBodyVisitor: (mapper: {
        [key: string]: (node: AST.VStartTag) => void
      }) => {}
    }

    return defineTemplateBodyVisitor({
      VStartTag: (node: AST.VStartTag) => {
        if (node.attributes.length > 1) {
          let options = complete(context.options.at(0), {
            type: 'alphabetical',
            'ignore-case': false,
            'custom-groups': {},
            order: 'asc',
            groups: [],
          })

          let parts: (AST.VAttribute | AST.VDirective)[][] =
            node.attributes.reduce(
              (
                accumulator: (AST.VAttribute | AST.VDirective)[][],
                attribute,
              ) => {
                if (
                  attribute.key.type === 'VDirectiveKey' &&
                  attribute.key.name.rawName === 'bind'
                ) {
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
              getName: attribute =>
                typeof attribute.key.name === 'string' &&
                attribute.key.type !== 'VDirectiveKey'
                  ? attribute.key.rawName
                  : context.sourceCode.text.slice(...attribute.key.range),
              definedGroups: attribute => {
                if (attribute.value === null) {
                  return 'shorthand'
                }

                if (attribute.loc.start.line !== attribute.loc.end.line) {
                  return 'multiline'
                }
              },
              unexpectedOrderMessage: 'unexpectedVueAttributesOrder',
              context,
              options,
              nodes,
            })
          }
        }
      },
    })
  },
})
