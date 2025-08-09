import type { TSESLint } from '@typescript-eslint/utils'
import type { TSESTree } from '@typescript-eslint/types'

import type { SortingNode } from '../types/sorting-node'
import type { Options } from './sort-maps/types'

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
import { buildGetCustomGroupOverriddenOptionsFunction } from '../utils/get-custom-groups-compare-options'
import { validateGeneratedGroupsConfiguration } from '../utils/validate-generated-groups-configuration'
import { validateCustomSortConfiguration } from '../utils/validate-custom-sort-configuration'
import { getMatchingContextOptions } from '../utils/get-matching-context-options'
import { getEslintDisabledLines } from '../utils/get-eslint-disabled-lines'
import { isNodeEslintDisabled } from '../utils/is-node-eslint-disabled'
import { doesCustomGroupMatch } from '../utils/does-custom-group-match'
import { sortNodesByGroups } from '../utils/sort-nodes-by-groups'
import { singleCustomGroupJsonSchema } from './sort-maps/types'
import { createEslintRule } from '../utils/create-eslint-rule'
import { reportAllErrors } from '../utils/report-all-errors'
import { shouldPartition } from '../utils/should-partition'
import { computeGroup } from '../utils/compute-group'
import { rangeToDiff } from '../utils/range-to-diff'
import { getSettings } from '../utils/get-settings'
import { isSortable } from '../utils/is-sortable'
import { complete } from '../utils/complete'

type MessageId =
  | 'missedSpacingBetweenMapElementsMembers'
  | 'extraSpacingBetweenMapElementsMembers'
  | 'unexpectedMapElementsGroupOrder'
  | 'unexpectedMapElementsOrder'

let defaultOptions: Required<Options[0]> = {
  fallbackSort: { type: 'unsorted' },
  specialCharacters: 'keep',
  partitionByComment: false,
  partitionByNewLine: false,
  newlinesBetween: 'ignore',
  useConfigurationIf: {},
  type: 'alphabetical',
  ignoreCase: true,
  customGroups: [],
  locales: 'en-US',
  alphabet: '',
  order: 'asc',
  groups: [],
}

export default createEslintRule<Options, MessageId>({
  create: context => ({
    NewExpression: node => {
      if (
        node.callee.type !== 'Identifier' ||
        node.callee.name !== 'Map' ||
        node.arguments.length === 0 ||
        node.arguments[0]?.type !== 'ArrayExpression'
      ) {
        return
      }
      let [{ elements }] = node.arguments
      if (!isSortable(elements)) {
        return
      }

      let { sourceCode, id } = context
      let settings = getSettings(context.settings)

      let matchedContextOptions = getMatchingContextOptions({
        nodeNames: elements
          .filter(
            element => element !== null && element.type !== 'SpreadElement',
          )
          .map(element => getNodeName({ sourceCode, element })),
        contextOptions: context.options,
      })

      let options = complete(matchedContextOptions[0], settings, defaultOptions)
      validateCustomSortConfiguration(options)
      validateGeneratedGroupsConfiguration({
        selectors: [],
        modifiers: [],
        options,
      })

      let eslintDisabledLines = getEslintDisabledLines({
        ruleName: id,
        sourceCode,
      })

      let parts: TSESTree.Expression[][] = elements.reduce(
        (
          accumulator: TSESTree.Expression[][],
          element: TSESTree.SpreadElement | TSESTree.Expression | null,
        ) => {
          if (element === null || element.type === 'SpreadElement') {
            accumulator.push([])
          } else {
            accumulator.at(-1)!.push(element)
          }
          return accumulator
        },
        [[]],
      )
      for (let part of parts) {
        let formattedMembers: SortingNode[][] = [[]]
        for (let element of part) {
          let name: string = getNodeName({
            sourceCode,
            element,
          })

          let lastSortingNode = formattedMembers.at(-1)?.at(-1)

          let group = computeGroup({
            customGroupMatcher: customGroup =>
              doesCustomGroupMatch({
                elementName: name,
                selectors: [],
                modifiers: [],
                customGroup,
              }),
            predefinedGroups: [],
            options,
          })

          let sortingNode: Omit<SortingNode, 'partitionId'> = {
            isEslintDisabled: isNodeEslintDisabled(
              element,
              eslintDisabledLines,
            ),
            size: rangeToDiff(element, sourceCode),
            node: element,
            group,
            name,
          }

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

        for (let nodes of formattedMembers) {
          function createSortNodesExcludingEslintDisabled(
            sortingNodes: SortingNode[],
          ) {
            return function (
              ignoreEslintDisabledNodes: boolean,
            ): SortingNode[] {
              return sortNodesByGroups({
                getOptionsByGroupIndex:
                  buildGetCustomGroupOverriddenOptionsFunction(options),
                ignoreEslintDisabledNodes,
                groups: options.groups,
                nodes: sortingNodes,
              })
            }
          }

          reportAllErrors<MessageId>({
            availableMessageIds: {
              missedSpacingBetweenMembers:
                'missedSpacingBetweenMapElementsMembers',
              extraSpacingBetweenMembers:
                'extraSpacingBetweenMapElementsMembers',
              unexpectedGroupOrder: 'unexpectedMapElementsGroupOrder',
              unexpectedOrder: 'unexpectedMapElementsOrder',
            },
            sortNodesExcludingEslintDisabled:
              createSortNodesExcludingEslintDisabled(nodes),
            sourceCode,
            options,
            context,
            nodes,
          })
        }
      }
    },
  }),
  meta: {
    schema: {
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
    },
    messages: {
      missedSpacingBetweenMapElementsMembers: MISSED_SPACING_ERROR,
      extraSpacingBetweenMapElementsMembers: EXTRA_SPACING_ERROR,
      unexpectedMapElementsGroupOrder: GROUP_ORDER_ERROR,
      unexpectedMapElementsOrder: ORDER_ERROR,
    },
    docs: {
      url: 'https://perfectionist.dev/rules/sort-maps',
      description: 'Enforce sorted Map elements.',
      recommended: true,
    },
    type: 'suggestion',
    fixable: 'code',
  },
  defaultOptions: [defaultOptions],
  name: 'sort-maps',
})

function getNodeName({
  sourceCode,
  element,
}: {
  sourceCode: TSESLint.SourceCode
  element: TSESTree.Expression
}): string {
  if (element.type === 'ArrayExpression') {
    let [left] = element.elements

    if (!left) {
      return `${left}`
    } else if (left.type === 'Literal') {
      return left.raw
    }
    return sourceCode.getText(left)
  }
  return sourceCode.getText(element)
}
