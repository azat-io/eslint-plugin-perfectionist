import type { TSESLint } from '@typescript-eslint/utils'

import type { SortingNode } from '../types/sorting-node'

import { getNewlinesBetweenOption } from './get-newlines-between-option'
import { getLinesBetween } from './get-lines-between'
import { getNodeRange } from './get-node-range'

interface Options {
  groups: (
    | { newlinesBetween: 'ignore' | 'always' | 'never' }
    | string[]
    | string
  )[]
  customGroups?: Record<string, string[] | string> | CustomGroup[]
  newlinesBetween: 'ignore' | 'always' | 'never'
}

interface MakeNewlinesFixesParameters {
  sourceCode: TSESLint.SourceCode
  sortedNodes: SortingNode[]
  fixer: TSESLint.RuleFixer
  nodes: SortingNode[]
  options: Options
}

interface CustomGroup {
  newlinesInside?: 'always' | 'never'
  groupName: string
}

export let makeNewlinesFixes = ({
  sortedNodes,
  sourceCode,
  options,
  fixer,
  nodes,
}: MakeNewlinesFixesParameters): TSESLint.RuleFix[] => {
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
    if (newlinesBetween === 'never' && linesBetweenMembers !== 0) {
      rangeReplacement = getStringWithoutInvalidNewlines(textBetweenNodes)
    }

    if (newlinesBetween === 'always' && linesBetweenMembers !== 1) {
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
