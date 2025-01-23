import type { TSESTree } from '@typescript-eslint/types'

import type { CommonOptions, GroupsOptions } from '../types/common-options'
import type { SortingNode } from '../types/sorting-node'

import {
  partitionByNewLineJsonSchema,
  newlinesBetweenJsonSchema,
  customGroupsJsonSchema,
  buildTypeJsonSchema,
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
import { validateCustomSortConfiguration } from '../utils/validate-custom-sort-configuration'
import { validateGroupsConfiguration } from '../utils/validate-groups-configuration'
import { getEslintDisabledLines } from '../utils/get-eslint-disabled-lines'
import { isNodeEslintDisabled } from '../utils/is-node-eslint-disabled'
import { sortNodesByGroups } from '../utils/sort-nodes-by-groups'
import { createEslintRule } from '../utils/create-eslint-rule'
import { reportAllErrors } from '../utils/report-all-errors'
import { shouldPartition } from '../utils/should-partition'
import { getSourceCode } from '../utils/get-source-code'
import { rangeToDiff } from '../utils/range-to-diff'
import { getSettings } from '../utils/get-settings'
import { isSortable } from '../utils/is-sortable'
import { useGroups } from '../utils/use-groups'
import { complete } from '../utils/complete'
import { matches } from '../utils/matches'

type Options<T extends string = string> = [
  Partial<
    {
      type: 'alphabetical' | 'line-length' | 'natural' | 'custom'
      newlinesBetween: 'ignore' | 'always' | 'never'
      customGroups: Record<T, string[] | string>
      groups: GroupsOptions<Group<T>>
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
      if (options.ignorePattern.length > 0) {
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

      for (let nodes of formattedMembers) {
        let sortNodesExcludingEslintDisabled = (
          ignoreEslintDisabledNodes: boolean,
        ): SortingNode[] =>
          sortNodesByGroups(nodes, options, { ignoreEslintDisabledNodes })

        reportAllErrors<MESSAGE_ID>({
          availableMessageIds: {
            missedSpacingBetweenMembers: 'missedSpacingBetweenJSXPropsMembers',
            extraSpacingBetweenMembers: 'extraSpacingBetweenJSXPropsMembers',
            unexpectedGroupOrder: 'unexpectedJSXPropsGroupOrder',
            unexpectedOrder: 'unexpectedJSXPropsOrder',
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
      missedSpacingBetweenJSXPropsMembers: MISSED_SPACING_ERROR,
      extraSpacingBetweenJSXPropsMembers: EXTRA_SPACING_ERROR,
      unexpectedJSXPropsGroupOrder: GROUP_ORDER_ERROR,
      unexpectedJSXPropsOrder: ORDER_ERROR,
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
