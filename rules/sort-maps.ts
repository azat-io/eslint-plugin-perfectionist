import type { TSESTree } from '@typescript-eslint/types'

import type { SortingNode } from '../types/sorting-node'
import type { Options } from './sort-maps/types'

import {
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
import { validateGeneratedGroupsConfiguration } from '../utils/validate-generated-groups-configuration'
import { validateCustomSortConfiguration } from '../utils/validate-custom-sort-configuration'
import { getCustomGroupsCompareOptions } from '../utils/get-custom-groups-compare-options'
import { getEslintDisabledLines } from '../utils/get-eslint-disabled-lines'
import { doesCustomGroupMatch } from './sort-maps/does-custom-group-match'
import { isNodeEslintDisabled } from '../utils/is-node-eslint-disabled'
import { hasPartitionComment } from '../utils/has-partition-comment'
import { createNodeIndexMap } from '../utils/create-node-index-map'
import { sortNodesByGroups } from '../utils/sort-nodes-by-groups'
import { getCommentsBefore } from '../utils/get-comments-before'
import { getNewlinesErrors } from '../utils/get-newlines-errors'
import { singleCustomGroupJsonSchema } from './sort-maps/types'
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

type MESSAGE_ID =
  | 'missedSpacingBetweenMapElementsMembers'
  | 'extraSpacingBetweenMapElementsMembers'
  | 'unexpectedMapElementsGroupOrder'
  | 'unexpectedMapElementsOrder'

let defaultOptions: Required<Options[0]> = {
  specialCharacters: 'keep',
  partitionByComment: false,
  partitionByNewLine: false,
  newlinesBetween: 'ignore',
  type: 'alphabetical',
  ignoreCase: true,
  customGroups: [],
  locales: 'en-US',
  alphabet: '',
  order: 'asc',
  groups: [],
}

export default createEslintRule<Options, MESSAGE_ID>({
  create: context => ({
    NewExpression: node => {
      if (
        node.callee.type !== 'Identifier' ||
        node.callee.name !== 'Map' ||
        !node.arguments.length ||
        node.arguments[0]?.type !== 'ArrayExpression'
      ) {
        return
      }
      let [{ elements }] = node.arguments
      if (!isSortable(elements)) {
        return
      }

      let settings = getSettings(context.settings)
      let options = complete(context.options.at(0), settings, defaultOptions)
      validateCustomSortConfiguration(options)
      validateGeneratedGroupsConfiguration({
        customGroups: options.customGroups,
        groups: options.groups,
        selectors: [],
        modifiers: [],
      })

      let sourceCode = getSourceCode(context)
      let eslintDisabledLines = getEslintDisabledLines({
        ruleName: context.id,
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
          let name: string

          if (element.type === 'ArrayExpression') {
            let [left] = element.elements

            if (!left) {
              name = `${left}`
            } else if (left.type === 'Literal') {
              name = left.raw
            } else {
              name = sourceCode.getText(left)
            }
          } else {
            name = sourceCode.getText(element)
          }

          let lastSortingNode = formattedMembers.at(-1)?.at(-1)

          let { defineGroup, getGroup } = useGroups(options)
          for (let customGroup of options.customGroups) {
            if (
              doesCustomGroupMatch({
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

          let sortingNode: SortingNode = {
            isEslintDisabled: isNodeEslintDisabled(
              element,
              eslintDisabledLines,
            ),
            size: rangeToDiff(element, sourceCode),
            group: getGroup(),
            node: element,
            name,
          }

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
            formattedMembers.push([])
          }

          formattedMembers.at(-1)!.push(sortingNode)
        }

        for (let nodes of formattedMembers) {
          let sortNodesExcludingEslintDisabled = (
            ignoreEslintDisabledNodes: boolean,
          ): SortingNode[] =>
            sortNodesByGroups(nodes, options, {
              getGroupCompareOptions: groupNumber =>
                getCustomGroupsCompareOptions(options, groupNumber),
              ignoreEslintDisabledNodes,
            })
          let sortedNodes = sortNodesExcludingEslintDisabled(false)
          let sortedNodesExcludingEslintDisabled =
            sortNodesExcludingEslintDisabled(true)

          let nodeIndexMap = createNodeIndexMap(sortedNodes)

          pairwise(nodes, (left, right) => {
            let leftIndex = nodeIndexMap.get(left)!
            let rightIndex = nodeIndexMap.get(right)!

            let leftNumber = getGroupNumber(options.groups, left)
            let rightNumber = getGroupNumber(options.groups, right)

            let indexOfRightExcludingEslintDisabled =
              sortedNodesExcludingEslintDisabled.indexOf(right)

            let messageIds: MESSAGE_ID[] = []

            if (
              leftIndex > rightIndex ||
              leftIndex >= indexOfRightExcludingEslintDisabled
            ) {
              messageIds.push(
                leftNumber === rightNumber
                  ? 'unexpectedMapElementsOrder'
                  : 'unexpectedMapElementsGroupOrder',
              )
            }

            messageIds = [
              ...messageIds,
              ...getNewlinesErrors({
                missedSpacingError: 'missedSpacingBetweenMapElementsMembers',
                extraSpacingError: 'extraSpacingBetweenMapElementsMembers',
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
    },
  }),
  meta: {
    schema: [
      {
        properties: {
          partitionByComment: {
            ...partitionByCommentJsonSchema,
            description:
              'Allows you to use comments to separate the maps members into logical groups.',
          },
          customGroups: buildCustomGroupsArrayJsonSchema({
            singleCustomGroupJsonSchema,
          }),
          partitionByNewLine: partitionByNewLineJsonSchema,
          specialCharacters: specialCharactersJsonSchema,
          newlinesBetween: newlinesBetweenJsonSchema,
          ignoreCase: ignoreCaseJsonSchema,
          alphabet: alphabetJsonSchema,
          type: buildTypeJsonSchema(),
          locales: localesJsonSchema,
          groups: groupsJsonSchema,
          order: orderJsonSchema,
        },
        additionalProperties: false,
        type: 'object',
      },
    ],
    messages: {
      unexpectedMapElementsGroupOrder:
        'Expected "{{right}}" ({{rightGroup}}) to come before "{{left}}" ({{leftGroup}}).',
      missedSpacingBetweenMapElementsMembers:
        'Missed spacing between "{{left}}" and "{{right}}" members.',
      extraSpacingBetweenMapElementsMembers:
        'Extra spacing between "{{left}}" and "{{right}}" members.',
      unexpectedMapElementsOrder:
        'Expected "{{right}}" to come before "{{left}}".',
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
