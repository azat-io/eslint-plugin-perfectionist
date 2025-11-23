import type { TSESTree } from '@typescript-eslint/types'

import { describe, expect, it } from 'vitest'

import { getNodeDecorators } from '../../utils/get-node-decorators'

type NodeWithDecoratorsParameter = Parameters<typeof getNodeDecorators>[0]

describe('get-node-decorators', () => {
  it('returns existing decorators from the node when present', () => {
    let decorator = createDecorator('sealed')
    let node = createNodeWithDecorators([decorator])

    expect(getNodeDecorators(node)).toEqual([decorator])
  })

  it('returns an empty array when decorators are missing', () => {
    let node = createNodeWithDecorators()

    expect(getNodeDecorators(node)).toEqual([])
  })

  function createDecorator(name: string): TSESTree.Decorator {
    return {
      expression: {
        type: 'Identifier',
        name,
      },
      type: 'Decorator',
    } as unknown as TSESTree.Decorator
  }

  function createNodeWithDecorators(
    decorators?: TSESTree.Decorator[],
  ): NodeWithDecoratorsParameter {
    if (decorators) {
      return {
        type: 'ClassDeclaration',
        decorators,
      } as unknown as NodeWithDecoratorsParameter
    }
    return {
      type: 'ClassDeclaration',
    } as unknown as NodeWithDecoratorsParameter
  }
})
