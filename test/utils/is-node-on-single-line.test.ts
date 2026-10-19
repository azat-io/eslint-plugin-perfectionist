import type { TSESTree } from '@typescript-eslint/types'

import { describe, expect, it } from 'vitest'

import { isNodeOnSingleLine } from '../../utils/is-node-on-single-line'

describe('isNodeOnSingleLine', () => {
  it('should return true if the node is on a single line', () => {
    let node = createNode({ endLine: 1 })

    let result = isNodeOnSingleLine(node)

    expect(result).toBe(true)
  })

  it('should return false if the node is on multiple lines', () => {
    let node = createNode({ endLine: 2 })

    let result = isNodeOnSingleLine(node)

    expect(result).toBe(false)
  })

  function createNode({ endLine }: { endLine: number }): TSESTree.Node {
    return {
      loc: {
        end: { line: endLine, column: 0 },
        start: { column: 0, line: 1 },
      },
    } as TSESTree.Node
  }
})
