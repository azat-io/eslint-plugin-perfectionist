import type { RuleContext } from '@typescript-eslint/utils/ts-eslint'
import type { TSESTree } from '@typescript-eslint/types'

import { AST_NODE_TYPES } from '@typescript-eslint/utils'

import type {
  SortConstructorParametersSortingNode,
  Selector,
  Options,
} from './types'

import { populateSortingNodeGroupsWithDependencies } from '../../utils/populate-sorting-node-groups-with-dependencies'
import { validateNewlinesAndPartitionConfiguration } from '../../utils/validate-newlines-and-partition-configuration'
import { defaultComparatorByOptionsComputer } from '../../utils/compare/default-comparator-by-options-computer'
import { buildOptionsByGroupIndexComputer } from '../../utils/build-options-by-group-index-computer'
import { validateCustomSortConfiguration } from '../../utils/validate-custom-sort-configuration'
import { computeDependenciesBySortingNode } from './compute-dependencies-by-sorting-node'
import { validateGroupsConfiguration } from '../../utils/validate-groups-configuration'
import { generatePredefinedGroups } from '../../utils/generate-predefined-groups'
import { sortNodesByDependencies } from '../../utils/sort-nodes-by-dependencies'
import { computeMatchedContextOptions } from './compute-matched-context-options'
import { getEslintDisabledLines } from '../../utils/get-eslint-disabled-lines'
import { doesCustomGroupMatch } from '../../utils/does-custom-group-match'
import { isNodeEslintDisabled } from '../../utils/is-node-eslint-disabled'
import { computeParameterModifiers } from './compute-parameter-modifiers'
import { sortNodesByGroups } from '../../utils/sort-nodes-by-groups'
import { reportAllErrors } from '../../utils/report-all-errors'
import { shouldPartition } from '../../utils/should-partition'
import { computeGroup } from '../../utils/compute-group'
import { rangeToDiff } from '../../utils/range-to-diff'
import { getSettings } from '../../utils/get-settings'
import { computeNodeName } from './compute-node-name'
import { isSortable } from '../../utils/is-sortable'
import { allSelectors, allModifiers } from './types'
import { complete } from '../../utils/complete'

export function sortConstructorParameters<MessageIds extends string>({
  cachedGroupsByModifiersAndSelectors,
  mustHaveMatchedContextOptions,
  availableMessageIds,
  matchedAstSelectors,
  defaultOptions,
  context,
  node,
}: {
  availableMessageIds: {
    missedSpacingBetweenMembers: MessageIds
    extraSpacingBetweenMembers: MessageIds
    unexpectedDependencyOrder: MessageIds
    unexpectedGroupOrder: MessageIds
    unexpectedOrder: MessageIds
  }
  cachedGroupsByModifiersAndSelectors: Map<string, string[]>
  context: Readonly<RuleContext<MessageIds, Options>>
  defaultOptions: Required<Options[number]>
  matchedAstSelectors: ReadonlySet<string>
  mustHaveMatchedContextOptions: boolean
  node: TSESTree.MethodDefinition
}): void {
  let { params } = node.value

  if (!isSortable(params)) {
    return
  }

  let { sourceCode, id } = context
  let settings = getSettings(context.settings)

  let matchedContextOptions = computeMatchedContextOptions({
    matchedAstSelectors,
    context,
    params,
  })

  if (mustHaveMatchedContextOptions && !matchedContextOptions) {
    return
  }

  let options = complete(matchedContextOptions, settings, defaultOptions)
  validateCustomSortConfiguration(options)
  validateGroupsConfiguration({
    selectors: allSelectors,
    modifiers: allModifiers,
    options,
  })
  validateNewlinesAndPartitionConfiguration(options)

  let eslintDisabledLines = getEslintDisabledLines({
    ruleName: id,
    sourceCode,
  })
  let optionsByGroupIndexComputer = buildOptionsByGroupIndexComputer(options)

  let sortingNodeGroups: SortConstructorParametersSortingNode[][] =
    params.reduce(
      (
        accumulator: SortConstructorParametersSortingNode[][],
        parameter: TSESTree.Parameter,
      ) => {
        if (parameter.type === AST_NODE_TYPES.RestElement) {
          accumulator.push([])
          return accumulator
        }

        let name = computeNodeName({ node: parameter, sourceCode })
        let selector: Selector = 'parameter'
        let modifiers = computeParameterModifiers(parameter)
        let predefinedGroups = generatePredefinedGroups({
          cache: cachedGroupsByModifiersAndSelectors,
          selectors: [selector],
          modifiers,
        })
        let group = computeGroup({
          customGroupMatcher: customGroup =>
            doesCustomGroupMatch({
              selectors: [selector],
              elementName: name,
              customGroup,
              modifiers,
            }),
          predefinedGroups,
          options,
        })

        let sortingNode: Omit<
          SortConstructorParametersSortingNode,
          'partitionId'
        > = {
          isEslintDisabled: isNodeEslintDisabled(
            parameter,
            eslintDisabledLines,
          ),
          size: rangeToDiff(parameter, sourceCode),
          dependencyNames: [name],
          dependencies: [],
          node: parameter,
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

  let dependenciesBySortingNode = computeDependenciesBySortingNode({
    sortingNodes: sortingNodeGroups.flat(),
    sourceCode,
  })
  sortingNodeGroups = populateSortingNodeGroupsWithDependencies({
    dependenciesBySortingNode,
    sortingNodeGroups,
  })

  function sortNodesExcludingEslintDisabled(
    ignoreEslintDisabledNodes: boolean,
  ): SortConstructorParametersSortingNode[] {
    let nodesSortedByGroups = sortingNodeGroups.flatMap(nodes =>
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

  let sortingNodes = sortingNodeGroups.flat()

  reportAllErrors<MessageIds>({
    sortNodesExcludingEslintDisabled,
    availableMessageIds,
    nodes: sortingNodes,
    options,
    context,
  })
}
