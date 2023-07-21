import { AST_NODE_TYPES } from '@typescript-eslint/types'

import type { SortingNode } from '../typings'

import { createEslintRule } from '../utils/create-eslint-rule'
import { toSingleLine } from '../utils/to-single-line'
import { rangeToDiff } from '../utils/range-to-diff'
import { SortOrder, SortType } from '../typings'
import { sortNodes } from '../utils/sort-nodes'
import { makeFixes } from '../utils/make-fixes'
import { complete } from '../utils/complete'
import { pairwise } from '../utils/pairwise'
import { compare } from '../utils/compare'

type MESSAGE_ID = 'unexpectedObjectTypesOrder'

type Options = [
  Partial<{
    'ignore-case': boolean
    order: SortOrder
    type: SortType
  }>,
]

export const RULE_NAME = 'sort-object-types'

export default createEslintRule<Options, MESSAGE_ID>({
  name: RULE_NAME,
  meta: {
    type: 'suggestion',
    docs: {
      description: 'enforce sorted object types',
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
            default: SortType.alphabetical,
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
      unexpectedObjectTypesOrder:
        'Expected "{{right}}" to come before "{{left}}"',
    },
  },
  defaultOptions: [
    {
      type: SortType.alphabetical,
      order: SortOrder.asc,
    },
  ],
  create: context => ({
    TSTypeLiteral: node => {
      if (node.members.length > 1) {
        let options = complete(context.options.at(0), {
          type: SortType.alphabetical,
          'ignore-case': false,
          order: SortOrder.asc,
        })

        let source = context.getSourceCode()

        let nodes: SortingNode[] = node.members.map(member => {
          let name: string
          let raw = source.text.slice(member.range.at(0), member.range.at(1))

          let formatName = (value: string): string =>
            value.replace(/(,|;)$/, '')

          if (member.type === AST_NODE_TYPES.TSPropertySignature) {
            if (member.key.type === AST_NODE_TYPES.Identifier) {
              ;({ name } = member.key)
            } else if (member.key.type === AST_NODE_TYPES.Literal) {
              name = `${member.key.value}`
            } else {
              name = source.text.slice(
                member.range.at(0),
                member.typeAnnotation?.range.at(0),
              )
            }
          } else if (member.type === AST_NODE_TYPES.TSIndexSignature) {
            let endIndex: number =
              member.typeAnnotation?.range.at(0) ?? member.range.at(1)!

            name = formatName(source.text.slice(member.range.at(0), endIndex))
          } else {
            name = formatName(
              source.text.slice(member.range.at(0), member.range.at(1)),
            )
          }

          let endsWithComma = raw.endsWith(';') || raw.endsWith(',')
          let endSize = endsWithComma ? 1 : 0

          return {
            size: rangeToDiff(member.range) - endSize,
            node: member,
            name,
          }
        })

        pairwise(nodes, (left, right) => {
          if (compare(left, right, options)) {
            context.report({
              messageId: 'unexpectedObjectTypesOrder',
              data: {
                left: toSingleLine(left.name),
                right: toSingleLine(right.name),
              },
              node: right.node,
              fix: fixer =>
                makeFixes(fixer, nodes, sortNodes(nodes, options), source),
            })
          }
        })
      }
    },
  }),
})
