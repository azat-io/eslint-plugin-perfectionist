import type { JSONSchema4 } from '@typescript-eslint/utils/json-schema'
import type { RuleContext } from '@typescript-eslint/utils/ts-eslint'
import type { TSESTree } from '@typescript-eslint/types'

import type { SortingNode } from '../typings'

import { hasPartitionComment } from '../utils/is-partition-comment'
import { getCommentsBefore } from '../utils/get-comments-before'
import { createEslintRule } from '../utils/create-eslint-rule'
import { getLinesBetween } from '../utils/get-lines-between'
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
    partitionByComment: string[] | boolean | string
    specialCharacters: 'remove' | 'trim' | 'keep'
    matcher: 'minimatch' | 'regex'
    partitionByNewLine: boolean
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
    matcher: {
      description: 'Specifies the string matcher.',
      type: 'string',
      enum: ['minimatch', 'regex'],
    },
    ignoreCase: {
      description: 'Controls whether sorting should be case-sensitive or not.',
      type: 'boolean',
    },
    specialCharacters: {
      description:
        'Controls how special characters should be handled before sorting.',
      type: 'string',
      enum: ['remove', 'trim', 'keep'],
    },
    groupKind: {
      description: 'Specifies top-level groups.',
      enum: ['mixed', 'literals-first', 'spreads-first'],
      type: 'string',
    },
    partitionByComment: {
      description:
        'Allows you to use comments to separate the array members into logical groups.',
      anyOf: [
        {
          type: 'array',
          items: {
            type: 'string',
          },
        },
        {
          type: 'boolean',
        },
        {
          type: 'string',
        },
      ],
    },
    partitionByNewLine: {
      description:
        'Allows to use spaces to separate the nodes into logical groups.',
      type: 'boolean',
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
      specialCharacters: 'keep',
      matcher: 'minimatch',
      groupKind: 'literals-first',
      partitionByComment: false,
      partitionByNewLine: false,
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
  elements: (TSESTree.SpreadElement | TSESTree.Expression | null)[],
) => {
  let settings = getSettings(context.settings)

  if (elements.length > 1) {
    let options = complete(context.options.at(0), settings, {
      groupKind: 'literals-first',
      type: 'alphabetical',
      ignoreCase: true,
      specialCharacters: 'keep',
      matcher: 'minimatch',
      order: 'asc',
      partitionByComment: false,
      partitionByNewLine: false,
    } as const)

    let sourceCode = getSourceCode(context)
    let partitionComment = options.partitionByComment

    let formattedMembers: SortingNode[][] = elements.reduce(
      (
        accumulator: SortingNode[][],
        element: TSESTree.SpreadElement | TSESTree.Expression | null,
      ) => {
        if (element !== null) {
          let group = 'unknown'
          if (typeof options.groupKind === 'string') {
            group = element.type === 'SpreadElement' ? 'spread' : 'literal'
          }

          let lastSortingNode = accumulator.at(-1)?.at(-1)
          let sortingNode: SortingNode = {
            name:
              element.type === 'Literal'
                ? `${element.value}`
                : sourceCode.getText(element),
            size: rangeToDiff(element, sourceCode),
            node: element,
            group,
          }
          if (
            (partitionComment &&
              hasPartitionComment(
                partitionComment,
                getCommentsBefore(element, sourceCode),
                options.matcher,
              )) ||
            (options.partitionByNewLine &&
              lastSortingNode &&
              getLinesBetween(sourceCode, lastSortingNode, sortingNode))
          ) {
            accumulator.push([])
          }

          accumulator.at(-1)!.push(sortingNode)
        }

        return accumulator
      },
      [[]],
    )

    for (let nodes of formattedMembers) {
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

              return makeFixes(fixer, nodes, sortedNodes, sourceCode, options)
            },
          })
        }
      })
    }
  }
}
