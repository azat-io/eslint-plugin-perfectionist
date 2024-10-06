import type { TSESTree } from '@typescript-eslint/types'

import { AST_NODE_TYPES } from '@typescript-eslint/types'

export const getDecoratorName = (decorator: TSESTree.Decorator) => {
  switch (decorator.expression.type) {
    case AST_NODE_TYPES.CallExpression:
      if (decorator.expression.callee.type !== AST_NODE_TYPES.Identifier) {
        throw new Error(
          "Unexpected decorator expression's callee type. Please 'report this " +
            'issue here: ' +
            'https://github.com/azat-io/eslint-plugin-perfectionist/issues',
        )
      }
      return decorator.expression.callee.name
    case AST_NODE_TYPES.Identifier:
      return decorator.expression.name
    default:
      throw new Error(
        'Unexpected decorator expression type. Please report this issue here: ' +
          'https://github.com/azat-io/eslint-plugin-perfectionist/issues',
      )
  }
}
