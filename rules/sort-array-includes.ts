import type { JSONSchema4 } from '@typescript-eslint/utils/json-schema'
import type { RuleContext } from '@typescript-eslint/utils/ts-eslint'
import type { TSESTree } from '@typescript-eslint/types'
import type { TSESLint } from '@typescript-eslint/utils'

import { AST_NODE_TYPES } from '@typescript-eslint/utils'

import type { Selector, Options } from './sort-array-includes/types'
import type { SortingNode } from '../types/sorting-node'

import {
  partitionByCommentJsonSchema,
  partitionByNewLineJsonSchema,
} from '../utils/json-schemas/common-partition-json-schemas'
import {
  MISSED_SPACING_ERROR,
  EXTRA_SPACING_ERROR,
  GROUP_ORDER_ERROR,
  ORDER_ERROR,
} from '../utils/report-errors'
import {
  buildUseConfigurationIfJsonSchema,
  buildCommonJsonSchemas,
} from '../utils/json-schemas/common-json-schemas'
import { validateNewlinesAndPartitionConfiguration } from '../utils/validate-newlines-and-partition-configuration'
import { buildDefaultOptionsByGroupIndexComputer } from '../utils/build-default-options-by-group-index-computer'
import { defaultComparatorByOptionsComputer } from '../utils/compare/default-comparator-by-options-computer'
import {
  additionalCustomGroupMatchOptionsJsonSchema,
  allSelectors,
} from './sort-array-includes/types'
import { buildCommonGroupsJsonSchemas } from '../utils/json-schemas/common-groups-json-schemas'
import { validateCustomSortConfiguration } from '../utils/validate-custom-sort-configuration'
import { filterOptionsByAllNamesMatch } from '../utils/filter-options-by-all-names-match'
import { validateGroupsConfiguration } from '../utils/validate-groups-configuration'
import { generatePredefinedGroups } from '../utils/generate-predefined-groups'
import { getEslintDisabledLines } from '../utils/get-eslint-disabled-lines'
import { doesCustomGroupMatch } from '../utils/does-custom-group-match'
import { isNodeEslintDisabled } from '../utils/is-node-eslint-disabled'
import { sortNodesByGroups } from '../utils/sort-nodes-by-groups'
import { createEslintRule } from '../utils/create-eslint-rule'
import { reportAllErrors } from '../utils/report-all-errors'
import { shouldPartition } from '../utils/should-partition'
import { computeGroup } from '../utils/compute-group'
import { rangeToDiff } from '../utils/range-to-diff'
import { getSettings } from '../utils/get-settings'
import { isSortable } from '../utils/is-sortable'
import { complete } from '../utils/complete'

/** Cache computed groups by modifiers and selectors for performance. */
let cachedGroupsByModifiersAndSelectors = new Map<string, string[]>()

const ORDER_ERROR_ID = 'unexpectedArrayIncludesOrder'
const GROUP_ORDER_ERROR_ID = 'unexpectedArrayIncludesGroupOrder'
const EXTRA_SPACING_ERROR_ID = 'extraSpacingBetweenArrayIncludesMembers'
const MISSED_SPACING_ERROR_ID = 'missedSpacingBetweenArrayIncludesMembers'

type MessageId =
  | typeof MISSED_SPACING_ERROR_ID
  | typeof EXTRA_SPACING_ERROR_ID
  | typeof GROUP_ORDER_ERROR_ID
  | typeof ORDER_ERROR_ID

type SortArrayIncludesSortingNode = SortingNode<
  TSESTree.SpreadElement | TSESTree.Expression
>

export let defaultOptions: Required<Options[number]> = {
  fallbackSort: { type: 'unsorted' },
  newlinesInside: 'newlinesBetween',
  newlinesBetween: 'ignore',
  partitionByComment: false,
  partitionByNewLine: false,
  specialCharacters: 'keep',
  useConfigurationIf: {},
  type: 'alphabetical',
  groups: ['literal'],
  customGroups: [],
  ignoreCase: true,
  locales: 'en-US',
  alphabet: '',
  order: 'asc',
}

export let jsonSchema: JSONSchema4 = {
  items: {
    properties: {
      ...buildCommonJsonSchemas(),
      ...buildCommonGroupsJsonSchemas({
        additionalCustomGroupMatchProperties:
          additionalCustomGroupMatchOptionsJsonSchema,
      }),
      useConfigurationIf: buildUseConfigurationIfJsonSchema(),
      partitionByComment: partitionByCommentJsonSchema,
      partitionByNewLine: partitionByNewLineJsonSchema,
    },
    additionalProperties: false,
    type: 'object',
  },
  uniqueItems: true,
  type: 'array',
}

