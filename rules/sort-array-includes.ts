import type { JSONSchema4 } from '@typescript-eslint/utils/json-schema'
import type { RuleContext } from '@typescript-eslint/utils/ts-eslint'
import type { TSESTree } from '@typescript-eslint/types'
import type { SpreadElement, Expression } from 'estree'

import type { SortingNode } from '../typings'

import { createEslintRule } from '../utils/create-eslint-rule'
import { getGroupNumber } from '../utils/get-group-number'
import { getSourceCode } from '../utils/get-source-code'
import { toSingleLine } from '../utils/to-single-line'
import { rangeToDiff } from '../utils/range-to-diff'
import { getSettings } from '../utils/get-settings'
import { isPositive } from '../utils/is-positive'
import { sortNodes } from '../utils/sort-nodes'
import { makeFixes } from '../utils/make-fixes'
import { complete } from '../utils/complete'
import { pairwise } from '../utils/pairwise'
import { compare } from '../utils/compare'

type MESSAGE_ID = 'unexpectedArrayIncludesOrder'

export type Options = [
  Partial<{
    groupKind: 'literals-first' | 'spreads-first' | 'mixed'
    type: 'alphabetical' | 'line-length' | 'natural'
    order: 'desc' | 'asc'
    ignoreCase: boolean
  }>,
]

export let jsonSchema: JSONSchema4 = {
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
      description: 'Controls whether sorting should be case-sensitive or not.',
      type: 'boolean',
    },
    groupKind: {
      description: 'Specifies top-level groups.',
      enum: ['mixed', 'literals-first', 'spreads-first'],
      type: 'string',
    },
  },
  additionalProperties: false,
}

export default createEslintRule<Options, MESSAGE_ID>({
  name: 'sort-array-includes',
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Enforce sorted arrays before include method.',
    },
    fixable: 'code',
    schema: [jsonSchema],
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
      groupKind: 'literals-first',
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
        sortArray<MESSAGE_ID>(context, 'unexpectedArrayIncludesOrder', elements)
      }
    },
  }),
})

export let sortArray = <MessageIds extends string>(
  context: Readonly<RuleContext<MessageIds, Options>>,
  messageId: MessageIds,
  elements: (SpreadElement | Expression | null)[],
) => {
  let settings = getSettings(context.settings)

  if (elements.length > 1) {
    let options = complete(context.options.at(0), settings, {
      groupKind: 'literals-first',
      type: 'alphabetical',
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
            if (typeof options.groupKind === 'string') {
              group = element.type === 'SpreadElement' ? 'spread' : 'literal'
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
      let groupKindOrder = ['unknown']

      if (typeof options.groupKind === 'string') {
        groupKindOrder =
          options.groupKind === 'literals-first'
            ? ['literal', 'spread']
            : ['spread', 'literal']
      }

      let leftNum = getGroupNumber(groupKindOrder, left)
      let rightNum = getGroupNumber(groupKindOrder, right)

      if (
        (options.groupKind !== 'mixed' && leftNum > rightNum) ||
        ((options.groupKind === 'mixed' || leftNum === rightNum) &&
          isPositive(compare(left, right, options)))
      ) {
        context.report({
          messageId,
          data: {
            left: toSingleLine(left.name),
            right: toSingleLine(right.name),
          },
          node: right.node,
          fix: fixer => {
            let sortedNodes =
              options.groupKind !== 'mixed'
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
