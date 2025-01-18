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
  specialCharactersJsonSchema,
  newlinesBetweenJsonSchema,
  ignoreCaseJsonSchema,
  buildTypeJsonSchema,
  alphabetJsonSchema,
  localesJsonSchema,
  groupsJsonSchema,
  orderJsonSchema,
} from '../utils/common-json-schemas'
import { validateNewlinesAndPartitionConfiguration } from '../utils/validate-newlines-and-partition-configuration'
import { validateGeneratedGroupsConfiguration } from '../utils/validate-generated-groups-configuration'
import { validateCustomSortConfiguration } from '../utils/validate-custom-sort-configuration'
import {
  singleCustomGroupJsonSchema,
  allSelectors,
} from './sort-array-includes/types'
import { getCustomGroupsCompareOptions } from '../utils/get-custom-groups-compare-options'
import { doesCustomGroupMatch } from './sort-array-includes/does-custom-group-match'
import { getMatchingContextOptions } from '../utils/get-matching-context-options'
import { generatePredefinedGroups } from '../utils/generate-predefined-groups'
import { getEslintDisabledLines } from '../utils/get-eslint-disabled-lines'
import { isNodeEslintDisabled } from '../utils/is-node-eslint-disabled'
import { hasPartitionComment } from '../utils/has-partition-comment'
import { createNodeIndexMap } from '../utils/create-node-index-map'
import { sortNodesByGroups } from '../utils/sort-nodes-by-groups'
import { getCommentsBefore } from '../utils/get-comments-before'
import { getNewlinesErrors } from '../utils/get-newlines-errors'
import { createEslintRule } from '../utils/create-eslint-rule'
import { getLinesBetween } from '../utils/get-lines-between'
import { getGroupNumber } from '../utils/get-group-number'
import { getSourceCode } from '../utils/get-source-code'
import { toSingleLine } from '../utils/to-single-line'
import { rangeToDiff } from '../utils/range-to-diff'
import { getSettings } from '../utils/get-settings'
import { isSortable } from '../utils/is-sortable'
import { makeFixes } from '../utils/make-fixes'
import { useGroups } from '../utils/use-groups'
import { complete } from '../utils/complete'
import { pairwise } from '../utils/pairwise'

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
      groupKind: {
        enum: ['mixed', 'literals-first', 'spreads-first'],
        description: 'Specifies top-level groups.',
        type: 'string',
      },
      customGroups: buildCustomGroupsArrayJsonSchema({
        singleCustomGroupJsonSchema,
      }),
      useConfigurationIf: buildUseConfigurationIfJsonSchema(),
      type: buildTypeJsonSchema({ withUnsorted: true }),
      partitionByComment: partitionByCommentJsonSchema,
      partitionByNewLine: partitionByNewLineJsonSchema,
      specialCharacters: specialCharactersJsonSchema,
      newlinesBetween: newlinesBetweenJsonSchema,
      ignoreCase: ignoreCaseJsonSchema,
      alphabet: alphabetJsonSchema,
      locales: localesJsonSchema,
      groups: groupsJsonSchema,
      order: orderJsonSchema,
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
      unexpectedArrayIncludesGroupOrder:
        'Expected "{{right}}" ({{rightGroup}}) to come before "{{left}}" ({{leftGroup}}).',
      missedSpacingBetweenArrayIncludesMembers:
        'Missed spacing between "{{left}}" and "{{right}}" members.',
      extraSpacingBetweenArrayIncludesMembers:
        'Extra spacing between "{{left}}" and "{{right}}" members.',
      unexpectedArrayIncludesOrder:
        'Expected "{{right}}" to come before "{{left}}".',
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

  let sourceCode = getSourceCode(context)
  let settings = getSettings(context.settings)

  let matchedContextOptions = getMatchingContextOptions({
    nodeNames: elements
      .filter(element => element !== null)
      .map(element => getNodeName({ sourceCode, element })),
    contextOptions: context.options,
  })

  let completeOptions = complete(
    matchedContextOptions[0],
    settings,
    defaultOptions,
  )
  let { type } = completeOptions
  if (type === 'unsorted') {
    return
  }
  let options = {
    ...completeOptions,
    type,
  }
  validateCustomSortConfiguration(options)
  validateGeneratedGroupsConfiguration({
    customGroups: options.customGroups,
    selectors: allSelectors,
    groups: options.groups,
    modifiers: [],
  })
  validateNewlinesAndPartitionConfiguration(options)

  let eslintDisabledLines = getEslintDisabledLines({
    ruleName: context.id,
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
        hasPartitionComment({
          comments: getCommentsBefore({
            node: element,
            sourceCode,
          }),
          partitionByComment: options.partitionByComment,
        }) ||
        (options.partitionByNewLine &&
          lastSortingNode &&
          getLinesBetween(sourceCode, lastSortingNode, sortingNode))
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

    let sortNodesIgnoringEslintDisabledNodes = (
      ignoreEslintDisabledNodes: boolean,
    ): SortArrayIncludesSortingNode[] =>
      filteredGroupKindNodes.flatMap(groupedNodes =>
        sortNodesByGroups(groupedNodes, options, {
          getGroupCompareOptions: groupNumber =>
            getCustomGroupsCompareOptions(options, groupNumber),
          ignoreEslintDisabledNodes,
        }),
      )

    let sortedNodes = sortNodesIgnoringEslintDisabledNodes(false)
    let sortedNodesExcludingEslintDisabled =
      sortNodesIgnoringEslintDisabledNodes(true)

    let nodeIndexMap = createNodeIndexMap(sortedNodes)

    pairwise(nodes, (left, right) => {
      let leftIndex = nodeIndexMap.get(left)!
      let rightIndex = nodeIndexMap.get(right)!

      let leftNumber = getGroupNumber(options.groups, left)
      let rightNumber = getGroupNumber(options.groups, right)

      let indexOfRightExcludingEslintDisabled =
        sortedNodesExcludingEslintDisabled.indexOf(right)

      let messageIds: MessageIds[] = []

      if (
        leftIndex > rightIndex ||
        leftIndex >= indexOfRightExcludingEslintDisabled
      ) {
        messageIds.push(
          leftNumber === rightNumber
            ? availableMessageIds.unexpectedOrder
            : availableMessageIds.unexpectedGroupOrder,
        )
      }

      messageIds = [
        ...messageIds,
        ...getNewlinesErrors({
          missedSpacingError: availableMessageIds.missedSpacingBetweenMembers,
          extraSpacingError: availableMessageIds.extraSpacingBetweenMembers,
          rightNum: rightNumber,
          leftNum: leftNumber,
          sourceCode,
          options,
          right,
          left,
        }),
      ]

      for (let messageId of messageIds) {
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
            right: toSingleLine(right.name),
            left: toSingleLine(left.name),
            rightGroup: right.group,
            leftGroup: left.group,
          },
          node: right.node,
          messageId,
        })
      }
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
