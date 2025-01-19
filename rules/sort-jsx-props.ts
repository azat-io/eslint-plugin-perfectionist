import type { TSESTree } from '@typescript-eslint/types'

import type { CommonOptions, GroupOptions } from '../types/common-options'
import type { SortingNode } from '../types/sorting-node'

import {
  partitionByNewLineJsonSchema,
  newlinesBetweenJsonSchema,
  customGroupsJsonSchema,
  buildTypeJsonSchema,
  commonJsonSchemas,
  groupsJsonSchema,
} from '../utils/common-json-schemas'
import { validateNewlinesAndPartitionConfiguration } from '../utils/validate-newlines-and-partition-configuration'
import { validateCustomSortConfiguration } from '../utils/validate-custom-sort-configuration'
import { validateGroupsConfiguration } from '../utils/validate-groups-configuration'
import { getEslintDisabledLines } from '../utils/get-eslint-disabled-lines'
import { isNodeEslintDisabled } from '../utils/is-node-eslint-disabled'
import { createNodeIndexMap } from '../utils/create-node-index-map'
import { sortNodesByGroups } from '../utils/sort-nodes-by-groups'
import { getNewlinesErrors } from '../utils/get-newlines-errors'
import { createEslintRule } from '../utils/create-eslint-rule'
import { getLinesBetween } from '../utils/get-lines-between'
import { getGroupNumber } from '../utils/get-group-number'
import { getSourceCode } from '../utils/get-source-code'
import { rangeToDiff } from '../utils/range-to-diff'
import { getSettings } from '../utils/get-settings'
import { isSortable } from '../utils/is-sortable'
import { makeFixes } from '../utils/make-fixes'
import { useGroups } from '../utils/use-groups'
import { pairwise } from '../utils/pairwise'
import { complete } from '../utils/complete'
import { matches } from '../utils/matches'

type Options<T extends string = string> = [
  Partial<
    {
      type: 'alphabetical' | 'line-length' | 'natural' | 'custom'
      newlinesBetween: 'ignore' | 'always' | 'never'
      customGroups: Record<T, string[] | string>
      groups: GroupOptions<Group<T>>
      partitionByNewLine: boolean
      ignorePattern: string[]
    } & CommonOptions
  >,
]

type MESSAGE_ID =
  | 'missedSpacingBetweenJSXPropsMembers'
  | 'extraSpacingBetweenJSXPropsMembers'
  | 'unexpectedJSXPropsGroupOrder'
  | 'unexpectedJSXPropsOrder'

type Group<T extends string> = 'multiline' | 'shorthand' | 'unknown' | T

let defaultOptions: Required<Options[0]> = {
  specialCharacters: 'keep',
  newlinesBetween: 'ignore',
  partitionByNewLine: false,
  type: 'alphabetical',
  ignorePattern: [],
  ignoreCase: true,
  customGroups: {},
  locales: 'en-US',
  alphabet: '',
  order: 'asc',
  groups: [],
}

