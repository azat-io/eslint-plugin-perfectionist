import type { JSONSchema4 } from '@typescript-eslint/utils/json-schema'
import type { RuleContext } from '@typescript-eslint/utils/ts-eslint'
import type { TSESTree } from '@typescript-eslint/types'
import type { TSESLint } from '@typescript-eslint/utils'

import type { Selector, Options } from './sort-array-includes/types'
import type { SortingNode } from '../types/sorting-node'

import {
  buildUseConfigurationIfJsonSchema,
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
import { buildGetCustomGroupOverriddenOptionsFunction } from '../utils/get-custom-groups-compare-options'
import { validateGeneratedGroupsConfiguration } from '../utils/validate-generated-groups-configuration'
import { validateCustomSortConfiguration } from '../utils/validate-custom-sort-configuration'
import {
  singleCustomGroupJsonSchema,
  allSelectors,
} from './sort-array-includes/types'
import { getMatchingContextOptions } from '../utils/get-matching-context-options'
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

/** Cache computed groups by modifiers and selectors for performance. */
let cachedGroupsByModifiersAndSelectors = new Map<string, string[]>()

type MessageId =
  | 'missedSpacingBetweenArrayIncludesMembers'
  | 'extraSpacingBetweenArrayIncludesMembers'
  | 'unexpectedArrayIncludesGroupOrder'
  | 'unexpectedArrayIncludesOrder'

type SortArrayIncludesSortingNode = SortingNode<
  TSESTree.SpreadElement | TSESTree.Expression
>

export let defaultOptions: Required<Options[0]> = {
  fallbackSort: { type: 'unsorted' },
  specialCharacters: 'keep',
  partitionByComment: false,
  partitionByNewLine: false,
  newlinesBetween: 'ignore',
  useConfigurationIf: {},
  type: 'alphabetical',
  ignoreCase: true,
  locales: 'en-US',
  customGroups: [],
  alphabet: '',
  order: 'asc',
  groups: [],
}

export let jsonSchema: JSONSchema4 = {
  items: {
    properties: {
      ...commonJsonSchemas,
      customGroups: buildCustomGroupsArrayJsonSchema({
        singleCustomGroupJsonSchema,
      }),
      useConfigurationIf: buildUseConfigurationIfJsonSchema(),
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
}

export default createEslintRule<Options, MessageId>({
  create: context => ({
    MemberExpression: node => {
      if (
        (node.object.type === 'ArrayExpression' ||
          node.object.type === 'NewExpression') &&
        node.property.type === 'Identifier' &&
        node.property.name === 'includes'
      ) {
        let elements =
          node.object.type === 'ArrayExpression'
            ? node.object.elements
            : node.object.arguments
        sortArray<MessageId>({
          availableMessageIds: {
            missedSpacingBetweenMembers:
              'missedSpacingBetweenArrayIncludesMembers',
            extraSpacingBetweenMembers:
              'extraSpacingBetweenArrayIncludesMembers',
            unexpectedGroupOrder: 'unexpectedArrayIncludesGroupOrder',
            unexpectedOrder: 'unexpectedArrayIncludesOrder',
          },
          elements,
          context,
        })
      }
    },
  }),
  meta: {
    messages: {
      missedSpacingBetweenArrayIncludesMembers: MISSED_SPACING_ERROR,
      extraSpacingBetweenArrayIncludesMembers: EXTRA_SPACING_ERROR,
      unexpectedArrayIncludesGroupOrder: GROUP_ORDER_ERROR,
      unexpectedArrayIncludesOrder: ORDER_ERROR,
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

  let matchedContextOptions = getMatchingContextOptions({
    nodeNames: elements
      .filter(element => element !== null)
      .map(element => getNodeName({ sourceCode, element })),
    contextOptions: context.options,
  })

  let options = complete(matchedContextOptions[0], settings, defaultOptions)
  validateCustomSortConfiguration(options)
  validateGeneratedGroupsConfiguration({
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
        element.type === 'SpreadElement' ? 'spread' : 'literal'
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
        getOptionsByGroupIndex:
          buildGetCustomGroupOverriddenOptionsFunction(options),
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
    sourceCode,
    options,
    context,
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
  return element.type === 'Literal'
    ? `${element.value}`
    : sourceCode.getText(element)
}
