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
import { rangeToDiff } from '../utils/range-to-diff'
import { getSettings } from '../utils/get-settings'
import { isSortable } from '../utils/is-sortable'
import { useGroups } from '../utils/use-groups'
import { complete } from '../utils/complete'

/**
 * Cache computed groups by modifiers and selectors for performance
 */
let cachedGroupsByModifiersAndSelectors = new Map<string, string[]>()

type MESSAGE_ID =
  | 'missedSpacingBetweenArrayIncludesMembers'
  | 'extraSpacingBetweenArrayIncludesMembers'
  | 'unexpectedArrayIncludesGroupOrder'
  | 'unexpectedArrayIncludesOrder'

interface SortArrayIncludesSortingNode
  extends SortingNode<TSESTree.SpreadElement | TSESTree.Expression> {
  groupKind: 'literal' | 'spread'
}

export let defaultOptions: Required<Options[0]> = {
  fallbackSort: { type: 'unsorted' },
  groupKind: 'literals-first',
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
      groupKind: {
        description: '[DEPRECATED] Specifies top-level groups.',
        enum: ['mixed', 'literals-first', 'spreads-first'],
        type: 'string',
      },
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

export default createEslintRule<Options, MESSAGE_ID>({
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
        sortArray<MESSAGE_ID>({
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

export let sortArray = <MessageIds extends string>({
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
}): void => {
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

      let { defineGroup, getGroup } = useGroups(options)
      let groupKind: 'literal' | 'spread'
      let selector: Selector
      if (element.type === 'SpreadElement') {
        groupKind = 'spread'
        selector = 'spread'
      } else {
        groupKind = 'literal'
        selector = 'literal'
      }

      let predefinedGroups = generatePredefinedGroups({
        cache: cachedGroupsByModifiersAndSelectors,
        selectors: [selector],
        modifiers: [],
      })

      for (let predefinedGroup of predefinedGroups) {
        defineGroup(predefinedGroup)
      }

      let name = getNodeName({ sourceCode, element })
      for (let customGroup of options.customGroups) {
        if (
          doesCustomGroupMatch({
            selectors: [selector],
            elementName: name,
            modifiers: [],
            customGroup,
          })
        ) {
          defineGroup(customGroup.groupName, true)
          /**
           * If the custom group is not referenced in the `groups` option, it
           * will be ignored
           */
          if (getGroup() === customGroup.groupName) {
            break
          }
        }
      }

      let sortingNode: SortArrayIncludesSortingNode = {
        isEslintDisabled: isNodeEslintDisabled(element, eslintDisabledLines),
        size: rangeToDiff(element, sourceCode),
        group: getGroup(),
        node: element,
        groupKind,
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

      accumulator.at(-1)!.push(sortingNode)

      return accumulator
    },
    [[]],
  )

  let groupKindOrder
  if (options.groupKind === 'literals-first') {
    groupKindOrder = ['literal', 'spread'] as const
  } else if (options.groupKind === 'spreads-first') {
    groupKindOrder = ['spread', 'literal'] as const
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
    ): SortArrayIncludesSortingNode[] =>
      filteredGroupKindNodes.flatMap(groupedNodes =>
        sortNodesByGroups({
          getOptionsByGroupNumber:
            buildGetCustomGroupOverriddenOptionsFunction(options),
          ignoreEslintDisabledNodes,
          groups: options.groups,
          nodes: groupedNodes,
        }),
      )

    reportAllErrors<MessageIds>({
      sortNodesExcludingEslintDisabled,
      availableMessageIds,
      sourceCode,
      options,
      context,
      nodes,
    })
  }
}

let getNodeName = ({
  sourceCode,
  element,
}: {
  element: TSESTree.SpreadElement | TSESTree.Expression
  sourceCode: TSESLint.SourceCode
}): string =>
  element.type === 'Literal' ? `${element.value}` : sourceCode.getText(element)
