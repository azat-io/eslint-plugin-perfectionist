import type { TSESTree } from '@typescript-eslint/types'

import type { SortingNode } from '../typings'

import {
  partitionByCommentJsonSchema,
  partitionByNewLineJsonSchema,
  specialCharactersJsonSchema,
  ignoreCaseJsonSchema,
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
import { rangeToDiff } from '../utils/range-to-diff'
import { getSettings } from '../utils/get-settings'
import { sortNodes } from '../utils/sort-nodes'
import { makeFixes } from '../utils/make-fixes'
import { complete } from '../utils/complete'
import { pairwise } from '../utils/pairwise'

type MESSAGE_ID = 'unexpectedExportsOrder'

type Options = [
  Partial<{
    groupKind: 'values-first' | 'types-first' | 'mixed'
    type: 'alphabetical' | 'line-length' | 'natural'
    partitionByComment: string[] | boolean | string
    specialCharacters: 'remove' | 'trim' | 'keep'
    locales: NonNullable<Intl.LocalesArgument>
    partitionByNewLine: boolean
    order: 'desc' | 'asc'
    ignoreCase: boolean
  }>,
]

interface SortExportsSortingNode
  extends SortingNode<
    TSESTree.ExportNamedDeclarationWithSource | TSESTree.ExportAllDeclaration
  > {
  groupKind: 'value' | 'type'
}

let defaultOptions: Required<Options[0]> = {
  type: 'alphabetical',
  ignoreCase: true,
  specialCharacters: 'keep',
  order: 'asc',
  partitionByComment: false,
  partitionByNewLine: false,
  groupKind: 'mixed',
  locales: 'en-US',
}

export default createEslintRule<Options, MESSAGE_ID>({
  name: 'sort-exports',
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Enforce sorted exports.',
      url: 'https://perfectionist.dev/rules/sort-exports',
      recommended: true,
    },
    fixable: 'code',
    schema: [
      {
        type: 'object',
        properties: {
          type: typeJsonSchema,
          order: orderJsonSchema,
          locales: localesJsonSchema,
          ignoreCase: ignoreCaseJsonSchema,
          specialCharacters: specialCharactersJsonSchema,
          partitionByComment: {
            ...partitionByCommentJsonSchema,
            description:
              'Allows you to use comments to separate the exports into logical groups.',
          },
          partitionByNewLine: partitionByNewLineJsonSchema,
          groupKind: {
            description: 'Specifies top-level groups.',
            type: 'string',
            enum: ['mixed', 'values-first', 'types-first'],
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      unexpectedExportsOrder: 'Expected "{{right}}" to come before "{{left}}".',
    },
  },
  defaultOptions: [defaultOptions],
  create: context => {
    let settings = getSettings(context.settings)

    let options = complete(context.options.at(0), settings, defaultOptions)

    let sourceCode = getSourceCode(context)
    let partitionComment = options.partitionByComment
    let eslintDisabledLines = getEslintDisabledLines({
      sourceCode,
      ruleName: context.id,
    })

    let parts: SortExportsSortingNode[][] = [[]]

    let registerNode = (
      node:
        | TSESTree.ExportNamedDeclarationWithSource
        | TSESTree.ExportAllDeclaration,
    ): void => {
      let sortingNode: SortExportsSortingNode = {
        size: rangeToDiff(node, sourceCode),
        name: node.source.value,
        node,
        isEslintDisabled: isNodeEslintDisabled(node, eslintDisabledLines),
        groupKind: node.exportKind === 'value' ? 'value' : 'type',
        addSafetySemicolonWhenInline: true,
      }
      let lastNode = parts.at(-1)?.at(-1)
      if (
        (partitionComment &&
          hasPartitionComment(
            partitionComment,
            getCommentsBefore(node, sourceCode),
          )) ||
        (options.partitionByNewLine &&
          lastNode &&
          getLinesBetween(sourceCode, lastNode, sortingNode))
      ) {
        parts.push([])
      }
      parts.at(-1)!.push(sortingNode)
    }

    return {
      ExportAllDeclaration: registerNode,
      ExportNamedDeclaration: node => {
        if (node.source !== null) {
          registerNode(node)
        }
      },
      'Program:exit': () => {
        let groupKindOrder
        if (options.groupKind === 'values-first') {
          groupKindOrder = ['value', 'type'] as const
        } else if (options.groupKind === 'types-first') {
          groupKindOrder = ['type', 'value'] as const
        } else {
          groupKindOrder = ['any'] as const
        }

        for (let nodes of parts) {
          let filteredGroupKindNodes = groupKindOrder.map(groupKind =>
            nodes.filter(
              currentNode =>
                groupKind === 'any' || currentNode.groupKind === groupKind,
            ),
          )
          let sortNodesExcludingEslintDisabled = (
            ignoreEslintDisabledNodes: boolean,
          ): SortExportsSortingNode[] =>
            filteredGroupKindNodes.flatMap(groupedNodes =>
              sortNodes(groupedNodes, options, {
                ignoreEslintDisabledNodes,
              }),
            )
          let sortedNodes = sortNodesExcludingEslintDisabled(false)
          let sortedNodesExcludingEslintDisabled =
            sortNodesExcludingEslintDisabled(true)

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
              messageId: 'unexpectedExportsOrder',
              data: {
                left: left.name,
                right: right.name,
              },
              node: right.node,
              fix: fixer =>
                makeFixes(
                  fixer,
                  nodes,
                  sortedNodesExcludingEslintDisabled,
                  sourceCode,
                  options,
                ),
            })
          })
        }
      },
    }
  },
})