export default createEslintRule<Options, MessageId>({
  create: context => ({
    MemberExpression: node => {
      if (
        (node.object.type === AST_NODE_TYPES.ArrayExpression ||
          node.object.type === AST_NODE_TYPES.NewExpression) &&
        node.property.type === AST_NODE_TYPES.Identifier &&
        node.property.name === 'includes'
      ) {
        let elements =
          node.object.type === AST_NODE_TYPES.ArrayExpression
            ? node.object.elements
            : node.object.arguments
        sortArray<MessageId>({
          availableMessageIds: {
            missedSpacingBetweenMembers: MISSED_SPACING_ERROR_ID,
            extraSpacingBetweenMembers: EXTRA_SPACING_ERROR_ID,
            unexpectedGroupOrder: GROUP_ORDER_ERROR_ID,
            unexpectedOrder: ORDER_ERROR_ID,
          },
          elements,
          context,
        })
      }
    },
  }),
  meta: {
    messages: {
      [MISSED_SPACING_ERROR_ID]: MISSED_SPACING_ERROR,
      [EXTRA_SPACING_ERROR_ID]: EXTRA_SPACING_ERROR,
      [GROUP_ORDER_ERROR_ID]: GROUP_ORDER_ERROR,
      [ORDER_ERROR_ID]: ORDER_ERROR,
    },
    docs: {
      description: 'Enforce sorted arrays before include method.',
      url: 'https://perfectionist.dev/rules/sort-array-includes',
      recommended: true,
    },
    schema: jsonSchema,
    type: 'suggestion',
    fixable: 'code',
  },
  defaultOptions: [defaultOptions],
  name: 'sort-array-includes',
})

export function sortArray<MessageIds extends string>({
  availableMessageIds,
  elements,
  context,
}: {
  availableMessageIds: {
    missedSpacingBetweenMembers: MessageIds
    extraSpacingBetweenMembers: MessageIds
    unexpectedGroupOrder: MessageIds
    unexpectedOrder: MessageIds
  }
  elements: (TSESTree.SpreadElement | TSESTree.Expression | null)[]
  context: Readonly<RuleContext<MessageIds, Options>>
}): void {
  if (!isSortable(elements)) {
    return
  }

  let { sourceCode, id } = context
  let settings = getSettings(context.settings)

  let matchedContextOptions = filterOptionsByAllNamesMatch({
    nodeNames: elements
      .filter(element => element !== null)
      .map(element => getNodeName({ sourceCode, element })),
    contextOptions: context.options,
  })

  let options = complete(matchedContextOptions[0], settings, defaultOptions)
  validateCustomSortConfiguration(options)
  validateGroupsConfiguration({
    selectors: allSelectors,
    modifiers: [],
    options,
  })
  validateNewlinesAndPartitionConfiguration(options)

  let eslintDisabledLines = getEslintDisabledLines({
    ruleName: id,
    sourceCode,
  })

  let formattedMembers: SortArrayIncludesSortingNode[][] = elements.reduce(
    (
      accumulator: SortArrayIncludesSortingNode[][],
      element: TSESTree.SpreadElement | TSESTree.Expression | null,
    ) => {
      if (element === null) {
        return accumulator
      }

      let name = getNodeName({ sourceCode, element })
      let selector: Selector =
        element.type === AST_NODE_TYPES.SpreadElement ? 'spread' : 'literal'
      let predefinedGroups = generatePredefinedGroups({
        cache: cachedGroupsByModifiersAndSelectors,
        selectors: [selector],
        modifiers: [],
      })
      let group = computeGroup({
        customGroupMatcher: customGroup =>
          doesCustomGroupMatch({
            selectors: [selector],
            elementName: name,
            modifiers: [],
            customGroup,
          }),
        predefinedGroups,
        options,
      })

      let sortingNode: Omit<SortArrayIncludesSortingNode, 'partitionId'> = {
        isEslintDisabled: isNodeEslintDisabled(element, eslintDisabledLines),
        size: rangeToDiff(element, sourceCode),
        node: element,
        group,
        name,
      }

      let lastSortingNode = accumulator.at(-1)?.at(-1)
      if (
        shouldPartition({
          lastSortingNode,
          sortingNode,
          sourceCode,
          options,
        })
      ) {
        accumulator.push([])
      }

      accumulator.at(-1)!.push({
        ...sortingNode,
        partitionId: accumulator.length,
      })

      return accumulator
    },
    [[]],
  )

  function sortNodesExcludingEslintDisabled(
    ignoreEslintDisabledNodes: boolean,
  ): SortArrayIncludesSortingNode[] {
    return formattedMembers.flatMap(nodes =>
      sortNodesByGroups({
        optionsByGroupIndexComputer:
          buildDefaultOptionsByGroupIndexComputer(options),
        comparatorByOptionsComputer: defaultComparatorByOptionsComputer,
        ignoreEslintDisabledNodes,
        groups: options.groups,
        nodes,
      }),
    )
  }

  let nodes = formattedMembers.flat()
  reportAllErrors<MessageIds>({
    sortNodesExcludingEslintDisabled,
    availableMessageIds,
    context,
    options,
    nodes,
  })
}

function getNodeName({
  sourceCode,
  element,
}: {
  element: TSESTree.SpreadElement | TSESTree.Expression
  sourceCode: TSESLint.SourceCode
}): string {
  return element.type === AST_NODE_TYPES.Literal
    ? `${element.value}`
    : sourceCode.getText(element)
}
