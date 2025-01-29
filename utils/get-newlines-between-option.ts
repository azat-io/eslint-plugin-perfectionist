import type {
  DeprecatedCustomGroupsOption,
  NewlinesBetweenOption,
  CustomGroupsOption,
  GroupsOptions,
} from '../types/common-options'
import type { SortingNode } from '../types/sorting-node'

import { isNewlinesBetweenOption } from './is-newlines-between-option'
import { getGroupNumber } from './get-group-number'

export interface GetNewlinesBetweenOptionParameters {
  options: {
    customGroups?: DeprecatedCustomGroupsOption | CustomGroupsOption
    newlinesBetween: NewlinesBetweenOption
    groups: GroupsOptions<string>
  }
  nextSortingNode: SortingNode
  sortingNode: SortingNode
}

/**
 * Get the `newlinesBetween` option to use between two consecutive nodes.
 * The result is based on the global `newlinesBetween` option and the custom
 * groups, which can override the global option.
 * - If the two nodes are in the same custom group, the `newlinesInside` option
 * of the group is used.
 * @param {GetNewlinesBetweenOptionParameters} props - The function arguments
 * @param {SortingNode} props.nextSortingNode - The next node to sort
 * @param {SortingNode} props.sortingNode - The current node to sort
 * @param {GetNewlinesBetweenOptionParameters['options']} props.options - Newlines between related options
 * @returns {NewlinesBetweenOption} - The `newlinesBetween` option to
 * use
 */
export let getNewlinesBetweenOption = ({
  nextSortingNode,
  sortingNode,
  options,
}: GetNewlinesBetweenOptionParameters): NewlinesBetweenOption => {
  let nodeGroupNumber = getGroupNumber(options.groups, sortingNode)
  let nextNodeGroupNumber = getGroupNumber(options.groups, nextSortingNode)
  let globalNewlinesBetweenOption = getGlobalNewlinesBetweenOption({
    newlinesBetween: options.newlinesBetween,
    nextNodeGroupNumber,
    nodeGroupNumber,
  })

  let nodeGroup = options.groups[nodeGroupNumber]
  let nextNodeGroup = options.groups[nextNodeGroupNumber]

  // NewlinesInside check
  if (
    Array.isArray(options.customGroups) &&
    typeof nodeGroup === 'string' &&
    typeof nextNodeGroup === 'string' &&
    nodeGroup === nextNodeGroup
  ) {
    let nodeCustomGroup = options.customGroups.find(
      customGroup => customGroup.groupName === nodeGroup,
    )
    let nextNodeCustomGroup = options.customGroups.find(
      customGroup => customGroup.groupName === nextNodeGroup,
    )

    if (
      nodeCustomGroup &&
      nextNodeCustomGroup &&
      nodeCustomGroup.groupName === nextNodeCustomGroup.groupName
    ) {
      return nodeCustomGroup.newlinesInside ?? globalNewlinesBetweenOption
    }
  }

  // Check if a specific newlinesBetween is defined between the two groups
  if (nextNodeGroupNumber >= nodeGroupNumber + 2) {
    if (nextNodeGroupNumber === nodeGroupNumber + 2) {
      let groupBetween = options.groups[nodeGroupNumber + 1]!
      if (isNewlinesBetweenOption(groupBetween)) {
        return groupBetween.newlinesBetween
      }
    } else {
      if (globalNewlinesBetweenOption === 'always') {
        return 'always'
      }
      for (let i = nodeGroupNumber + 2; i < nextNodeGroupNumber; i++) {
        let groupBetween = options.groups[i]!
        if (
          isNewlinesBetweenOption(groupBetween) &&
          groupBetween.newlinesBetween !== 'never'
        ) {
          return groupBetween.newlinesBetween
        }
      }
    }
  }

  return globalNewlinesBetweenOption
}

let getGlobalNewlinesBetweenOption = ({
  nextNodeGroupNumber,
  newlinesBetween,
  nodeGroupNumber,
}: {
  newlinesBetween: NewlinesBetweenOption
  nextNodeGroupNumber: number
  nodeGroupNumber: number
}): 'always' | 'ignore' | 'never' => {
  if (newlinesBetween === 'ignore') {
    return 'ignore'
  }
  if (newlinesBetween === 'never') {
    return 'never'
  }
  return nodeGroupNumber === nextNodeGroupNumber ? 'never' : 'always'
}
