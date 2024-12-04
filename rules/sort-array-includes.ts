import type { JSONSchema4 } from '@typescript-eslint/utils/json-schema'
import type { RuleContext } from '@typescript-eslint/utils/ts-eslint'
import type { TSESTree } from '@typescript-eslint/types'

import type { SortingNode } from '../typings'

import {
  partitionByCommentJsonSchema,
  specialCharactersJsonSchema,
  ignoreCaseJsonSchema,
  alphabetJsonSchema,
  localesJsonSchema,
  orderJsonSchema,
  typeJsonSchema,
} from '../utils/common-json-schemas'
import { getEslintDisabledLines } from '../utils/get-eslint-disabled-lines'
import { isNodeEslintDisabled } from '../utils/is-node-eslint-disabled'
import { hasPartitionComment } from '../utils/is-partition-comment'
import { getCommentsBefore } from '../utils/get-comments-before'
import { createEslintRule } from '../utils/create-eslint-rule'
import { getLinesBetween } from '../utils/get-lines-between'
import { getSourceCode } from '../utils/get-source-code'
import { toSingleLine } from '../utils/to-single-line'
import { rangeToDiff } from '../utils/range-to-diff'
import { getSettings } from '../utils/get-settings'
import { isSortable } from '../utils/is-sortable'
import { sortNodes } from '../utils/sort-nodes'
import { makeFixes } from '../utils/make-fixes'
import { complete } from '../utils/complete'
import { pairwise } from '../utils/pairwise'

export type Options = [
  Partial<{
    type: 'alphabetical' | 'line-length' | 'natural' | 'custom'
    groupKind: 'literals-first' | 'spreads-first' | 'mixed'
    partitionByComment: string[] | boolean | string
    specialCharacters: 'remove' | 'trim' | 'keep'
    locales: NonNullable<Intl.LocalesArgument>
    partitionByNewLine: boolean
    order: 'desc' | 'asc'
    ignoreCase: boolean
    alphabet: string
  }>,
]

interface SortArrayIncludesSortingNode
  extends SortingNode<TSESTree.SpreadElement | TSESTree.Expression> {
  groupKind: 'literal' | 'spread'
}

type MESSAGE_ID = 'unexpectedArrayIncludesOrder'

export let defaultOptions: Required<Options[0]> = {
  groupKind: 'literals-first',
  specialCharacters: 'keep',
  partitionByComment: false,
  partitionByNewLine: false,
  type: 'alphabetical',
  ignoreCase: true,
  locales: 'en-US',
  alphabet: '',
  order: 'asc',
}

export let jsonSchema: JSONSchema4 = {
  properties: {
    partitionByComment: {
      ...partitionByCommentJsonSchema,
      description:
        'Allows you to use comments to separate the array members into logical groups.',
    },
    groupKind: {
      enum: ['mixed', 'literals-first', 'spreads-first'],
      description: 'Specifies top-level groups.',
      type: 'string',
    },
    partitionByNewLine: {
      description:
        'Allows to use spaces to separate the nodes into logical groups.',
      type: 'boolean',
    },
    specialCharacters: specialCharactersJsonSchema,
    ignoreCase: ignoreCaseJsonSchema,
    alphabet: alphabetJsonSchema,
    locales: localesJsonSchema,
    order: orderJsonSchema,
    type: typeJsonSchema,
  },
  additionalProperties: false,
  type: 'object',
}

export default createEslintRule<Options, MESSAGE_ID>({
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
  meta: {
    docs: {
      description: 'Enforce sorted arrays before include method.',
      url: 'https://perfectionist.dev/rules/sort-array-includes',
      recommended: true,
    },
    messages: {
      unexpectedArrayIncludesOrder:
        'Expected "{{right}}" to come before "{{left}}".',
    },
    schema: [jsonSchema],
    type: 'suggestion',
    fixable: 'code',
  },
  defaultOptions: [defaultOptions],
  name: 'sort-array-includes',
})

export let sortArray = <MessageIds extends string>(
  context: Readonly<RuleContext<MessageIds, Options>>,
  messageId: MessageIds,
  elements: (TSESTree.SpreadElement | TSESTree.Expression | null)[],
): void => {
  if (!isSortable(elements)) {
    return
  }

  let settings = getSettings(context.settings)
  let options = complete(context.options.at(0), settings, defaultOptions)
  let sourceCode = getSourceCode(context)
  let eslintDisabledLines = getEslintDisabledLines({
    ruleName: context.id,
    sourceCode,
  })
  let formattedMembers: SortArrayIncludesSortingNode[][] = elements.reduce(
    (
      accumulator: SortArrayIncludesSortingNode[][],
      element: TSESTree.SpreadElement | TSESTree.Expression | null,
    ) => {
      if (element === null) {
        return accumulator
      }

      let lastSortingNode = accumulator.at(-1)?.at(-1)
      let sortingNode: SortArrayIncludesSortingNode = {
        name:
          element.type === 'Literal'
            ? `${element.value}`
            : sourceCode.getText(element),
        isEslintDisabled: isNodeEslintDisabled(element, eslintDisabledLines),
        groupKind: element.type === 'SpreadElement' ? 'spread' : 'literal',
        size: rangeToDiff(element, sourceCode),
        node: element,
      }
      if (
        (options.partitionByComment &&
          hasPartitionComment(
            options.partitionByComment,
            getCommentsBefore({
              node: element,
              sourceCode,
            }),
          )) ||
        (options.partitionByNewLine &&
          lastSortingNode &&
          getLinesBetween(sourceCode, lastSortingNode, sortingNode))
      ) {
        accumulator.push([])
      }

      accumulator.at(-1)!.push(sortingNode)

      return accumulator
    },
    [[]],
  )

  let groupKindOrder
  if (options.groupKind === 'literals-first') {
    groupKindOrder = ['literal', 'spread'] as const
  } else if (options.groupKind === 'spreads-first') {
    groupKindOrder = ['spread', 'literal'] as const
  } else {
    groupKindOrder = ['any'] as const
  }

  for (let nodes of formattedMembers) {
    let filteredGroupKindNodes = groupKindOrder.map(groupKind =>
      nodes.filter(
        currentNode =>
          groupKind === 'any' || currentNode.groupKind === groupKind,
      ),
    )

    let sortNodesIgnoringEslintDisabledNodes = (
      ignoreEslintDisabledNodes: boolean,
    ): SortArrayIncludesSortingNode[] =>
      filteredGroupKindNodes.flatMap(groupedNodes =>
        sortNodes(groupedNodes, options, { ignoreEslintDisabledNodes }),
      )
    let sortedNodes = sortNodesIgnoringEslintDisabledNodes(false)
    let sortedNodesExcludingEslintDisabled =
      sortNodesIgnoringEslintDisabledNodes(true)

    pairwise(nodes, (left, right) => {
      let indexOfLeft = sortedNodes.indexOf(left)
      let indexOfRight = sortedNodes.indexOf(right)
      let indexOfRightExcludingEslintDisabled =
        sortedNodesExcludingEslintDisabled.indexOf(right)
      if (
        indexOfLeft < indexOfRight &&
        indexOfLeft < indexOfRightExcludingEslintDisabled
      ) {
        return
      }

      context.report({
        fix: fixer =>
          makeFixes({
            sortedNodes: sortedNodesExcludingEslintDisabled,
            sourceCode,
            options,
            fixer,
            nodes,
          }),
        data: {
          right: toSingleLine(right.name),
          left: toSingleLine(left.name),
        },
        node: right.node,
        messageId,
      })
    })
  }
}
