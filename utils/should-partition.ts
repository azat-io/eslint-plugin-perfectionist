import type { TSESLint } from '@typescript-eslint/utils'
import type { TSESTree } from '@typescript-eslint/types'

import type { PartitionByCommentOption } from '../types/common-options'
import type { SortingNode } from '../types/sorting-node'

import { isPartitionComment } from './is-partition-comment'
import { getCommentsBefore } from './get-comments-before'
import { getLinesBetween } from './get-lines-between'

/** Parameters for determining if a new partition should start. */
interface ShouldPartitionParameters {
  options: {
    partitionByComment?: PartitionByCommentOption
    partitionByNewLine?: boolean
  }
  lastSortingNode: Pick<SortingNode, 'node'> | undefined
  sortingNode: Pick<SortingNode, 'node'>
  tokenValueToIgnoreBefore?: string
  sourceCode: TSESLint.SourceCode
}

/**
 * Determines if a new partition (independent sorting section) should start.
 *
 * Partitions divide code into independent sections that are sorted separately,
 * preventing elements from being moved across partition boundaries. This is
 * critical for preserving logical groupings in code.
 *
 * A new partition is created when:
 *
 * - A partition comment is found before the current node
 * - An empty line exists between nodes (when partitionByNewLine is enabled).
 *
 * @example
 *   // React component with partition comments
 *   import React from 'react'
 *   import { useState, useEffect } from 'react'
 *   // --- Utils ---  <- This comment creates a partition
 *   import { formatDate } from './utils/date'
 *   import { apiClient } from './utils/api'
 *
 * @example
 *   // Object with newline partitions
 *   const config = {
 *     // API settings
 *     apiUrl: 'https://api.example.com',
 *     timeout: 5000,
 *     // <- Empty line creates partition
 *     // UI settings
 *     theme: 'dark',
 *     language: 'en',
 *   }
 *
 * @example
 *   // Class members with sections
 *   class UserService {
 *   private cache: Map<string, User>;
 *   private logger: Logger;
 *
 *   // Public methods section
 *   async getUser(id: string) { ... }
 *   async updateUser(id: string, data: Partial<User>) { ... }
 *   }
 *
 * @param params - Parameters for partition detection.
 * @returns True if a new partition should start at the current node.
 */
export function shouldPartition({
  tokenValueToIgnoreBefore,
  lastSortingNode,
  sortingNode,
  sourceCode,
  options,
}: ShouldPartitionParameters): boolean {
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

/**
 * Checks if any of the provided comments is a partition comment.
 *
 * Helper function that iterates through comments to find if any matches the
 * partition comment criteria defined in options.
 *
 * @example
 *   // Comments that create partitions
 *   const comments = [
 *     { value: ' --- Components --- ', type: 'Line' },
 *     { value: ' Section: Utils ', type: 'Line' },
 *   ]
 *   hasPartitionComment({
 *     partitionByComment: '---',
 *     comments,
 *   }) // Returns: true
 *
 * @param params - Parameters for checking partition comments.
 * @param params.partitionByComment - Configuration for partition comments.
 * @param params.comments - Array of comments to check.
 * @returns True if at least one partition comment is found.
 */
function hasPartitionComment({
  partitionByComment,
  comments,
}: {
  partitionByComment: PartitionByCommentOption
  comments: TSESTree.Comment[]
}): boolean {
  return comments.some(comment =>
    isPartitionComment({
      partitionByComment,
      comment,
    }),
  )
}
