import type { TSESLint } from '@typescript-eslint/utils'
import type { TSESTree } from '@typescript-eslint/types'

import { getNodeRange } from './get-node-range'

export function makeNewlinesFix({
  nextNodeRangeStart,
  newlinesOption,
  sourceCode,
  nextNode,
  fixer,
  node,
}: {
  nextNode: TSESTree.Token | TSESTree.Node
  sourceCode: TSESLint.SourceCode
  nextNodeRangeStart: number
  fixer: TSESLint.RuleFixer
  newlinesOption: number
  node: TSESTree.Node
}): TSESLint.RuleFix {
  let nodeRange = getNodeRange({
    sourceCode,
    node,
  })
  let [_, nodeRangeEnd] = nodeRange

  let rangeToReplace: [number, number] = [nodeRangeEnd, nextNodeRangeStart]
  let textAfterNodes = sourceCode.text.slice(nodeRangeEnd, nextNodeRangeStart)

  let rangeReplacement = computeRangeReplacement({
    isOnSameLine: node.loc.end.line === nextNode.loc.start.line,
    textBetweenNodes: textAfterNodes,
    newlinesOption,
  })!

  return fixer.replaceTextRange(rangeToReplace, rangeReplacement)
}

/**
 * Computes the replacement text for adjusting newlines between nodes.
 *
 * Handles the logic of adding or removing newlines while preserving necessary
 * content like comments and semicolons. Special handling for:
 *
 * - Removing excessive newlines when fewer are needed
 * - Adding newlines when more are needed
 * - Preserving inline placement when nodes are on the same line.
 *
 * @param params - Parameters for computing replacement.
 * @param params.textBetweenNodes - Original text between the two nodes.
 * @param params.newlinesOption - Number of newlines required (0 or more).
 * @param params.isOnSameLine - Whether nodes are currently on the same line.
 * @returns Replacement text with correct newlines, or undefined if no change
 *   needed.
 */
function computeRangeReplacement({
  textBetweenNodes,
  newlinesOption,
  isOnSameLine,
}: {
  textBetweenNodes: string
  newlinesOption: number
  isOnSameLine: boolean
}): undefined | string {
  let textAfterNodesWithoutInvalidNewlines =
    getStringWithoutInvalidNewlines(textBetweenNodes)

  if (newlinesOption === 0) {
    return textAfterNodesWithoutInvalidNewlines
  }

  let rangeReplacement = textAfterNodesWithoutInvalidNewlines
  for (let index = 0; index < newlinesOption; index++) {
    rangeReplacement = addNewlineBeforeFirstNewline(rangeReplacement)
  }
  if (!isOnSameLine) {
    return rangeReplacement
  }
  return addNewlineBeforeFirstNewline(rangeReplacement)
}

/**
 * Adds a newline before the first existing newline or at the end of string.
 *
 * Used to incrementally add newlines while preserving existing content. If no
 * newline exists, appends one at the end. Otherwise, inserts before the first
 * newline to maintain proper spacing.
 *
 * @param value - String to add a newline to.
 * @returns String with an additional newline.
 */
function addNewlineBeforeFirstNewline(value: string): string {
  let firstNewlineIndex = value.indexOf('\n')
  if (firstNewlineIndex === -1) {
    return `${value}\n`
  }
  return `${value.slice(0, firstNewlineIndex)}\n${value.slice(firstNewlineIndex)}`
}

/**
 * Removes excessive newlines from a string.
 *
 * Normalizes spacing by collapsing multiple consecutive newlines into single
 * newlines and removing empty lines that contain only whitespace.
 *
 * @param value - String potentially containing excessive newlines.
 * @returns String with normalized newlines.
 */
function getStringWithoutInvalidNewlines(value: string): string {
  return value.replaceAll(/\n\s*\n/gu, '\n').replaceAll(/\n+/gu, '\n')
}
