import type { TSESTree } from '@typescript-eslint/types'
import type { AST } from 'svelte-eslint-parser'

import path from 'path'

import type { SortingNode } from '../typings'

import { createEslintRule } from '../utils/create-eslint-rule'
import { rangeToDiff } from '../utils/range-to-diff'
import { SortOrder, SortType } from '../typings'
import { sortNodes } from '../utils/sort-nodes'
import { makeFixes } from '../utils/make-fixes'
import { complete } from '../utils/complete'
import { pairwise } from '../utils/pairwise'
import { compare } from '../utils/compare'

export const RULE_NAME = 'sort-svelte-attributes'

type MESSAGE_ID = 'unexpectedSvelteAttributesOrder'

type Options = [
  Partial<{
    'ignore-case': boolean
    order: SortOrder
    type: SortType
  }>,
]

export default createEslintRule<Options, MESSAGE_ID>({
  name: RULE_NAME,
  meta: {
    type: 'suggestion',
    docs: {
      description: 'enforce sorted union types',
      recommended: false,
    },
    fixable: 'code',
    schema: [
      {
        type: 'object',
        properties: {
          type: {
            enum: [
              SortType.alphabetical,
              SortType.natural,
              SortType['line-length'],
            ],
            default: SortType.natural,
          },
          order: {
            enum: [SortOrder.asc, SortOrder.desc],
            default: SortOrder.asc,
          },
          'ignore-case': {
            type: 'boolean',
            default: false,
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
      type: SortType.alphabetical,
      order: SortOrder.asc,
    },
  ],
  create: context => {
    if (path.extname(context.getFilename()) !== '.svelte') {
      return {}
    }

    return {
      SvelteStartTag: (node: AST.SvelteStartTag) => {
        if (node.attributes.length > 1) {
          let options = complete(context.options.at(0), {
            type: SortType.alphabetical,
            order: SortOrder.asc,
            'ignore-case': false,
          })

          let source = context.getSourceCode()

          let parts: SortingNode[][] = node.attributes.reduce(
            (accumulator: SortingNode[][], attribute) => {
              if (attribute.type === 'SvelteSpreadAttribute') {
                accumulator.push([])
                return accumulator
              }

              let name: string

              if (attribute.key.type === 'SvelteSpecialDirectiveKey') {
                name = source.text.slice(...attribute.key.range)
              } else {
                if (typeof attribute.key.name === 'string') {
                  ;({ name } = attribute.key)
                } else {
                  name = source.text.slice(...attribute.key.range!)
                }
              }

              accumulator.at(-1)!.push({
                size: rangeToDiff(attribute.range),
                node: attribute as unknown as TSESTree.Node,
                name,
              })

              return accumulator
            },
            [[]],
          )

          for (let nodes of parts) {
            pairwise(nodes, (left, right) => {
              if (compare(left, right, options)) {
                context.report({
                  messageId: 'unexpectedSvelteAttributesOrder',
                  data: {
                    left: left.name,
                    right: right.name,
                  },
                  node: right.node,
                  fix: fixer =>
                    makeFixes(fixer, nodes, sortNodes(nodes, options), source),
                })
              }
            })
          }
        }
      },
    }
  },
})
