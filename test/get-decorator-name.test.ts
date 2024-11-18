import type { TSESTree } from '@typescript-eslint/types'

import { AST_NODE_TYPES } from '@typescript-eslint/types'
import { describe, expect, it } from 'vitest'

import { getDecoratorName } from '../utils/get-decorator-name'

describe('get-decorator-name', () => {
  describe('call expressions', () => {
    it('returns the decorator name', () => {
      expect(
        getDecoratorName({
          expression: {
            callee: {
              type: AST_NODE_TYPES.Identifier,
              name: 'decoratorName',
            },
            type: AST_NODE_TYPES.CallExpression,
          },
          type: AST_NODE_TYPES.Decorator,
        } as TSESTree.Decorator),
      ).toBe('decoratorName')
    })

    it('throws an error if callee type is not Identifier', () => {
      expect(() =>
        getDecoratorName({
          expression: {
            callee: {
              name: 'decoratorName',
            },
            type: AST_NODE_TYPES.CallExpression,
          },
          type: AST_NODE_TYPES.Decorator,
        } as TSESTree.Decorator),
      ).toThrow(
        "Unexpected decorator expression's callee type. Please 'report this " +
          'issue here: ' +
          'https://github.com/azat-io/eslint-plugin-perfectionist/issues',
      )
    })
  })

  it('throws an error if expression type is invalid', () => {
    expect(() =>
      getDecoratorName({
        expression: {
          type: AST_NODE_TYPES.ArrayExpression,
        },
        type: AST_NODE_TYPES.Decorator,
      } as TSESTree.Decorator),
    ).toThrow(
      'Unexpected decorator expression type. Please report this issue here: ' +
        'https://github.com/azat-io/eslint-plugin-perfectionist/issues',
    )
  })

  it('returns the decorator name', () => {
    expect(
      getDecoratorName({
        expression: {
          type: AST_NODE_TYPES.Identifier,
          name: 'decoratorName',
        },
        type: AST_NODE_TYPES.Decorator,
      } as TSESTree.Decorator),
    ).toBe('decoratorName')
  })
})
