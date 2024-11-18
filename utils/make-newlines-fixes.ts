import type { TSESLint } from '@typescript-eslint/utils'

import type { SortingNode } from '../typings'

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
  fixer,
  nodes,
  sortedNodes,
  sourceCode,
  options,
}: MakeNewlinesFixesParameters): TSESLint.RuleFix[] => {
  let fixes: TSESLint.RuleFix[] = []

  for (let max = sortedNodes.length, i = 0; i < max; i++) {
    let sortingNode = sortedNodes.at(i)!
    let nextSortingNode = sortedNodes.at(i + 1)

    if (options.newlinesBetween === 'ignore' || !nextSortingNode) {
      continue
    }

    let nodeGroupNumber = getGroupNumber(options.groups, sortingNode)
    let nextNodeGroupNumber = getGroupNumber(options.groups, nextSortingNode)
    let currentNodeRange = getNodeRange(nodes.at(i)!.node, sourceCode)
    let nextNodeRangeStart = getNodeRange(nodes.at(i + 1)!.node, sourceCode).at(
      0,
    )!
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
      nodes.at(i)!,
      nodes.at(i + 1)!,
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
        nodes.at(i)!.node.loc.end.line === nodes.at(i + 1)!.node.loc.start.line
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
