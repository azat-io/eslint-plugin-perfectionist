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
  buildTypeJsonSchema,
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
import { isSortable } from '../utils/is-sortable'
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

interface SortNamedExportsSortingNode
  extends SortingNode<TSESTree.ExportSpecifier> {
  groupKind: 'value' | 'type'
}

type MESSAGE_ID = 'unexpectedNamedExportsOrder'

let defaultOptions: Required<Options[0]> = {
  specialCharacters: 'keep',
  partitionByNewLine: false,
  partitionByComment: false,
  type: 'alphabetical',
  groupKind: 'mixed',
  ignoreCase: true,
  locales: 'en-US',
  alphabet: '',
  order: 'asc',
}

export default createEslintRule<Options, MESSAGE_ID>({
  create: context => ({
    ExportNamedDeclaration: node => {
      if (!isSortable(node.specifiers)) {
        return
      }

      let settings = getSettings(context.settings)
      let options = complete(context.options.at(0), settings, defaultOptions)
      validateCustomSortConfiguration(options)

      let sourceCode = getSourceCode(context)
      let eslintDisabledLines = getEslintDisabledLines({
        ruleName: context.id,
        sourceCode,
      })

      let formattedMembers: SortNamedExportsSortingNode[][] = [[]]
      for (let specifier of node.specifiers) {
        let groupKind: 'value' | 'type' =
          specifier.exportKind === 'type' ? 'type' : ('value' as const)

        let name: string

        if (specifier.exported.type === 'Identifier') {
          ;({ name } = specifier.exported)
        } else {
          name = specifier.exported.value
        }

        let lastSortingNode = formattedMembers.at(-1)?.at(-1)
        let sortingNode: SortNamedExportsSortingNode = {
          isEslintDisabled: isNodeEslintDisabled(
            specifier,
            eslintDisabledLines,
          ),
          size: rangeToDiff(specifier, sourceCode),
          node: specifier,
          groupKind,
          name,
        }

        if (
          shouldPartition({
            lastSortingNode,
            sortingNode,
            sourceCode,
            options,
          })
        ) {
          formattedMembers.push([])
        }

        formattedMembers.at(-1)!.push(sortingNode)
      }

      let groupKindOrder
      if (options.groupKind === 'values-first') {
        groupKindOrder = ['value', 'type'] as const
      } else if (options.groupKind === 'types-first') {
        groupKindOrder = ['type', 'value'] as const
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
        let sortNodesExcludingEslintDisabled = (
          ignoreEslintDisabledNodes: boolean,
        ): SortNamedExportsSortingNode[] =>
          filteredGroupKindNodes.flatMap(groupedNodes =>
            sortNodes(groupedNodes, options, {
              ignoreEslintDisabledNodes,
            }),
          )

        reportAllErrors<MESSAGE_ID>({
          availableMessageIds: {
            unexpectedOrder: 'unexpectedNamedExportsOrder',
          },
          sortNodesExcludingEslintDisabled,
          sourceCode,
          options,
          context,
          nodes,
        })
      }
    },
  }),
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
          type: buildTypeJsonSchema(),
        },
        additionalProperties: false,
        type: 'object',
      },
    ],
    docs: {
      url: 'https://perfectionist.dev/rules/sort-named-exports',
      description: 'Enforce sorted named exports.',
      recommended: true,
    },
    messages: {
      unexpectedNamedExportsOrder: ORDER_ERROR,
    },
    type: 'suggestion',
    fixable: 'code',
  },
  defaultOptions: [defaultOptions],
  name: 'sort-named-exports',
})
