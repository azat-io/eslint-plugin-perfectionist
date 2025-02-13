import type { TSESTree } from '@typescript-eslint/types'

import type {
  PartitionByCommentOption,
  CommonOptions,
  TypeOption,
} from '../types/common-options'
import type { SortingNode } from '../types/sorting-node'

import {
  partitionByCommentJsonSchema,
  partitionByNewLineJsonSchema,
  commonJsonSchemas,
} from '../utils/common-json-schemas'
import { validateCustomSortConfiguration } from '../utils/validate-custom-sort-configuration'
import { getEslintDisabledLines } from '../utils/get-eslint-disabled-lines'
import { isNodeEslintDisabled } from '../utils/is-node-eslint-disabled'
import { createEslintRule } from '../utils/create-eslint-rule'
import { reportAllErrors } from '../utils/report-all-errors'
import { shouldPartition } from '../utils/should-partition'
import { getSourceCode } from '../utils/get-source-code'
import { rangeToDiff } from '../utils/range-to-diff'
import { ORDER_ERROR } from '../utils/report-errors'
import { getSettings } from '../utils/get-settings'
import { sortNodes } from '../utils/sort-nodes'
import { complete } from '../utils/complete'

type Options = [
  Partial<
    {
      groupKind: 'values-first' | 'types-first' | 'mixed'
      partitionByComment: PartitionByCommentOption
      partitionByNewLine: boolean
      type: TypeOption
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
  fallbackSort: { type: 'unsorted' },
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
        shouldPartition({
          lastSortingNode: lastNode,
          sortingNode,
          sourceCode,
          options,
        })
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

          reportAllErrors<MESSAGE_ID>({
            availableMessageIds: {
              unexpectedOrder: 'unexpectedExportsOrder',
            },
            sortNodesExcludingEslintDisabled,
            sourceCode,
            options,
            context,
            nodes,
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
          ...commonJsonSchemas,
          groupKind: {
            enum: ['mixed', 'values-first', 'types-first'],
            description: 'Specifies top-level groups.',
            type: 'string',
          },
          partitionByComment: partitionByCommentJsonSchema,
          partitionByNewLine: partitionByNewLineJsonSchema,
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
      unexpectedExportsOrder: ORDER_ERROR,
    },
    type: 'suggestion',
    fixable: 'code',
  },
  defaultOptions: [defaultOptions],
  name: 'sort-exports',
})
