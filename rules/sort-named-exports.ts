import type {
  SortNamedExportsSortingNode,
  Options,
} from './sort-named-exports/types'
import type { Modifier, Selector } from './sort-named-exports/types'

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
import { computeGroup } from '../utils/compute-group'
import { rangeToDiff } from '../utils/range-to-diff'
import { getSettings } from '../utils/get-settings'
import { isSortable } from '../utils/is-sortable'
import { complete } from '../utils/complete'

type MESSAGE_ID =
  | 'unexpectedNamedExportsGroupOrder'
  | 'unexpectedNamedExportsOrder'

/**
 * Cache computed groups by modifiers and selectors for performance
 */
let cachedGroupsByModifiersAndSelectors = new Map<string, string[]>()

let defaultOptions: Required<Options[0]> = {
  fallbackSort: { type: 'unsorted' },
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
  groups: [],
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

      let { sourceCode, id } = context
      let eslintDisabledLines = getEslintDisabledLines({
        ruleName: id,
        sourceCode,
      })

      let formattedMembers: SortNamedExportsSortingNode[][] = [[]]
      for (let specifier of node.specifiers) {
        let name: string

        if (options.ignoreAlias) {
          if (specifier.local.type === 'Identifier') {
            ;({ name } = specifier.local)
          } else {
            // Should not be allowed in typescript, but is possible according to
            // The AST
            // Ex: `export { 'literal' as local } from './import'`
            name = specifier.local.value
          }
        } else {
          if (specifier.exported.type === 'Identifier') {
            ;({ name } = specifier.exported)
          } else {
            name = specifier.exported.value
          }
        }

        let selector: Selector = 'export'
        let modifiers: Modifier[] = []
        if (specifier.exportKind === 'value') {
          modifiers.push('value')
        } else {
          modifiers.push('type')
        }

        let predefinedGroups = generatePredefinedGroups({
          cache: cachedGroupsByModifiersAndSelectors,
          selectors: [selector],
          modifiers,
        })
        let group = computeGroup({
          predefinedGroups,
          options,
        })

        let sortingNode: SortNamedExportsSortingNode = {
          isEslintDisabled: isNodeEslintDisabled(
            specifier,
            eslintDisabledLines,
          ),
          groupKind: specifier.exportKind === 'type' ? 'type' : 'value',
          size: rangeToDiff(specifier, sourceCode),
          node: specifier,
          group,
          name,
        }

        let lastSortingNode = formattedMembers.at(-1)?.at(-1)
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
            sortNodesByGroups({
              getOptionsByGroupNumber: () => ({ options }),
              ignoreEslintDisabledNodes,
              groups: options.groups,
              nodes: groupedNodes,
            }),
          )

        reportAllErrors<MESSAGE_ID>({
          availableMessageIds: {
            unexpectedGroupOrder: 'unexpectedNamedExportsGroupOrder',
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
    schema: {
      items: {
        properties: {
          ...commonJsonSchemas,
          groupKind: {
            description: '[DEPRECATED] Specifies top-level groups.',
            enum: ['mixed', 'values-first', 'types-first'],
            type: 'string',
          },
          ignoreAlias: {
            description: 'Controls whether to ignore alias names.',
            type: 'boolean',
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
      url: 'https://perfectionist.dev/rules/sort-named-exports',
      description: 'Enforce sorted named exports.',
      recommended: true,
    },
    messages: {
      unexpectedNamedExportsGroupOrder: GROUP_ORDER_ERROR,
      unexpectedNamedExportsOrder: ORDER_ERROR,
    },
    type: 'suggestion',
    fixable: 'code',
  },
  defaultOptions: [defaultOptions],
  name: 'sort-named-exports',
})
