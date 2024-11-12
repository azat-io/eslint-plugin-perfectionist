import type { TSESLint } from '@typescript-eslint/utils'

import type { SortingNode } from '../typings'

import { getLinesBetween } from './get-lines-between'

interface Props {
  options: { partitionByNewLine: boolean | number }
  sourceCode: TSESLint.SourceCode
  lastSortingNode: SortingNode
  sortingNode: SortingNode
}

export let matchesPartitionByNewLine = ({
  options,
  sortingNode,
  sourceCode,
  lastSortingNode,
}: Props): boolean => {
  if (!options.partitionByNewLine) {
    return false
  }
  let linesBetween = getLinesBetween(sourceCode, lastSortingNode, sortingNode)
  return (
    (options.partitionByNewLine === true && linesBetween > 0) ||
    (typeof options.partitionByNewLine === 'number' &&
      linesBetween >= options.partitionByNewLine)
  )
}
