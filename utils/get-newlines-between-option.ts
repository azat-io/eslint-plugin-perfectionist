import type {
  DeprecatedCustomGroupsOption,
  NewlinesBetweenOption,
  CustomGroupsOption,
  GroupsOptions,
} from '../types/common-options'

import { isNewlinesBetweenOption } from './is-newlines-between-option'
import { UnreachableCaseError } from './unreachable-case-error'

export interface GetNewlinesBetweenOptionParameters {
  options: {
    customGroups?: DeprecatedCustomGroupsOption | CustomGroupsOption
    newlinesBetween: NewlinesBetweenOption
    groups: GroupsOptions<string>
  }
  nextNodeGroupIndex: number
  nodeGroupIndex: number
}

/**
 * Get the `newlinesBetween` option to use between two consecutive nodes.
 * The result is based on the global `newlinesBetween` option and the custom
 * groups, which can override the global option.
 * - If the two nodes are in the same custom group, the `newlinesInside` option
 * of the group is used.
 * @param {GetNewlinesBetweenOptionParameters} props - The function arguments
 * @param {number} props.nextNodeGroupIndex - The next node index to sort
 * @param {number} props.nodeGroupIndex - The current node index to sort
 * @param {GetNewlinesBetweenOptionParameters['options']} props.options - Newlines between related options
 * @returns {NewlinesBetweenOption} - The `newlinesBetween` option to
 * use
 */
export let getNewlinesBetweenOption = ({
  nextNodeGroupIndex,
  nodeGroupIndex,
  options,
}: GetNewlinesBetweenOptionParameters): 'ignore' | 0 | 1 => {
  let globalNewlinesBetweenOption = getGlobalNewlinesBetweenOption({
    newlinesBetween: options.newlinesBetween,
    nextNodeGroupIndex,
    nodeGroupIndex,
  })

  let nodeGroup = options.groups[nodeGroupIndex]
  let nextNodeGroup = options.groups[nextNodeGroupIndex]

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
      if (nodeCustomGroup.newlinesInside !== undefined) {
        return convertNewlinesBetweenOptionToNumber(
          nodeCustomGroup.newlinesInside,
        )
      }
      return globalNewlinesBetweenOption
    }
  }

  // Check if a specific newlinesBetween is defined between the two groups
  if (nextNodeGroupIndex >= nodeGroupIndex + 2) {
    if (nextNodeGroupIndex === nodeGroupIndex + 2) {
      let groupBetween = options.groups[nodeGroupIndex + 1]!
      if (isNewlinesBetweenOption(groupBetween)) {
        return convertNewlinesBetweenOptionToNumber(
          groupBetween.newlinesBetween,
        )
      }
    } else {
      let relevantGroups = options.groups.slice(
        nodeGroupIndex,
        nextNodeGroupIndex + 1,
      )
      let groupsWithAllNewlinesBetween = buildGroupsWithAllNewlinesBetween(
        relevantGroups,
        globalNewlinesBetweenOption,
      )
      let newlinesBetweenOptions = new Set(
        groupsWithAllNewlinesBetween
          .filter(isNewlinesBetweenOption)
          .map(group => group.newlinesBetween)
          .map(convertNewlinesBetweenOptionToNumber),
      )

      if (newlinesBetweenOptions.has(1)) {
        return 1
      }
      if (newlinesBetweenOptions.has('ignore')) {
        return 'ignore'
      }
      if (newlinesBetweenOptions.has(0)) {
        return 0
      }
    }
  }

  return globalNewlinesBetweenOption
}

let getGlobalNewlinesBetweenOption = ({
  nextNodeGroupIndex,
  newlinesBetween,
  nodeGroupIndex,
}: {
  newlinesBetween: NewlinesBetweenOption
  nextNodeGroupIndex: number
  nodeGroupIndex: number
}): 'ignore' | 0 | 1 => {
  let numberNewlinesBetween =
    convertNewlinesBetweenOptionToNumber(newlinesBetween)

  if (numberNewlinesBetween === 'ignore') {
    return 'ignore'
  }
  if (numberNewlinesBetween === 0) {
    return 0
  }
  return nodeGroupIndex === nextNodeGroupIndex ? 'never' : 'always'
}

let buildGroupsWithAllNewlinesBetween = (
  groups: GroupsOptions<string>,
  globalNewlinesBetweenOption: 'ignore' | 0 | 1,
): GroupsOptions<string> => {
  let returnValue: GroupsOptions<string> = []
  for (let i = 0; i < groups.length; i++) {
    let group = groups[i]!

    if (!isNewlinesBetweenOption(group)) {
      let previousGroup = groups[i - 1]
      if (previousGroup && !isNewlinesBetweenOption(previousGroup)) {
        returnValue.push({
          newlinesBetween: globalNewlinesBetweenOption,
        })
      }
    }

    returnValue.push(group)
  }
  return returnValue
}

let convertNewlinesBetweenOptionToNumber = (
  newlinesBetween: NewlinesBetweenOption,
): 'ignore' | 0 | 1 => {
  switch (newlinesBetween) {
    case 'ignore':
      return 'ignore'
    case 'always':
    case 1:
      return 1
    case 'never':
    case 0:
      return 0
    /* v8 ignore next 2 */
    default:
      throw new UnreachableCaseError(newlinesBetween)
  }
}
