import type { TSESLint } from '@typescript-eslint/utils'
import type { TSESTree } from '@typescript-eslint/types'

import { AST_NODE_TYPES } from '@typescript-eslint/utils'

import type { Modifier, Selector, Options } from './sort-exports/types'
import type { SortingNode } from '../types/sorting-node'

import {
  MISSED_COMMENT_ABOVE_ERROR,
  MISSED_SPACING_ERROR,
  EXTRA_SPACING_ERROR,
  GROUP_ORDER_ERROR,
  ORDER_ERROR,
} from '../utils/report-errors'
import {
  partitionByCommentJsonSchema,
  partitionByNewLineJsonSchema,
} from '../utils/json-schemas/common-partition-json-schemas'
import { validateNewlinesAndPartitionConfiguration } from '../utils/validate-newlines-and-partition-configuration'
import { buildDefaultOptionsByGroupIndexComputer } from '../utils/build-default-options-by-group-index-computer'
import { defaultComparatorByOptionsComputer } from '../utils/compare/default-comparator-by-options-computer'
import {
  customGroupMatchOptionsJsonSchema,
  allModifiers,
  allSelectors,
} from './sort-exports/types'
import { buildCommonGroupsJsonSchemas } from '../utils/json-schemas/common-groups-json-schemas'
import { validateCustomSortConfiguration } from '../utils/validate-custom-sort-configuration'
import { validateGroupsConfiguration } from '../utils/validate-groups-configuration'
import { buildCommonJsonSchemas } from '../utils/json-schemas/common-json-schemas'
import { generatePredefinedGroups } from '../utils/generate-predefined-groups'
import { getEslintDisabledLines } from '../utils/get-eslint-disabled-lines'
import { isNodeEslintDisabled } from '../utils/is-node-eslint-disabled'
import { doesCustomGroupMatch } from '../utils/does-custom-group-match'
import { UnreachableCaseError } from '../utils/unreachable-case-error'
import { isNodeOnSingleLine } from '../utils/is-node-on-single-line'
import { sortNodesByGroups } from '../utils/sort-nodes-by-groups'
import { createEslintRule } from '../utils/create-eslint-rule'
import { reportAllErrors } from '../utils/report-all-errors'
import { shouldPartition } from '../utils/should-partition'
import { computeGroup } from '../utils/compute-group'
import { rangeToDiff } from '../utils/range-to-diff'
import { getSettings } from '../utils/get-settings'
import { complete } from '../utils/complete'

/** Cache computed groups by modifiers and selectors for performance. */
let cachedGroupsByModifiersAndSelectors = new Map<string, string[]>()

const ORDER_ERROR_ID = 'unexpectedExportsOrder'
const GROUP_ORDER_ERROR_ID = 'unexpectedExportsGroupOrder'
const EXTRA_SPACING_ERROR_ID = 'extraSpacingBetweenExports'
const MISSED_SPACING_ERROR_ID = 'missedSpacingBetweenExports'
const MISSED_COMMENT_ABOVE_ERROR_ID = 'missedCommentAboveExport'

type MessageId =
  | typeof MISSED_COMMENT_ABOVE_ERROR_ID
  | typeof MISSED_SPACING_ERROR_ID
  | typeof EXTRA_SPACING_ERROR_ID
  | typeof GROUP_ORDER_ERROR_ID
  | typeof ORDER_ERROR_ID

type SortExportsSortingNode = SortingNode<
  TSESTree.ExportNamedDeclarationWithSource | TSESTree.ExportAllDeclaration
>

let defaultOptions: Required<Options[number]> = {
  fallbackSort: { type: 'unsorted' },
  newlinesInside: 'newlinesBetween',
  specialCharacters: 'keep',
  partitionByComment: false,
  newlinesBetween: 'ignore',
  partitionByNewLine: false,
  type: 'alphabetical',
  customGroups: [],
  ignoreCase: true,
  locales: 'en-US',
  alphabet: '',
  order: 'asc',
  groups: [],
}

