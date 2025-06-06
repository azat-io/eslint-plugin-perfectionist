import type { TSESLint } from '@typescript-eslint/utils'

import type {
  DeprecatedCustomGroupsOption,
  NewlinesBetweenOption,
  CustomGroupsOption,
  GroupsOptions,
} from '../types/common-options'
import type { NewlinesBetweenValueGetter } from './get-newlines-between-errors'
import type { SortingNode } from '../types/sorting-node'

import { getNewlinesBetweenOption } from './get-newlines-between-option'
import { getLinesBetween } from './get-lines-between'
import { getNodeRange } from './get-node-range'

interface MakeNewlinesBetweenFixesParameters<T extends SortingNode> {
  options: {
    customGroups?: DeprecatedCustomGroupsOption | CustomGroupsOption
    newlinesBetween: NewlinesBetweenOption
    groups: GroupsOptions<string>
  }
  newlinesBetweenValueGetter?: NewlinesBetweenValueGetter<T>
  sourceCode: TSESLint.SourceCode
  fixer: TSESLint.RuleFixer
  sortedNodes: T[]
  nodes: T[]
}

export let makeNewlinesBetweenFixes = <T extends SortingNode>({
  newlinesBetweenValueGetter,
  sortedNodes,
  sourceCode,
  options,
  fixer,
  nodes,
}: MakeNewlinesBetweenFixesParameters<T>): TSESLint.RuleFix[] => {
  let fixes: TSESLint.RuleFix[] = []

  for (let i = 0; i < sortedNodes.length - 1; i++) {
    let sortingNode = nodes.at(i)!
    let nextSortingNode = nodes.at(i + 1)!
    let sortedSortingNode = sortedNodes.at(i)!
    let nextSortedSortingNode = sortedNodes.at(i + 1)!

    let newlinesBetween = getNewlinesBetweenOption({
      nextSortingNode: nextSortedSortingNode,
      sortingNode: sortedSortingNode,
      options,
    })
    newlinesBetween =
      newlinesBetweenValueGetter?.({
        computedNewlinesBetween: newlinesBetween,
        right: nextSortedSortingNode,
        left: sortedSortingNode,
      }) ?? newlinesBetween

    if (newlinesBetween === 'ignore') {
      continue
    }

    let currentNodeRange = getNodeRange({
      node: sortingNode.node,
      sourceCode,
    })
    let nextNodeRangeStart = getNodeRange({
      node: nextSortingNode.node,
      sourceCode,
    }).at(0)!

    let linesBetweenMembers = getLinesBetween(
      sourceCode,
      sortingNode,
      nextSortingNode,
    )
    if (linesBetweenMembers === newlinesBetween) {
      continue
    }

    let rangeToReplace: [number, number] = [
      currentNodeRange.at(1)!,
      nextNodeRangeStart,
    ]
    let textBetweenNodes = sourceCode.text.slice(
      currentNodeRange.at(1),
      nextNodeRangeStart,
    )

    let rangeReplacement = computeRangeRemplacement({
      isOnSameLine:
        sortingNode.node.loc.end.line === nextSortingNode.node.loc.start.line,
      textBetweenNodes,
      newlinesBetween,
    })
    if (rangeReplacement) {
      fixes.push(fixer.replaceTextRange(rangeToReplace, rangeReplacement))
    }
  }

  return fixes
}

let computeRangeRemplacement = ({
  textBetweenNodes,
  newlinesBetween,
  isOnSameLine,
}: {
  textBetweenNodes: string
  newlinesBetween: number
  isOnSameLine: boolean
}): undefined | string => {
  let textBetweenNodesWithoutInvalidNewlines =
    getStringWithoutInvalidNewlines(textBetweenNodes)

  if (newlinesBetween === 0) {
    return textBetweenNodesWithoutInvalidNewlines
  }

  let rangeReplacement: undefined | string
  for (let index = 0; index < newlinesBetween; index++) {
    rangeReplacement = addNewlineBeforeFirstNewline(
      textBetweenNodesWithoutInvalidNewlines,
    )
  }
  if (!isOnSameLine) {
    return rangeReplacement
  }
  return addNewlineBeforeFirstNewline(rangeReplacement!)
}

let getStringWithoutInvalidNewlines = (value: string): string =>
  value.replaceAll(/\n\s*\n/gu, '\n').replaceAll(/\n+/gu, '\n')

let addNewlineBeforeFirstNewline = (value: string): string => {
  let firstNewlineIndex = value.indexOf('\n')
  if (firstNewlineIndex === -1) {
    return `${value}\n`
  }
  return `${value.slice(0, firstNewlineIndex)}\n${value.slice(firstNewlineIndex)}`
}
