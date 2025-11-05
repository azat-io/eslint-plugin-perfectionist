import type { TSESTree } from '@typescript-eslint/types'

import { describe, expect, it } from 'vitest'

import { isNodeOnSingleLine } from '../../utils/is-node-on-single-line'

describe('isNodeOnSingleLine', () => {
  it('should return true if the node is on a single line', () => {
    let node = createNode({
      startLine: 1,
      endLine: 1,
    })

    let result = isNodeOnSingleLine(node)

    expect(result).toBeTruthy()
  })

  it('should return false if the node is on multiple lines', () => {
    let node = createNode({
      startLine: 1,
      endLine: 2,
    })

    let result = isNodeOnSingleLine(node)

    expect(result).toBeFalsy()
  })

  function createNode({
    startLine,
    endLine,
  }: {
    startLine: number
    endLine: number
  }): TSESTree.Node {
    return {
      loc: {
        start: { line: startLine, column: 0 },
        end: { line: endLine, column: 0 },
      },
    } as TSESTree.Node
  }
})
