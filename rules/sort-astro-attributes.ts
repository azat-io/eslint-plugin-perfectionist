import type { TSESTree } from '@typescript-eslint/types'
import type { AST } from 'astro-eslint-parser'

import path from 'path'

import type { SortingNode } from '../typings'

import { createEslintRule } from '../utils/create-eslint-rule'
import { rangeToDiff } from '../utils/range-to-diff'
import { SortOrder, SortType } from '../typings'
import { makeFixes } from '../utils/make-fixes'
import { sortNodes } from '../utils/sort-nodes'
import { pairwise } from '../utils/pairwise'
import { complete } from '../utils/complete'
import { compare } from '../utils/compare'

export const RULE_NAME = 'sort-astro-attributes'

type MESSAGE_ID = 'unexpectedAstroAttributesOrder'

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
      unexpectedAstroAttributesOrder:
        'Expected "{{right}}" to come before "{{left}}"',
    },
  },
  defaultOptions: [
    {
      type: SortType.alphabetical,
      order: SortOrder.asc,
    },
  ],
  // @ts-ignore
  create: context => {
    if (path.extname(context.getFilename()) !== '.astro') {
      return {}
    }

    return {
      JSXElement: (node: AST.JSXElement) => {
        let { attributes } = node.openingElement

        if (attributes.length > 1) {
          let options = complete(context.options.at(0), {
            type: SortType.alphabetical,
            order: SortOrder.asc,
            'ignore-case': false,
          })

          let source = context.getSourceCode()

          let parts: SortingNode[][] = attributes.reduce(
            (accumulator: SortingNode[][], attribute) => {
              if (attribute.type === 'JSXSpreadAttribute') {
                accumulator.push([])
                return accumulator
              }

              accumulator.at(-1)!.push({
                size: rangeToDiff(attribute.range),
                node: attribute as unknown as TSESTree.Node,
                name:
                  typeof attribute.name.name === 'string'
                    ? attribute.name.name
                    : source.text.slice(...attribute.name.range),
              })

              return accumulator
            },
            [[]],
          )

          for (let nodes of parts) {
            pairwise(nodes, (left, right) => {
              if (compare(left, right, options)) {
                context.report({
                  messageId: 'unexpectedAstroAttributesOrder',
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
