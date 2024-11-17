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
import { isSortable } from '../utils/is-sortable'
import { sortNodes } from '../utils/sort-nodes'
import { makeFixes } from '../utils/make-fixes'
import { complete } from '../utils/complete'
import { pairwise } from '../utils/pairwise'

type MESSAGE_ID = 'unexpectedNamedExportsOrder'

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

interface SortNamedExportsSortingNode
  extends SortingNode<TSESTree.ExportSpecifier> {
  groupKind: 'value' | 'type'
}

let defaultOptions: Required<Options[0]> = {
  type: 'alphabetical',
  order: 'asc',
  ignoreCase: true,
  specialCharacters: 'keep',
  partitionByNewLine: false,
  partitionByComment: false,
  groupKind: 'mixed',
  locales: 'en-US',
}

export default createEslintRule<Options, MESSAGE_ID>({
  name: 'sort-named-exports',
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Enforce sorted named exports.',
      url: 'https://perfectionist.dev/rules/sort-named-exports',
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
          groupKind: {
            description: 'Specifies top-level groups.',
            enum: ['mixed', 'values-first', 'types-first'],
            type: 'string',
          },
          partitionByComment: {
            ...partitionByCommentJsonSchema,
            description:
              'Allows you to use comments to separate the named exports members into logical groups.',
          },
          partitionByNewLine: partitionByNewLineJsonSchema,
        },
        additionalProperties: false,
      },
    ],
    messages: {
      unexpectedNamedExportsOrder:
        'Expected "{{right}}" to come before "{{left}}".',
    },
  },
  defaultOptions: [defaultOptions],
  create: context => ({
    ExportNamedDeclaration: node => {
      if (!isSortable(node.specifiers)) {
        return
      }

      let settings = getSettings(context.settings)
      let options = complete(context.options.at(0), settings, defaultOptions)
      let sourceCode = getSourceCode(context)
      let eslintDisabledLines = getEslintDisabledLines({
        sourceCode,
        ruleName: context.id,
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
          size: rangeToDiff(specifier, sourceCode),
          node: specifier,
          groupKind,
          isEslintDisabled: isNodeEslintDisabled(
            specifier,
            eslintDisabledLines,
          ),
          name,
        }
        if (
          (options.partitionByComment &&
            hasPartitionComment(
              options.partitionByComment,
              getCommentsBefore(specifier, sourceCode),
            )) ||
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
        ): SortNamedExportsSortingNode[] =>
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
            messageId: 'unexpectedNamedExportsOrder',
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
  }),
})
