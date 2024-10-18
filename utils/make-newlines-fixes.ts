import type { TSESLint } from '@typescript-eslint/utils'

import type { SortingNode } from '../typings'

import { getLinesBetween } from './get-lines-between'
import { getGroupNumber } from './get-group-number'
import { getNodeRange } from './get-node-range'

export const makeNewlinesFixes = (
  fixer: TSESLint.RuleFixer,
  nodes: SortingNode[],
  sortedNodes: SortingNode[],
  source: TSESLint.SourceCode,
  options: {
    newlinesBetween: 'ignore' | 'always' | 'never'
    groups: (string[] | string)[]
  },
) => {
  let fixes: TSESLint.RuleFix[] = []

  for (let max = sortedNodes.length, i = 0; i < max; i++) {
    let sortingNode = sortedNodes.at(i)!
    let nextSortingNode = sortedNodes.at(i + 1)

    if (options.newlinesBetween === 'ignore' || !nextSortingNode) {
      continue
    }

    let nodeGroupNumber = getGroupNumber(options.groups, sortingNode)
    let nextNodeGroupNumber = getGroupNumber(options.groups, nextSortingNode)
    let currentNodeRange = getNodeRange(nodes.at(i)!.node, source)
    let nextNodeRangeStart = getNodeRange(nodes.at(i + 1)!.node, source).at(0)!
    let rangeToReplace: [number, number] = [
      currentNodeRange.at(1)!,
      nextNodeRangeStart,
    ]
    let textBetweenNodes = source.text.slice(
      currentNodeRange.at(1),
      nextNodeRangeStart,
    )

    let linesBetweenMembers = getLinesBetween(
      source,
      nodes.at(i)!,
      nodes.at(i + 1)!,
    )

    if (
      (options.newlinesBetween === 'always' &&
        nodeGroupNumber === nextNodeGroupNumber &&
        linesBetweenMembers !== 0) ||
      (options.newlinesBetween === 'never' && linesBetweenMembers > 0)
    ) {
      fixes.push(
        fixer.replaceTextRange(
          rangeToReplace,
          getStringWithoutInvalidNewlines(textBetweenNodes),
        ),
      )
    }

    if (
      options.newlinesBetween === 'always' &&
      nodeGroupNumber !== nextNodeGroupNumber &&
      linesBetweenMembers !== 1
    ) {
      fixes.push(
        fixer.replaceTextRange(
          rangeToReplace,
          addNewlineBeforeFirstWhitespace(
            linesBetweenMembers > 1
              ? getStringWithoutInvalidNewlines(textBetweenNodes)
              : textBetweenNodes,
          ),
        ),
      )
    }
  }
  return fixes
}

const getStringWithoutInvalidNewlines = (value: string) =>
  value.replaceAll(/\n+\s*\n+/g, '\n').replaceAll(/\n+/g, '\n')

const addNewlineBeforeFirstWhitespace = (value: string) => {
  let firstWhitespaceIndex = value.search(/\s/)
  return (
    value.slice(0, firstWhitespaceIndex) +
    '\n' +
    value.slice(firstWhitespaceIndex)
  )
}
