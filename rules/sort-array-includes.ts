import type { TSESTree } from '@typescript-eslint/types'

import type { SortingNode } from '../typings'

import { createEslintRule } from '../utils/create-eslint-rule'
import { getGroupNumber } from '../utils/get-group-number'
import { getSourceCode } from '../utils/get-source-code'
import { toSingleLine } from '../utils/to-single-line'
import { rangeToDiff } from '../utils/range-to-diff'
import { isPositive } from '../utils/is-positive'
import { sortNodes } from '../utils/sort-nodes'
import { makeFixes } from '../utils/make-fixes'
import { complete } from '../utils/complete'
import { pairwise } from '../utils/pairwise'
import { compare } from '../utils/compare'

type MESSAGE_ID = 'unexpectedArrayIncludesOrder'

type Options = [
  Partial<{
    type: 'alphabetical' | 'line-length' | 'natural'
    order: 'desc' | 'asc'
    spreadLast: boolean
    ignoreCase: boolean
  }>,
]

export const RULE_NAME = 'sort-array-includes'

export default createEslintRule<Options, MESSAGE_ID>({
  name: 'sort-array-includes',
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Enforce sorted arrays before include method.',
    },
    fixable: 'code',
    schema: [
      {
        type: 'object',
        properties: {
          type: {
            description: 'Specifies the sorting method.',
            type: 'string',
            enum: ['alphabetical', 'natural', 'line-length'],
          },
          order: {
            description:
              'Determines whether the sorted items should be in ascending or descending order.',
            type: 'string',
            enum: ['asc', 'desc'],
          },
          ignoreCase: {
            description:
              'Controls whether sorting should be case-sensitive or not.',
            type: 'boolean',
          },
          spreadLast: {
            description:
              'Determines the position of spread elements within the array.',
            type: 'boolean',
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      unexpectedArrayIncludesOrder:
        'Expected "{{right}}" to come before "{{left}}".',
    },
  },
  defaultOptions: [
    {
      type: 'alphabetical',
      order: 'asc',
      ignoreCase: true,
      spreadLast: true,
    },
  ],
  create: context => ({
    MemberExpression: node => {
      if (
        (node.object.type === 'ArrayExpression' ||
          node.object.type === 'NewExpression') &&
        node.property.type === 'Identifier' &&
        node.property.name === 'includes'
      ) {
        let elements =
          node.object.type === 'ArrayExpression'
            ? node.object.elements
            : node.object.arguments

        if (elements.length > 1) {
          let options = complete(context.options.at(0), {
            type: 'alphabetical',
            spreadLast: true,
            ignoreCase: true,
            order: 'asc',
          } as const)

          let sourceCode = getSourceCode(context)
          let nodes: ({ type: string } & SortingNode)[] = elements
            .reduce(
              (
                accumulator: ({ type: string } & SortingNode)[][],
                element: TSESTree.SpreadElement | TSESTree.Expression | null,
              ) => {
                if (element !== null) {
                  let group = 'unknown'
                  if (options.spreadLast) {
                    group =
                      element.type === 'SpreadElement' ? 'spread' : 'literal'
                  }
                  accumulator.at(0)!.push({
                    name:
                      element.type === 'Literal'
                        ? `${element.value}`
                        : sourceCode.text.slice(...element.range),
                    size: rangeToDiff(element.range),
                    type: element.type,
                    node: element,
                    group,
                  })
                }

                return accumulator
              },
              [[], []],
            )
            .flat()

          pairwise(nodes, (left, right) => {
            let groupKindOrder = options.spreadLast
              ? ['literal', 'spread']
              : ['unknown']

            let leftNum = getGroupNumber(groupKindOrder, left)
            let rightNum = getGroupNumber(groupKindOrder, right)

            if (
              (options.spreadLast && leftNum > rightNum) ||
              ((!options.spreadLast || leftNum === rightNum) &&
                isPositive(compare(left, right, options)))
            ) {
              context.report({
                messageId: 'unexpectedArrayIncludesOrder',
                data: {
                  left: toSingleLine(left.name),
                  right: toSingleLine(right.name),
                },
                node: right.node,
                fix: fixer => {
                  let sortedNodes = options.spreadLast
                    ? groupKindOrder
                        .map(group => nodes.filter(n => n.group === group))
                        .map(groupedNodes => sortNodes(groupedNodes, options))
                        .flat()
                    : sortNodes(nodes, options)

                  return makeFixes(fixer, nodes, sortedNodes, sourceCode)
                },
              })
            }
          })
        }
      }
    },
  }),
})
