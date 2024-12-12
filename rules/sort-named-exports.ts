import type { TSESTree } from '@typescript-eslint/types'

import type { SortingNode } from '../typings'

import {
  partitionByCommentJsonSchema,
  partitionByNewLineJsonSchema,
  specialCharactersJsonSchema,
  ignoreCaseJsonSchema,
  alphabetJsonSchema,
  localesJsonSchema,
  orderJsonSchema,
  typeJsonSchema,
} from '../utils/common-json-schemas'
import { validateCustomSortConfiguration } from '../utils/validate-custom-sort-configuration'
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

type Options = [
  Partial<{
    type: 'alphabetical' | 'line-length' | 'natural' | 'custom'
    groupKind: 'values-first' | 'types-first' | 'mixed'
    partitionByComment: string[] | boolean | string
    specialCharacters: 'remove' | 'trim' | 'keep'
    locales: NonNullable<Intl.LocalesArgument>
    partitionByNewLine: boolean
    order: 'desc' | 'asc'
    ignoreCase: boolean
    alphabet: string
  }>,
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
          (options.partitionByComment &&
            hasPartitionComment(
              options.partitionByComment,
              getCommentsBefore({
                node: specifier,
                sourceCode,
              }),
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
            messageId: 'unexpectedNamedExportsOrder',
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
          partitionByComment: {
            ...partitionByCommentJsonSchema,
            description:
              'Allows you to use comments to separate the named exports members into logical groups.',
          },
          groupKind: {
            enum: ['mixed', 'values-first', 'types-first'],
            description: 'Specifies top-level groups.',
            type: 'string',
          },
          partitionByNewLine: partitionByNewLineJsonSchema,
          specialCharacters: specialCharactersJsonSchema,
          ignoreCase: ignoreCaseJsonSchema,
          alphabet: alphabetJsonSchema,
          locales: localesJsonSchema,
          order: orderJsonSchema,
          type: typeJsonSchema,
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
      unexpectedNamedExportsOrder:
        'Expected "{{right}}" to come before "{{left}}".',
    },
    type: 'suggestion',
    fixable: 'code',
  },
  defaultOptions: [defaultOptions],
  name: 'sort-named-exports',
})
