import type { TSESTree } from '@typescript-eslint/types'

import type {
  PartitionByCommentOption,
  CommonOptions,
} from '../types/common-options'
import type { SortingNode } from '../types/sorting-node'

import {
  partitionByCommentJsonSchema,
  partitionByNewLineJsonSchema,
  specialCharactersJsonSchema,
  ignoreCaseJsonSchema,
  buildTypeJsonSchema,
  alphabetJsonSchema,
  localesJsonSchema,
  orderJsonSchema,
} from '../utils/common-json-schemas'
import { validateCustomSortConfiguration } from '../utils/validate-custom-sort-configuration'
import { getEslintDisabledLines } from '../utils/get-eslint-disabled-lines'
import { isNodeEslintDisabled } from '../utils/is-node-eslint-disabled'
import { hasPartitionComment } from '../utils/has-partition-comment'
import { createNodeIndexMap } from '../utils/create-node-index-map'
import { getCommentsBefore } from '../utils/get-comments-before'
import { createEslintRule } from '../utils/create-eslint-rule'
import { getLinesBetween } from '../utils/get-lines-between'
import { getSourceCode } from '../utils/get-source-code'
import { rangeToDiff } from '../utils/range-to-diff'
import { getSettings } from '../utils/get-settings'
import { makeFixes } from '../utils/make-fixes'
import { sortNodes } from '../utils/sort-nodes'
import { complete } from '../utils/complete'
import { pairwise } from '../utils/pairwise'

type Options = [
  Partial<
    {
      type: 'alphabetical' | 'line-length' | 'natural' | 'custom'
      groupKind: 'values-first' | 'types-first' | 'mixed'
      partitionByComment: PartitionByCommentOption
      partitionByNewLine: boolean
    } & CommonOptions
  >,
]

interface SortExportsSortingNode
  extends SortingNode<
    TSESTree.ExportNamedDeclarationWithSource | TSESTree.ExportAllDeclaration
  > {
  groupKind: 'value' | 'type'
}

type MESSAGE_ID = 'unexpectedExportsOrder'

let defaultOptions: Required<Options[0]> = {
  specialCharacters: 'keep',
  partitionByComment: false,
  partitionByNewLine: false,
  type: 'alphabetical',
  groupKind: 'mixed',
  ignoreCase: true,
  locales: 'en-US',
  alphabet: '',
  order: 'asc',
}

export default createEslintRule<Options, MESSAGE_ID>({
  create: context => {
    let settings = getSettings(context.settings)

    let options = complete(context.options.at(0), settings, defaultOptions)
    validateCustomSortConfiguration(options)

    let sourceCode = getSourceCode(context)
    let partitionComment = options.partitionByComment
    let eslintDisabledLines = getEslintDisabledLines({
      ruleName: context.id,
      sourceCode,
    })

    let parts: SortExportsSortingNode[][] = [[]]

    let registerNode = (
      node:
        | TSESTree.ExportNamedDeclarationWithSource
        | TSESTree.ExportAllDeclaration,
    ): void => {
      let sortingNode: SortExportsSortingNode = {
        isEslintDisabled: isNodeEslintDisabled(node, eslintDisabledLines),
        groupKind: node.exportKind === 'value' ? 'value' : 'type',
        size: rangeToDiff(node, sourceCode),
        addSafetySemicolonWhenInline: true,
        name: node.source.value,
        node,
      }
      let lastNode = parts.at(-1)?.at(-1)
      if (
        (partitionComment &&
          hasPartitionComment({
            comments: getCommentsBefore({
              sourceCode,
              node,
            }),
            partitionByComment: options.partitionByComment,
          })) ||
        (options.partitionByNewLine &&
          lastNode &&
          getLinesBetween(sourceCode, lastNode, sortingNode))
      ) {
        parts.push([])
      }
      parts.at(-1)!.push(sortingNode)
    }

    return {
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

          let nodeIndexMap = createNodeIndexMap(sortedNodes)

          pairwise(nodes, (left, right) => {
            let leftIndex = nodeIndexMap.get(left)!
            let rightIndex = nodeIndexMap.get(right)!

            let indexOfRightExcludingEslintDisabled =
              sortedNodesExcludingEslintDisabled.indexOf(right)
            if (
              leftIndex < rightIndex &&
              leftIndex < indexOfRightExcludingEslintDisabled
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
                right: right.name,
                left: left.name,
              },
              messageId: 'unexpectedExportsOrder',
              node: right.node,
            })
          })
        }
      },
      ExportNamedDeclaration: node => {
        if (node.source !== null) {
          registerNode(node)
        }
      },
      ExportAllDeclaration: registerNode,
    }
  },
  meta: {
    schema: [
      {
        properties: {
          groupKind: {
            enum: ['mixed', 'values-first', 'types-first'],
            description: 'Specifies top-level groups.',
            type: 'string',
          },
          partitionByComment: partitionByCommentJsonSchema,
          partitionByNewLine: partitionByNewLineJsonSchema,
          specialCharacters: specialCharactersJsonSchema,
          ignoreCase: ignoreCaseJsonSchema,
          alphabet: alphabetJsonSchema,
          type: buildTypeJsonSchema(),
          locales: localesJsonSchema,
          order: orderJsonSchema,
        },
        additionalProperties: false,
        type: 'object',
      },
    ],
    docs: {
      url: 'https://perfectionist.dev/rules/sort-exports',
      description: 'Enforce sorted exports.',
      recommended: true,
    },
    messages: {
      unexpectedExportsOrder: 'Expected "{{right}}" to come before "{{left}}".',
    },
    type: 'suggestion',
    fixable: 'code',
  },
  defaultOptions: [defaultOptions],
  name: 'sort-exports',
})
