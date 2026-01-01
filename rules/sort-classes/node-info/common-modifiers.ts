import type { TSESTree } from '@typescript-eslint/types'

import { AST_NODE_TYPES } from '@typescript-eslint/utils'

import type { Modifier } from '../types'

import { UnreachableCaseError } from '../../../utils/unreachable-case-error'

type Property =
  | TSESTree.TSAbstractPropertyDefinition
  | TSESTree.PropertyDefinition
type Accessor = TSESTree.TSAbstractAccessorProperty | TSESTree.AccessorProperty
type Method = TSESTree.TSAbstractMethodDefinition | TSESTree.MethodDefinition

export function computeAbstractModifier(
  node: Accessor | Property | Method,
): Modifier[] {
  switch (node.type) {
    case AST_NODE_TYPES.TSAbstractPropertyDefinition:
    case AST_NODE_TYPES.TSAbstractMethodDefinition:
    case AST_NODE_TYPES.TSAbstractAccessorProperty:
      return ['abstract']
    case AST_NODE_TYPES.PropertyDefinition:
    case AST_NODE_TYPES.MethodDefinition:
    case AST_NODE_TYPES.AccessorProperty:
      return []
    /* v8 ignore next 2 -- @preserve Exhaustive guard. */
    default:
      throw new UnreachableCaseError(node)
  }
}

export function computeAccessibilityModifier({
  hasPrivateHash,
  node,
}: {
  node: Accessor | Property | Method
  hasPrivateHash: boolean
}): Modifier[] {
  if (hasPrivateHash) {
    return ['private']
  }

  switch (node.accessibility) {
    case 'protected':
      return ['protected']
    case 'private':
      return ['private']
    case undefined:
    case 'public':
      return ['public']
    /* v8 ignore next 2 -- @preserve Exhaustive guard. */
    default:
      throw new UnreachableCaseError(node.accessibility)
  }
}

export function computeAsyncModifier(
  node:
    | TSESTree.TSEmptyBodyFunctionExpression
    | TSESTree.ArrowFunctionExpression
    | TSESTree.FunctionExpression,
): Modifier[] {
  return node.async ? ['async'] : []
}

export function computeStaticModifier(
  node: TSESTree.TSIndexSignature | Accessor | Property | Method,
): Modifier[] {
  return node.static ? ['static'] : []
}

export function computeReadonlyModifier(
  node: TSESTree.TSIndexSignature | Property,
): Modifier[] {
  return node.readonly ? ['readonly'] : []
}

export function computeOverrideModifier(
  node: Accessor | Property | Method,
): Modifier[] {
  return node.override ? ['override'] : []
}

export function computeOptionalModifier(node: Property | Method): Modifier[] {
  return node.optional ? ['optional'] : []
}

export function computeDecoratedModifier(isDecorated: boolean): Modifier[] {
  return isDecorated ? ['decorated'] : []
}
