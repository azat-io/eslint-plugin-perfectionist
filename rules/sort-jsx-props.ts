import { TSESTree } from '@typescript-eslint/types'

import type {
  DeprecatedCustomGroupsOption,
  NewlinesBetweenOption,
  CommonOptions,
  GroupsOptions,
  RegexOption,
} from '../types/common-options'
import type { SortingNode } from '../types/sorting-node'

import {
  buildUseConfigurationIfJsonSchema,
  partitionByNewLineJsonSchema,
  newlinesBetweenJsonSchema,
  customGroupsJsonSchema,
  commonJsonSchemas,
  groupsJsonSchema,
  regexJsonSchema,
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
import { getMatchingContextOptions } from '../utils/get-matching-context-options'
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

type Options = Partial<
  {
    useConfigurationIf: {
      allNamesMatchPattern?: RegexOption
      tagMatchesPattern?: RegexOption
    }
    customGroups: DeprecatedCustomGroupsOption
    newlinesBetween: NewlinesBetweenOption
    groups: GroupsOptions<Group>
    partitionByNewLine: boolean
    /**
     * @deprecated for {@link `useConfigurationIf.tagMatchesPattern`}
     */
    ignorePattern: RegexOption
  } & CommonOptions
>[]

type MESSAGE_ID =
  | 'missedSpacingBetweenJSXPropsMembers'
  | 'extraSpacingBetweenJSXPropsMembers'
  | 'unexpectedJSXPropsGroupOrder'
  | 'unexpectedJSXPropsOrder'

type Group = 'multiline' | 'shorthand' | 'unknown' | string

let defaultOptions: Required<Options[0]> = {
  fallbackSort: { type: 'unsorted' },
  specialCharacters: 'keep',
  newlinesBetween: 'ignore',
  partitionByNewLine: false,
  useConfigurationIf: {},
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
      let sourceCode = getSourceCode(context)
      let matchedContextOptions = getMatchingContextOptions({
        nodeNames: node.openingElement.attributes
          .filter(
            attribute =>
              attribute.type !== TSESTree.AST_NODE_TYPES.JSXSpreadAttribute,
          )
          .map(attribute => getNodeName({ attribute })),
        contextOptions: context.options,
      }).find(options => {
        if (!options.useConfigurationIf?.tagMatchesPattern) {
          return true
        }
        return matches(
          sourceCode.getText(node.openingElement.name),
          options.useConfigurationIf.tagMatchesPattern,
        )
      })
      let options = complete(matchedContextOptions, settings, defaultOptions)
      validateCustomSortConfiguration(options)
      validateGroupsConfiguration({
        allowedPredefinedGroups: ['multiline', 'shorthand', 'unknown'],
        allowedCustomGroups: Object.keys(options.customGroups),
        options,
      })
      validateNewlinesAndPartitionConfiguration(options)

      let shouldIgnore = matches(
        sourceCode.getText(node.openingElement.name),
        options.ignorePattern,
      )
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
            if (attribute.type === TSESTree.AST_NODE_TYPES.JSXSpreadAttribute) {
              accumulator.push([])
              return accumulator
            }

            let name = getNodeName({ attribute })

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
    schema: {
      items: {
        properties: {
          ...commonJsonSchemas,
          useConfigurationIf: buildUseConfigurationIfJsonSchema({
            additionalProperties: {
              tagMatchesPattern: regexJsonSchema,
            },
          }),
          partitionByNewLine: partitionByNewLineJsonSchema,
          newlinesBetween: newlinesBetweenJsonSchema,
          customGroups: customGroupsJsonSchema,
          ignorePattern: regexJsonSchema,
          groups: groupsJsonSchema,
        },
        additionalProperties: false,
        type: 'object',
      },
      uniqueItems: true,
      type: 'array',
    },
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

let getNodeName = ({
  attribute,
}: {
  attribute: TSESTree.JSXAttribute
}): string =>
  attribute.name.type === TSESTree.AST_NODE_TYPES.JSXNamespacedName
    ? `${attribute.name.namespace.name}:${attribute.name.name.name}`
    : attribute.name.name
