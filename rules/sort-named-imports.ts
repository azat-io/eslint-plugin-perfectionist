import type { TSESTree } from '@typescript-eslint/types'

import type {
  PartitionByCommentOption,
  CommonOptions,
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
import { hasPartitionComment } from '../utils/has-partition-comment'
import { createNodeIndexMap } from '../utils/create-node-index-map'
import { getCommentsBefore } from '../utils/get-comments-before'
import { createEslintRule } from '../utils/create-eslint-rule'
import { getLinesBetween } from '../utils/get-lines-between'
import { getSourceCode } from '../utils/get-source-code'
import { rangeToDiff } from '../utils/range-to-diff'
import { getSettings } from '../utils/get-settings'
import { isSortable } from '../utils/is-sortable'
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
      ignoreAlias: boolean
    } & CommonOptions
  >,
]

interface SortNamedImportsSortingNode
  extends SortingNode<TSESTree.ImportClause> {
  groupKind: 'value' | 'type'
}

type MESSAGE_ID = 'unexpectedNamedImportsOrder'

let defaultOptions: Required<Options[0]> = {
  specialCharacters: 'keep',
  partitionByNewLine: false,
  partitionByComment: false,
  type: 'alphabetical',
  ignoreAlias: false,
  groupKind: 'mixed',
  ignoreCase: true,
  locales: 'en-US',
  alphabet: '',
  order: 'asc',
}

export default createEslintRule<Options, MESSAGE_ID>({
  create: context => ({
    ImportDeclaration: node => {
      let specifiers = node.specifiers.filter(
        ({ type }) => type === 'ImportSpecifier',
      )
      if (!isSortable(specifiers)) {
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

      let formattedMembers: SortNamedImportsSortingNode[][] = [[]]
      for (let specifier of specifiers) {
        let { name } = specifier.local

        if (specifier.type === 'ImportSpecifier' && options.ignoreAlias) {
          if (specifier.imported.type === 'Identifier') {
            ;({ name } = specifier.imported)
          } else {
            name = specifier.imported.value
          }
        }

        let lastSortingNode = formattedMembers.at(-1)?.at(-1)
        let sortingNode: SortNamedImportsSortingNode = {
          groupKind:
            specifier.type === 'ImportSpecifier' &&
            specifier.importKind === 'type'
              ? 'type'
              : 'value',
          isEslintDisabled: isNodeEslintDisabled(
            specifier,
            eslintDisabledLines,
          ),
          size: rangeToDiff(specifier, sourceCode),
          node: specifier,
          name,
        }

        if (
          hasPartitionComment({
            comments: getCommentsBefore({
              node: specifier,
              sourceCode,
            }),
            partitionByComment: options.partitionByComment,
          }) ||
          (options.partitionByNewLine &&
            lastSortingNode &&
            getLinesBetween(sourceCode, lastSortingNode, sortingNode))
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
        ): SortNamedImportsSortingNode[] =>
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
            messageId: 'unexpectedNamedImportsOrder',
            node: right.node,
          })
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
          ignoreAlias: {
            description: 'Controls whether to ignore alias names.',
            type: 'boolean',
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
      url: 'https://perfectionist.dev/rules/sort-named-imports',
      description: 'Enforce sorted named imports.',
      recommended: true,
    },
    messages: {
      unexpectedNamedImportsOrder:
        'Expected "{{right}}" to come before "{{left}}".',
    },
    type: 'suggestion',
    fixable: 'code',
  },
  defaultOptions: [defaultOptions],
  name: 'sort-named-imports',
})
