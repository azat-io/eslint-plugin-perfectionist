import type { TSESTree } from '@typescript-eslint/types'

import type { Modifier, Selector, Options } from './sort-exports/types'
import type { SortingNode } from '../types/sorting-node'

import {
  partitionByCommentJsonSchema,
  partitionByNewLineJsonSchema,
  commonJsonSchemas,
  groupsJsonSchema,
} from '../utils/common-json-schemas'
import { validateCustomSortConfiguration } from '../utils/validate-custom-sort-configuration'
import { generatePredefinedGroups } from '../utils/generate-predefined-groups'
import { getEslintDisabledLines } from '../utils/get-eslint-disabled-lines'
import { isNodeEslintDisabled } from '../utils/is-node-eslint-disabled'
import { GROUP_ORDER_ERROR, ORDER_ERROR } from '../utils/report-errors'
import { sortNodesByGroups } from '../utils/sort-nodes-by-groups'
import { createEslintRule } from '../utils/create-eslint-rule'
import { reportAllErrors } from '../utils/report-all-errors'
import { shouldPartition } from '../utils/should-partition'
import { rangeToDiff } from '../utils/range-to-diff'
import { getSettings } from '../utils/get-settings'
import { useGroups } from '../utils/use-groups'
import { complete } from '../utils/complete'

/**
 * Cache computed groups by modifiers and selectors for performance
 */
let cachedGroupsByModifiersAndSelectors = new Map<string, string[]>()

interface SortExportsSortingNode
  extends SortingNode<
    TSESTree.ExportNamedDeclarationWithSource | TSESTree.ExportAllDeclaration
  > {
  groupKind: 'value' | 'type'
}

type MESSAGE_ID = 'unexpectedExportsGroupOrder' | 'unexpectedExportsOrder'

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
  groups: [],
}

export default createEslintRule<Options, MESSAGE_ID>({
  create: context => {
    let settings = getSettings(context.settings)

    let options = complete(context.options.at(0), settings, defaultOptions)
    validateCustomSortConfiguration(options)

    let { sourceCode, id } = context
    let eslintDisabledLines = getEslintDisabledLines({
      ruleName: id,
      sourceCode,
    })

    let formattedMembers: SortExportsSortingNode[][] = [[]]

    let registerNode = (
      node:
        | TSESTree.ExportNamedDeclarationWithSource
        | TSESTree.ExportAllDeclaration,
    ): void => {
      let { defineGroup, getGroup } = useGroups(options)
      let selector: Selector = 'export'
      let modifiers: Modifier[] = []
      if (node.exportKind === 'value') {
        modifiers.push('value')
      } else {
        modifiers.push('type')
      }

      let predefinedGroups = generatePredefinedGroups({
        cache: cachedGroupsByModifiersAndSelectors,
        selectors: [selector],
        modifiers,
      })

      for (let predefinedGroup of predefinedGroups) {
        defineGroup(predefinedGroup)
      }

      let sortingNode: SortExportsSortingNode = {
        isEslintDisabled: isNodeEslintDisabled(node, eslintDisabledLines),
        groupKind: node.exportKind === 'value' ? 'value' : 'type',
        size: rangeToDiff(node, sourceCode),
        addSafetySemicolonWhenInline: true,
        name: node.source.value,
        group: getGroup(),
        node,
      }
      let lastNode = formattedMembers.at(-1)?.at(-1)

      if (
        shouldPartition({
          lastSortingNode: lastNode,
          sortingNode,
          sourceCode,
          options,
        })
      ) {
        formattedMembers.push([])
      }

      formattedMembers.at(-1)!.push(sortingNode)
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

        for (let nodes of formattedMembers) {
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
              sortNodesByGroups({
                getOptionsByGroupNumber: () => ({ options }),
                ignoreEslintDisabledNodes,
                groups: options.groups,
                nodes: groupedNodes,
              }),
            )

          reportAllErrors<MESSAGE_ID>({
            availableMessageIds: {
              unexpectedGroupOrder: 'unexpectedExportsGroupOrder',
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
    schema: {
      items: {
        properties: {
          ...commonJsonSchemas,
          groupKind: {
            enum: ['mixed', 'values-first', 'types-first'],
            description: 'Specifies top-level groups.',
            type: 'string',
          },
          partitionByComment: partitionByCommentJsonSchema,
          partitionByNewLine: partitionByNewLineJsonSchema,
          groups: groupsJsonSchema,
        },
        additionalProperties: false,
        type: 'object',
      },
      uniqueItems: true,
      type: 'array',
    },
    docs: {
      url: 'https://perfectionist.dev/rules/sort-exports',
      description: 'Enforce sorted exports.',
      recommended: true,
    },
    messages: {
      unexpectedExportsGroupOrder: GROUP_ORDER_ERROR,
      unexpectedExportsOrder: ORDER_ERROR,
    },
    type: 'suggestion',
    fixable: 'code',
  },
  defaultOptions: [defaultOptions],
  name: 'sort-exports',
})
