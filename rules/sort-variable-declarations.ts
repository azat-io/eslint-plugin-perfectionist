import type {
  SortVariableDeclarationsSortingNode,
  Selector,
  Options,
} from './sort-variable-declarations/types'

import {
  DEPENDENCY_ORDER_ERROR,
  MISSED_SPACING_ERROR,
  EXTRA_SPACING_ERROR,
  GROUP_ORDER_ERROR,
  ORDER_ERROR,
} from '../utils/report-errors'
import {
  partitionByCommentJsonSchema,
  partitionByNewLineJsonSchema,
} from '../utils/json-schemas/common-partition-json-schemas'
import {
  additionalCustomGroupMatchOptionsJsonSchema,
  allSelectors,
} from './sort-variable-declarations/types'
import { validateNewlinesAndPartitionConfiguration } from '../utils/validate-newlines-and-partition-configuration'
import { defaultComparatorByOptionsComputer } from '../utils/compare/default-comparator-by-options-computer'
import { buildOptionsByGroupIndexComputer } from '../utils/build-options-by-group-index-computer'
import { buildCommonGroupsJsonSchemas } from '../utils/json-schemas/common-groups-json-schemas'
import { validateCustomSortConfiguration } from '../utils/validate-custom-sort-configuration'
import { computeDependencies } from './sort-variable-declarations/compute-dependencies'
import { validateGroupsConfiguration } from '../utils/validate-groups-configuration'
import { buildCommonJsonSchemas } from '../utils/json-schemas/common-json-schemas'
import { computeNodeName } from './sort-variable-declarations/compute-node-name'
import { generatePredefinedGroups } from '../utils/generate-predefined-groups'
import { sortNodesByDependencies } from '../utils/sort-nodes-by-dependencies'
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

const ORDER_ERROR_ID = 'unexpectedVariableDeclarationsOrder'
const GROUP_ORDER_ERROR_ID = 'unexpectedVariableDeclarationsGroupOrder'
const EXTRA_SPACING_ERROR_ID = 'extraSpacingBetweenVariableDeclarationsMembers'
const MISSED_SPACING_ERROR_ID =
  'missedSpacingBetweenVariableDeclarationsMembers'
const DEPENDENCY_ORDER_ERROR_ID =
  'unexpectedVariableDeclarationsDependencyOrder'

type MessageId =
  | typeof DEPENDENCY_ORDER_ERROR_ID
  | typeof MISSED_SPACING_ERROR_ID
  | typeof EXTRA_SPACING_ERROR_ID
  | typeof GROUP_ORDER_ERROR_ID
  | typeof ORDER_ERROR_ID

let defaultOptions: Required<Options[number]> = {
  fallbackSort: { type: 'unsorted' },
  newlinesInside: 'newlinesBetween',
  specialCharacters: 'keep',
  partitionByNewLine: false,
  partitionByComment: false,
  newlinesBetween: 'ignore',
  type: 'alphabetical',
  customGroups: [],
  ignoreCase: true,
  locales: 'en-US',
  alphabet: '',
  order: 'asc',
  groups: [],
}

export default createEslintRule<Options, MessageId>({
  create: context => ({
    VariableDeclaration: node => {
      if (!isSortable(node.declarations)) {
        return
      }

      let settings = getSettings(context.settings)
      let options = complete(context.options.at(0), settings, defaultOptions)

      validateCustomSortConfiguration(options)
      validateNewlinesAndPartitionConfiguration(options)
      validateGroupsConfiguration({
        selectors: allSelectors,
        modifiers: [],
        options,
      })

      let { sourceCode, id } = context
      let eslintDisabledLines = getEslintDisabledLines({
        ruleName: id,
        sourceCode,
      })
      let optionsByGroupIndexComputer =
        buildOptionsByGroupIndexComputer(options)

      let formattedMembers = node.declarations.reduce(
        (accumulator: SortVariableDeclarationsSortingNode[][], declaration) => {
          let name = computeNodeName({
            node: declaration,
            sourceCode,
          })

          let selector: Selector = declaration.init
            ? 'initialized'
            : 'uninitialized'

          let predefinedGroups = generatePredefinedGroups({
            cache: cachedGroupsByModifiersAndSelectors,
            selectors: [selector],
            modifiers: [],
          })

          let lastSortingNode = accumulator.at(-1)?.at(-1)
          let sortingNode: Omit<
            SortVariableDeclarationsSortingNode,
            'partitionId'
          > = {
            group: computeGroup({
              customGroupMatcher: customGroup =>
                doesCustomGroupMatch({
                  selectors: [selector],
                  elementName: name,
                  modifiers: [],
                  customGroup,
                }),
              predefinedGroups,
              options,
            }),
            isEslintDisabled: isNodeEslintDisabled(
              declaration,
              eslintDisabledLines,
            ),
            dependencies: computeDependencies(declaration),
            size: rangeToDiff(declaration, sourceCode),
            dependencyNames: [name],
            node: declaration,
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
            accumulator.push([])
          }

          accumulator.at(-1)?.push({
            ...sortingNode,
            partitionId: accumulator.length,
          })

          return accumulator
        },
        [[]],
      )

      let sortingNodes = formattedMembers.flat()

      reportAllErrors<MessageId>({
        availableMessageIds: {
          missedSpacingBetweenMembers: MISSED_SPACING_ERROR_ID,
          unexpectedDependencyOrder: DEPENDENCY_ORDER_ERROR_ID,
          extraSpacingBetweenMembers: EXTRA_SPACING_ERROR_ID,
          unexpectedGroupOrder: GROUP_ORDER_ERROR_ID,
          unexpectedOrder: ORDER_ERROR_ID,
        },
        sortNodesExcludingEslintDisabled,
        nodes: sortingNodes,
        options,
        context,
      })

      function sortNodesExcludingEslintDisabled(
        ignoreEslintDisabledNodes: boolean,
      ): SortVariableDeclarationsSortingNode[] {
        let nodesSortedByGroups = formattedMembers.flatMap(nodes =>
          sortNodesByGroups({
            comparatorByOptionsComputer: defaultComparatorByOptionsComputer,
            optionsByGroupIndexComputer,
            ignoreEslintDisabledNodes,
            groups: options.groups,
            nodes,
          }),
        )

        return sortNodesByDependencies(nodesSortedByGroups, {
          ignoreEslintDisabledNodes,
        })
      }
    },
  }),
  meta: {
    schema: [
      {
        properties: {
          ...buildCommonJsonSchemas(),
          ...buildCommonGroupsJsonSchemas({
            additionalCustomGroupMatchProperties:
              additionalCustomGroupMatchOptionsJsonSchema,
          }),
          partitionByComment: partitionByCommentJsonSchema,
          partitionByNewLine: partitionByNewLineJsonSchema,
        },
        additionalProperties: false,
        type: 'object',
      },
    ],
    messages: {
      [DEPENDENCY_ORDER_ERROR_ID]: DEPENDENCY_ORDER_ERROR,
      [MISSED_SPACING_ERROR_ID]: MISSED_SPACING_ERROR,
      [EXTRA_SPACING_ERROR_ID]: EXTRA_SPACING_ERROR,
      [GROUP_ORDER_ERROR_ID]: GROUP_ORDER_ERROR,
      [ORDER_ERROR_ID]: ORDER_ERROR,
    },
    docs: {
      url: 'https://perfectionist.dev/rules/sort-variable-declarations',
      description: 'Enforce sorted variable declarations.',
      recommended: true,
    },
    type: 'suggestion',
    fixable: 'code',
  },
  name: 'sort-variable-declarations',
  defaultOptions: [defaultOptions],
})
