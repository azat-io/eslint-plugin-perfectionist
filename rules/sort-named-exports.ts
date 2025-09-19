import type {
  SortNamedExportsSortingNode,
  Modifier,
  Selector,
  Options,
} from './sort-named-exports/types'

import {
  buildCustomGroupsArrayJsonSchema,
  partitionByCommentJsonSchema,
  partitionByNewLineJsonSchema,
  newlinesBetweenJsonSchema,
  commonJsonSchemas,
  groupsJsonSchema,
} from '../utils/common-json-schemas'
import {
  MISSED_SPACING_ERROR,
  EXTRA_SPACING_ERROR,
  GROUP_ORDER_ERROR,
  ORDER_ERROR,
} from '../utils/report-errors'
import { validateNewlinesAndPartitionConfiguration } from '../utils/validate-newlines-and-partition-configuration'
import {
  singleCustomGroupJsonSchema,
  allModifiers,
  allSelectors,
} from './sort-named-exports/types'
import { buildGetCustomGroupOverriddenOptionsFunction } from '../utils/get-custom-groups-compare-options'
import { validateGeneratedGroupsConfiguration } from '../utils/validate-generated-groups-configuration'
import { validateCustomSortConfiguration } from '../utils/validate-custom-sort-configuration'
import { generatePredefinedGroups } from '../utils/generate-predefined-groups'
import { getEslintDisabledLines } from '../utils/get-eslint-disabled-lines'
import { isNodeEslintDisabled } from '../utils/is-node-eslint-disabled'
import { doesCustomGroupMatch } from '../utils/does-custom-group-match'
import { sortNodesByGroups } from '../utils/sort-nodes-by-groups'
import { createEslintRule } from '../utils/create-eslint-rule'
import { reportAllErrors } from '../utils/report-all-errors'
import { shouldPartition } from '../utils/should-partition'
import { computeGroup } from '../utils/compute-group'
import { rangeToDiff } from '../utils/range-to-diff'
import { getSettings } from '../utils/get-settings'
import { isSortable } from '../utils/is-sortable'
import { complete } from '../utils/complete'

type MessageId =
  | 'unexpectedNamedExportsGroupOrder'
  | 'missedSpacingBetweenNamedExports'
  | 'extraSpacingBetweenNamedExports'
  | 'unexpectedNamedExportsOrder'

/** Cache computed groups by modifiers and selectors for performance. */
let cachedGroupsByModifiersAndSelectors = new Map<string, string[]>()

let defaultOptions: Required<Options[number]> = {
  fallbackSort: { type: 'unsorted' },
  specialCharacters: 'keep',
  partitionByNewLine: false,
  partitionByComment: false,
  newlinesBetween: 'ignore',
  type: 'alphabetical',
  ignoreAlias: false,
  customGroups: [],
  ignoreCase: true,
  locales: 'en-US',
  alphabet: '',
  order: 'asc',
  groups: [],
}

export default createEslintRule<Options, MessageId>({
  create: context => ({
    ExportNamedDeclaration: node => {
      if (!isSortable(node.specifiers)) {
        return
      }

      let settings = getSettings(context.settings)
      let options = complete(context.options.at(0), settings, defaultOptions)
      validateCustomSortConfiguration(options)
      validateGeneratedGroupsConfiguration({
        modifiers: allModifiers,
        selectors: allSelectors,
        options,
      })
      validateNewlinesAndPartitionConfiguration(options)

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
          customGroupMatcher: customGroup =>
            doesCustomGroupMatch({
              selectors: [selector],
              elementName: name,
              customGroup,
              modifiers,
            }),
          predefinedGroups,
          options,
        })

        let sortingNode: Omit<SortNamedExportsSortingNode, 'partitionId'> = {
          isEslintDisabled: isNodeEslintDisabled(
            specifier,
            eslintDisabledLines,
          ),
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

        formattedMembers.at(-1)!.push({
          ...sortingNode,
          partitionId: formattedMembers.length,
        })
      }

      function sortNodesExcludingEslintDisabled(
        ignoreEslintDisabledNodes: boolean,
      ): SortNamedExportsSortingNode[] {
        return formattedMembers.flatMap(groupedNodes =>
          sortNodesByGroups({
            getOptionsByGroupIndex:
              buildGetCustomGroupOverriddenOptionsFunction(options),
            ignoreEslintDisabledNodes,
            groups: options.groups,
            nodes: groupedNodes,
          }),
        )
      }

      let nodes = formattedMembers.flat()
      reportAllErrors<MessageId>({
        availableMessageIds: {
          missedSpacingBetweenMembers: 'missedSpacingBetweenNamedExports',
          extraSpacingBetweenMembers: 'extraSpacingBetweenNamedExports',
          unexpectedGroupOrder: 'unexpectedNamedExportsGroupOrder',
          unexpectedOrder: 'unexpectedNamedExportsOrder',
        },
        sortNodesExcludingEslintDisabled,
        sourceCode,
        options,
        context,
        nodes,
      })
    },
  }),
  meta: {
    schema: {
      items: {
        properties: {
          ...commonJsonSchemas,
          ignoreAlias: {
            description: 'Controls whether to ignore alias names.',
            type: 'boolean',
          },
          customGroups: buildCustomGroupsArrayJsonSchema({
            singleCustomGroupJsonSchema,
          }),
          partitionByComment: partitionByCommentJsonSchema,
          partitionByNewLine: partitionByNewLineJsonSchema,
          newlinesBetween: newlinesBetweenJsonSchema,
          groups: groupsJsonSchema,
        },
        additionalProperties: false,
        type: 'object',
      },
      uniqueItems: true,
      type: 'array',
    },
    messages: {
      missedSpacingBetweenNamedExports: MISSED_SPACING_ERROR,
      extraSpacingBetweenNamedExports: EXTRA_SPACING_ERROR,
      unexpectedNamedExportsGroupOrder: GROUP_ORDER_ERROR,
      unexpectedNamedExportsOrder: ORDER_ERROR,
    },
    docs: {
      url: 'https://perfectionist.dev/rules/sort-named-exports',
      description: 'Enforce sorted named exports.',
      recommended: true,
    },
    type: 'suggestion',
    fixable: 'code',
  },
  defaultOptions: [defaultOptions],
  name: 'sort-named-exports',
})