export default createEslintRule<Options, MessageId>({
  create: context => {
    let settings = getSettings(context.settings)

    let options = complete(context.options.at(0), settings, defaultOptions)
    validateCustomSortConfiguration(options)
    validateGroupsConfiguration({
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

    let formattedMembers: SortExportsSortingNode[][] = [[]]

    function registerNode(
      node: TSESTree.ExportNamedDeclaration | TSESTree.ExportAllDeclaration,
    ): void {
      if (!node.source) {
        return
      }

      let selector: Selector = 'export'
      let modifiers: Modifier[] = [
        computeExportKindModifier(node),
        computeExportTypeModifier(node),
        computeLineCountModifier(node),
      ]

      let name = node.source.value

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

      let sortingNode: Omit<SortExportsSortingNode, 'partitionId'> = {
        isEslintDisabled: isNodeEslintDisabled(node, eslintDisabledLines),
        size: rangeToDiff(node, sourceCode),
        addSafetySemicolonWhenInline: true,
        group,
        name,
        node,
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

    return {
      'Program:exit': () => {
        sortExportNodes({
          formattedMembers,
          context,
          options,
        })
      },
      ExportNamedDeclaration: registerNode,
      ExportAllDeclaration: registerNode,
    }
  },
  meta: {
    schema: {
      items: {
        properties: {
          ...buildCommonJsonSchemas(),
          ...buildCommonGroupsJsonSchemas({
            additionalCustomGroupMatchProperties:
              customGroupMatchOptionsJsonSchema,
          }),
          partitionByComment: partitionByCommentJsonSchema,
          partitionByNewLine: partitionByNewLineJsonSchema,
        },
        additionalProperties: false,
        type: 'object',
      },
      uniqueItems: true,
      type: 'array',
    },
    messages: {
      [MISSED_COMMENT_ABOVE_ERROR_ID]: MISSED_COMMENT_ABOVE_ERROR,
      [MISSED_SPACING_ERROR_ID]: MISSED_SPACING_ERROR,
      [EXTRA_SPACING_ERROR_ID]: EXTRA_SPACING_ERROR,
      [GROUP_ORDER_ERROR_ID]: GROUP_ORDER_ERROR,
      [ORDER_ERROR_ID]: ORDER_ERROR,
    },
    docs: {
      url: 'https://perfectionist.dev/rules/sort-exports',
      description: 'Enforce sorted exports.',
      recommended: true,
    },
    type: 'suggestion',
    fixable: 'code',
  },
  defaultOptions: [defaultOptions],
  name: 'sort-exports',
})

function sortExportNodes({
  formattedMembers,
  context,
  options,
}: {
  context: TSESLint.RuleContext<MessageId, Options>
  formattedMembers: SortExportsSortingNode[][]
  options: Required<Options[number]>
}): void {
  let optionsByGroupIndexComputer =
    buildDefaultOptionsByGroupIndexComputer(options)

  let nodes = formattedMembers.flat()
  reportAllErrors<MessageId>({
    availableMessageIds: {
      missedSpacingBetweenMembers: MISSED_SPACING_ERROR_ID,
      extraSpacingBetweenMembers: EXTRA_SPACING_ERROR_ID,
      missedCommentAbove: MISSED_COMMENT_ABOVE_ERROR_ID,
      unexpectedGroupOrder: GROUP_ORDER_ERROR_ID,
      unexpectedOrder: ORDER_ERROR_ID,
    },
    sortNodesExcludingEslintDisabled,
    options,
    context,
    nodes,
  })

  function sortNodesExcludingEslintDisabled(
    ignoreEslintDisabledNodes: boolean,
  ): SortExportsSortingNode[] {
    return formattedMembers.flatMap(groupedNodes =>
      sortNodesByGroups({
        comparatorByOptionsComputer: defaultComparatorByOptionsComputer,
        optionsByGroupIndexComputer,
        ignoreEslintDisabledNodes,
        groups: options.groups,
        nodes: groupedNodes,
      }),
    )
  }
}

function computeExportKindModifier(
  node: TSESTree.ExportNamedDeclaration | TSESTree.ExportAllDeclaration,
): 'value' | 'type' {
  let exportKind = 'exportKind' in node ? node.exportKind : undefined

  switch (exportKind) {
    case undefined:
    case 'value':
      return 'value'
    case 'type':
      return 'type'
    /* v8 ignore next 2 -- @preserve Exhaustive guard. */
    default:
      throw new UnreachableCaseError(exportKind)
  }
}

function computeExportTypeModifier(
  node: TSESTree.ExportNamedDeclaration | TSESTree.ExportAllDeclaration,
): 'wildcard' | 'named' {
  switch (node.type) {
    case AST_NODE_TYPES.ExportNamedDeclaration:
      return 'named'
    case AST_NODE_TYPES.ExportAllDeclaration:
      return 'wildcard'
    /* v8 ignore next 2 -- @preserve Exhaustive guard. */
    default:
      throw new UnreachableCaseError(node)
  }
}

function computeLineCountModifier(
  node: TSESTree.ExportNamedDeclaration | TSESTree.ExportAllDeclaration,
): 'singleline' | 'multiline' {
  if (isNodeOnSingleLine(node)) {
    return 'singleline'
  }
  return 'multiline'
}