export default createEslintRule<Options, MESSAGE_ID>({
  create: context => ({
    JSXElement: node => {
      if (!isSortable(node.openingElement.attributes)) {
        return
      }

      let settings = getSettings(context.settings)
      let options = complete(context.options.at(0), settings, defaultOptions)
      validateCustomSortConfiguration(options)
      validateGroupsConfiguration(
        options.groups,
        ['multiline', 'shorthand', 'unknown'],
        Object.keys(options.customGroups),
      )
      validateNewlinesAndPartitionConfiguration(options)

      let sourceCode = getSourceCode(context)

      let shouldIgnore = false
      if (options.ignorePattern.length) {
        let tagName = sourceCode.getText(node.openingElement.name)
        shouldIgnore = options.ignorePattern.some(pattern =>
          matches(tagName, pattern),
        )
      }
      if (shouldIgnore || !isSortable(node.openingElement.attributes)) {
        return
      }

      let eslintDisabledLines = getEslintDisabledLines({
        ruleName: context.id,
        sourceCode,
      })

      let formattedMembers: SortingNode[][] =
        node.openingElement.attributes.reduce(
          (
            accumulator: SortingNode[][],
            attribute: TSESTree.JSXSpreadAttribute | TSESTree.JSXAttribute,
          ) => {
            if (attribute.type === 'JSXSpreadAttribute') {
              accumulator.push([])
              return accumulator
            }

            let name =
              attribute.name.type === 'JSXNamespacedName'
                ? `${attribute.name.namespace.name}:${attribute.name.name.name}`
                : attribute.name.name

            let { setCustomGroups, defineGroup, getGroup } = useGroups(options)

            setCustomGroups(options.customGroups, name)

            if (attribute.value === null) {
              defineGroup('shorthand')
            } else if (attribute.loc.start.line !== attribute.loc.end.line) {
              defineGroup('multiline')
            }

            let sortingNode: SortingNode = {
              isEslintDisabled: isNodeEslintDisabled(
                attribute,
                eslintDisabledLines,
              ),
              size: rangeToDiff(attribute, sourceCode),
              group: getGroup(),
              node: attribute,
              name,
            }

            let lastSortingNode = accumulator.at(-1)?.at(-1)
            if (
              options.partitionByNewLine &&
              lastSortingNode &&
              getLinesBetween(sourceCode, lastSortingNode, sortingNode)
            ) {
              accumulator.push([])
            }

            accumulator.at(-1)!.push(sortingNode)

            return accumulator
          },
          [[]],
        )

      for (let nodes of formattedMembers) {
        let sortNodesExcludingEslintDisabled = (
          ignoreEslintDisabledNodes: boolean,
        ): SortingNode[] =>
          sortNodesByGroups(nodes, options, { ignoreEslintDisabledNodes })
        let sortedNodes = sortNodesExcludingEslintDisabled(false)
        let sortedNodesExcludingEslintDisabled =
          sortNodesExcludingEslintDisabled(true)

        let nodeIndexMap = createNodeIndexMap(sortedNodes)

        pairwise(nodes, (left, right) => {
          let leftIndex = nodeIndexMap.get(left)!
          let rightIndex = nodeIndexMap.get(right)!

          let indexOfRightExcludingEslintDisabled =
            sortedNodesExcludingEslintDisabled.indexOf(right)

          let leftNumber = getGroupNumber(options.groups, left)
          let rightNumber = getGroupNumber(options.groups, right)

          let messageIds: MESSAGE_ID[] = []

          if (
            leftIndex > rightIndex ||
            leftIndex >= indexOfRightExcludingEslintDisabled
          ) {
            messageIds.push(
              leftNumber === rightNumber
                ? 'unexpectedJSXPropsOrder'
                : 'unexpectedJSXPropsGroupOrder',
            )
          }

          messageIds = [
            ...messageIds,
            ...getNewlinesErrors({
              missedSpacingError: 'missedSpacingBetweenJSXPropsMembers',
              extraSpacingError: 'extraSpacingBetweenJSXPropsMembers',
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
                rightGroup: right.group,
                leftGroup: left.group,
                right: right.name,
                left: left.name,
              },
              node: right.node,
              messageId,
            })
          }
        })
      }
    },
  }),
  meta: {
    schema: [
      {
        properties: {
          ...commonJsonSchemas,
          ignorePattern: {
            description:
              'Specifies names or patterns for nodes that should be ignored by rule.',
            items: {
              type: 'string',
            },
            type: 'array',
          },
          partitionByNewLine: partitionByNewLineJsonSchema,
          newlinesBetween: newlinesBetweenJsonSchema,
          customGroups: customGroupsJsonSchema,
          type: buildTypeJsonSchema(),
          groups: groupsJsonSchema,
        },
        additionalProperties: false,
        type: 'object',
      },
    ],
    messages: {
      unexpectedJSXPropsGroupOrder:
        'Expected "{{right}}" ({{rightGroup}}) to come before "{{left}}" ({{leftGroup}}).',
      missedSpacingBetweenJSXPropsMembers:
        'Missed spacing between "{{left}}" and "{{right}}" props.',
      extraSpacingBetweenJSXPropsMembers:
        'Extra spacing between "{{left}}" and "{{right}}" props.',
      unexpectedJSXPropsOrder:
        'Expected "{{right}}" to come before "{{left}}".',
    },
    docs: {
      url: 'https://perfectionist.dev/rules/sort-jsx-props',
      description: 'Enforce sorted JSX props.',
      recommended: true,
    },
    type: 'suggestion',
    fixable: 'code',
  },
  defaultOptions: [defaultOptions],
  name: 'sort-jsx-props',
})
