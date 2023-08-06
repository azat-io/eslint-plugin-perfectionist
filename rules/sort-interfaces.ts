import { minimatch } from 'minimatch'

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

type MESSAGE_ID = 'unexpectedInterfacePropertiesOrder'

type Options = [
  Partial<{
    'ignore-pattern': string[]
    'ignore-case': boolean
    order: SortOrder
    type: SortType
  }>,
]

export const RULE_NAME = 'sort-interfaces'

export default createEslintRule<Options, MESSAGE_ID>({
  name: RULE_NAME,
  meta: {
    type: 'suggestion',
    docs: {
      description: 'enforce sorted interface properties',
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
          'ignore-pattern': {
            type: 'array',
            default: [],
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      unexpectedInterfacePropertiesOrder:
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
    TSInterfaceDeclaration: node => {
      if (node.body.body.length > 1) {
        let options = complete(context.options.at(0), {
          type: SortType.alphabetical,
          'ignore-case': false,
          order: SortOrder.asc,
          'ignore-pattern': [],
        })

        if (
          !options['ignore-pattern'].some(pattern =>
            minimatch(node.id.name, pattern),
          )
        ) {
          let source = context.getSourceCode()

          let formattedMembers: SortingNode[][] = node.body.body.reduce(
            (accumulator: SortingNode[][], element) => {
              if (element.type === 'TSCallSignatureDeclaration') {
                accumulator.push([])
                return accumulator
              }

              let name: string

              if (element.type === 'TSPropertySignature') {
                if (element.key.type === 'Identifier') {
                  ;({ name } = element.key)
                } else if (element.key.type === 'Literal') {
                  name = `${element.key.value}`
                } else {
                  let end: number =
                    element.typeAnnotation?.range.at(0) ??
                    element.range.at(1)! - (element.optional ? '?'.length : 0)

                  name = source.text.slice(element.range.at(0), end)
                }
              } else if (element.type === 'TSIndexSignature') {
                let endIndex: number =
                  element.typeAnnotation?.range.at(0) ?? element.range.at(1)!

                name = source.text.slice(element.range.at(0), endIndex)
              } else {
                let endIndex: number =
                  element.returnType?.range.at(0) ?? element.range.at(1)!

                name = source.text.slice(element.range.at(0), endIndex)
              }

              accumulator.at(-1)!.push({
                size: rangeToDiff(element.range),
                node: element,
                name,
              })

              return accumulator
            },
            [[]],
          )

          for (let nodes of formattedMembers) {
            pairwise(nodes, (left, right) => {
              if (compare(left, right, options)) {
                context.report({
                  messageId: 'unexpectedInterfacePropertiesOrder',
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
        }
      }
    },
  }),
})
