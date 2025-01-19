import type { TSESLint } from '@typescript-eslint/utils'

import type { PartitionByCommentOption } from '../types/common-options'
import type { SortingNode } from '../types/sorting-node'

import { hasPartitionComment } from './has-partition-comment'
import { getCommentsBefore } from './get-comments-before'
import { getLinesBetween } from './get-lines-between'

interface ShouldPartitionParameters {
  options: {
    partitionByComment?: PartitionByCommentOption
    partitionByNewLine?: boolean
  }
  lastSortingNode: SortingNode | undefined
  tokenValueToIgnoreBefore?: string
  sourceCode: TSESLint.SourceCode
  sortingNode: SortingNode
}

export let shouldPartition = ({
  tokenValueToIgnoreBefore,
  lastSortingNode,
  sortingNode,
  sourceCode,
  options,
}: ShouldPartitionParameters): boolean => {
  let shouldPartitionByComment =
    options.partitionByComment &&
    hasPartitionComment({
      comments: getCommentsBefore({
        tokenValueToIgnoreBefore,
        node: sortingNode.node,
        sourceCode,
      }),
      partitionByComment: options.partitionByComment,
    })
  if (shouldPartitionByComment) {
    return true
  }

  return !!(
    options.partitionByNewLine &&
    lastSortingNode &&
    getLinesBetween(sourceCode, lastSortingNode, sortingNode)
  )
}
