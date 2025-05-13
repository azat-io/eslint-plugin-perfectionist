import type { TSESLint } from '@typescript-eslint/utils'
import type { TSESTree } from '@typescript-eslint/types'

import type { PartitionByCommentOption } from '../types/common-options'
import type { SortingNode } from '../types/sorting-node'

import { isPartitionComment } from './is-partition-comment'
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

let hasPartitionComment = ({
  partitionByComment,
  comments,
}: {
  partitionByComment: PartitionByCommentOption
  comments: TSESTree.Comment[]
}): boolean =>
  comments.some(comment =>
    isPartitionComment({
      partitionByComment,
      comment,
    }),
  )
