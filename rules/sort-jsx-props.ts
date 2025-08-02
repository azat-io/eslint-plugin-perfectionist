import type { TSESLint } from '@typescript-eslint/utils'

import { TSESTree } from '@typescript-eslint/types'

import type { Modifier, Selector } from './sort-jsx-props/types'
import type { SortingNode } from '../types/sorting-node'
import type { Options } from './sort-jsx-props/types'

import {
  buildUseConfigurationIfJsonSchema,
  buildCustomGroupsArrayJsonSchema,
  partitionByNewLineJsonSchema,
  newlinesBetweenJsonSchema,
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
import { buildGetCustomGroupOverriddenOptionsFunction } from '../utils/get-custom-groups-compare-options'
import { validateGeneratedGroupsConfiguration } from '../utils/validate-generated-groups-configuration'
import { validateCustomSortConfiguration } from '../utils/validate-custom-sort-configuration'
import { filterOptionsByAllNamesMatch } from '../utils/filter-options-by-all-names-match'
import { generatePredefinedGroups } from '../utils/generate-predefined-groups'
import { getEslintDisabledLines } from '../utils/get-eslint-disabled-lines'
import { isNodeEslintDisabled } from '../utils/is-node-eslint-disabled'
import { doesCustomGroupMatch } from '../utils/does-custom-group-match'
import { singleCustomGroupJsonSchema } from './sort-jsx-props/types'
import { allModifiers, allSelectors } from './sort-jsx-props/types'
import { sortNodesByGroups } from '../utils/sort-nodes-by-groups'
import { createEslintRule } from '../utils/create-eslint-rule'
import { reportAllErrors } from '../utils/report-all-errors'
import { shouldPartition } from '../utils/should-partition'
import { computeGroup } from '../utils/compute-group'
import { rangeToDiff } from '../utils/range-to-diff'
import { getSettings } from '../utils/get-settings'
import { isSortable } from '../utils/is-sortable'
import { complete } from '../utils/complete'
import { matches } from '../utils/matches'

/** Cache computed groups by modifiers and selectors for performance. */
let cachedGroupsByModifiersAndSelectors = new Map<string, string[]>()

type MessageId =
  | 'missedSpacingBetweenJSXPropsMembers'
  | 'extraSpacingBetweenJSXPropsMembers'
  | 'unexpectedJSXPropsGroupOrder'
  | 'unexpectedJSXPropsOrder'

let defaultOptions: Required<Options[number]> = {
  fallbackSort: { type: 'unsorted' },
  specialCharacters: 'keep',
  newlinesBetween: 'ignore',
  partitionByNewLine: false,
  useConfigurationIf: {},
  type: 'alphabetical',
  ignorePattern: [],
  ignoreCase: true,
  customGroups: [],
  locales: 'en-US',
  alphabet: '',
  order: 'asc',
  groups: [],
}

export default createEslintRule<Options, MessageId>({
  create: context => ({
    JSXElement: node => {
      if (!isSortable(node.openingElement.attributes)) {
        return
      }

      let settings = getSettings(context.settings)
      let { sourceCode, id } = context

      let matchedContextOptions = computeMatchedContextOptions({
        sourceCode,
        context,
        node,
      })
      let options = complete(matchedContextOptions, settings, defaultOptions)
      validateCustomSortConfiguration(options)
      validateGeneratedGroupsConfiguration({
        selectors: allSelectors,
        modifiers: allModifiers,
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
        ruleName: id,
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

            let selectors: Selector[] = []
            let modifiers: Modifier[] = []

            if (attribute.value === null) {
              modifiers.push('shorthand')
            }
            if (attribute.loc.start.line !== attribute.loc.end.line) {
              modifiers.push('multiline')
            }
            selectors.push('prop')

            let predefinedGroups = generatePredefinedGroups({
              cache: cachedGroupsByModifiersAndSelectors,
              selectors,
              modifiers,
            })
            let group = computeGroup({
              customGroupMatcher: customGroup =>
                doesCustomGroupMatch({
                  elementValue: attribute.value
                    ? sourceCode.getText(attribute.value)
                    : null,
                  elementName: name,
                  customGroup,
                  selectors,
                  modifiers,
                }),
              predefinedGroups,
              options,
            })

            let sortingNode: Omit<SortingNode, 'partitionId'> = {
              isEslintDisabled: isNodeEslintDisabled(
                attribute,
                eslintDisabledLines,
              ),
              size: rangeToDiff(attribute, sourceCode),
              node: attribute,
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

      for (let currentNodes of formattedMembers) {
        function createSortNodesExcludingEslintDisabled(nodes: SortingNode[]) {
          return function (ignoreEslintDisabledNodes: boolean): SortingNode[] {
            return sortNodesByGroups({
              getOptionsByGroupIndex:
                buildGetCustomGroupOverriddenOptionsFunction(options),
              ignoreEslintDisabledNodes,
              groups: options.groups,
              nodes,
            })
          }
        }

        reportAllErrors<MessageId>({
          availableMessageIds: {
            missedSpacingBetweenMembers: 'missedSpacingBetweenJSXPropsMembers',
            extraSpacingBetweenMembers: 'extraSpacingBetweenJSXPropsMembers',
            unexpectedGroupOrder: 'unexpectedJSXPropsGroupOrder',
            unexpectedOrder: 'unexpectedJSXPropsOrder',
          },
          sortNodesExcludingEslintDisabled:
            createSortNodesExcludingEslintDisabled(currentNodes),
          nodes: currentNodes,
          sourceCode,
          options,
          context,
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
          customGroups: buildCustomGroupsArrayJsonSchema({
            singleCustomGroupJsonSchema,
          }),
          partitionByNewLine: partitionByNewLineJsonSchema,
          newlinesBetween: newlinesBetweenJsonSchema,
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

function computeMatchedContextOptions({
  sourceCode,
  context,
  node,
}: {
  context: TSESLint.RuleContext<string, Options>
  sourceCode: TSESLint.SourceCode
  node: TSESTree.JSXElement
}): Options[number] | undefined {
  return filterOptionsByAllNamesMatch({
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
}

function getNodeName({
  attribute,
}: {
  attribute: TSESTree.JSXAttribute
}): string {
  return attribute.name.type === TSESTree.AST_NODE_TYPES.JSXNamespacedName
    ? `${attribute.name.namespace.name}:${attribute.name.name.name}`
    : attribute.name.name
}
