import type { TSESLint } from '@typescript-eslint/utils'

import type { SortingNode } from '../types/sorting-node'

import { getLinesBetween } from './get-lines-between'
import { getGroupNumber } from './get-group-number'
import { getNodeRange } from './get-node-range'

interface MakeNewlinesFixesParameters {
  options: {
    newlinesBetween: 'ignore' | 'always' | 'never'
    groups: (string[] | string)[]
  }
  sourceCode: TSESLint.SourceCode
  sortedNodes: SortingNode[]
  fixer: TSESLint.RuleFixer
  nodes: SortingNode[]
}

export let makeNewlinesFixes = ({
  sortedNodes,
  sourceCode,
  options,
  fixer,
  nodes,
}: MakeNewlinesFixesParameters): TSESLint.RuleFix[] => {
  if (options.newlinesBetween === 'ignore') {
    return []
  }

  let fixes: TSESLint.RuleFix[] = []

  for (let i = 0; i < sortedNodes.length - 1; i++) {
    let sortingNode = nodes.at(i)!
    let nextSortingNode = nodes.at(i + 1)!
    let sortedSortingNode = sortedNodes.at(i)!
    let nextSortedSortingNode = sortedNodes.at(i + 1)!

    let nodeGroupNumber = getGroupNumber(options.groups, sortedSortingNode)
    let nextNodeGroupNumber = getGroupNumber(
      options.groups,
      nextSortedSortingNode,
    )
    let currentNodeRange = getNodeRange({
      node: sortingNode.node,
      sourceCode,
    })
    let nextNodeRangeStart = getNodeRange({
      node: nextSortingNode.node,
      sourceCode,
    }).at(0)!
    let rangeToReplace: [number, number] = [
      currentNodeRange.at(1)!,
      nextNodeRangeStart,
    ]
    let textBetweenNodes = sourceCode.text.slice(
      currentNodeRange.at(1),
      nextNodeRangeStart,
    )

    let linesBetweenMembers = getLinesBetween(
      sourceCode,
      sortingNode,
      nextSortingNode,
    )

    let rangeReplacement: undefined | string
    if (
      (options.newlinesBetween === 'always' &&
        nodeGroupNumber === nextNodeGroupNumber &&
        linesBetweenMembers !== 0) ||
      (options.newlinesBetween === 'never' && linesBetweenMembers > 0)
    ) {
      rangeReplacement = getStringWithoutInvalidNewlines(textBetweenNodes)
    }

    if (
      options.newlinesBetween === 'always' &&
      nodeGroupNumber !== nextNodeGroupNumber &&
      linesBetweenMembers !== 1
    ) {
      rangeReplacement = addNewlineBeforeFirstNewline(
        linesBetweenMembers > 1
          ? getStringWithoutInvalidNewlines(textBetweenNodes)
          : textBetweenNodes,
      )
      let isOnSameLine =
        linesBetweenMembers === 0 &&
        sortingNode.node.loc.end.line === nextSortingNode.node.loc.start.line
      if (isOnSameLine) {
        rangeReplacement = addNewlineBeforeFirstNewline(rangeReplacement)
      }
    }

    if (rangeReplacement) {
      fixes.push(fixer.replaceTextRange(rangeToReplace, rangeReplacement))
    }
  }

  return fixes
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
