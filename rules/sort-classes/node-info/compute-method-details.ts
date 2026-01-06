import type { TSESTree } from '@typescript-eslint/types'
import type { TSESLint } from '@typescript-eslint/utils'

import { AST_NODE_TYPES } from '@typescript-eslint/utils'

import type { Modifier, Selector } from '../types'

import {
  computeAccessibilityModifier,
  computeDecoratedModifier,
  computeAbstractModifier,
  computeOptionalModifier,
  computeOverrideModifier,
  computeStaticModifier,
  computeAsyncModifier,
} from './common-modifiers'
import { computeMethodOrPropertyNameDetails } from './compute-method-or-property-name-details'
import { UnreachableCaseError } from '../../../utils/unreachable-case-error'

/**
 * Computes details related to a method.
 *
 * @param params - Parameters object.
 * @param params.isDecorated - Whether the accessor is decorated.
 * @param params.method - The method node to compute information for.
 * @param params.sourceCode - The source code object.
 * @param params.hasParentDeclare - Whether the parent class is a declare class.
 * @returns An object containing various details about the method.
 */
export function computeMethodDetails({
  hasParentDeclare,
  isDecorated,
  sourceCode,
  method,
}: {
  method: TSESTree.TSAbstractMethodDefinition | TSESTree.MethodDefinition
  sourceCode: TSESLint.SourceCode
  hasParentDeclare: boolean
  isDecorated: boolean
}): {
  addSafetySemicolonWhenInline: boolean
  modifiers: Modifier[]
  selectors: Selector[]
  name: string
} {
  let { hasPrivateHash, name } = computeMethodOrPropertyNameDetails(
    method,
    sourceCode,
  )

  return {
    addSafetySemicolonWhenInline: shouldAddSafetySemicolonWhenInline({
      hasParentDeclare,
      method,
    }),
    modifiers: computeModifiers({
      hasPrivateHash,
      isDecorated,
      method,
    }),
    selectors: computeSelectors(method),
    name,
  }
}

function computeSelectors(
  method: TSESTree.TSAbstractMethodDefinition | TSESTree.MethodDefinition,
): Selector[] {
  return [...computeSetterOrConstructorSelector(), 'method']

  function computeSetterOrConstructorSelector(): Selector[] {
    switch (method.kind) {
      case 'constructor':
        return ['constructor']
      case 'method':
        return []
      case 'set':
        return ['set-method']
      case 'get':
        return ['get-method']
      /* v8 ignore next 2 -- @preserve Exhaustive guard. */
      default:
        throw new UnreachableCaseError(method.kind)
    }
  }
}

function computeModifiers({
  hasPrivateHash,
  isDecorated,
  method,
}: {
  method: TSESTree.TSAbstractMethodDefinition | TSESTree.MethodDefinition
  hasPrivateHash: boolean
  isDecorated: boolean
}): Modifier[] {
  return [
    ...computeStaticModifier(method),
    ...computeAbstractModifier(method),
    ...computeDecoratedModifier(isDecorated),
    ...computeOverrideModifier(method),
    ...computeAccessibilityModifier({
      hasPrivateHash,
      node: method,
    }),
    ...computeOptionalModifier(method),
    ...computeAsyncModifier(method.value),
  ]
}

function shouldAddSafetySemicolonWhenInline({
  hasParentDeclare,
  method,
}: {
  method: TSESTree.TSAbstractMethodDefinition | TSESTree.MethodDefinition
  hasParentDeclare: boolean
}): boolean {
  switch (method.type) {
    case AST_NODE_TYPES.TSAbstractMethodDefinition:
      return true
    case AST_NODE_TYPES.MethodDefinition:
      return hasParentDeclare
    /* v8 ignore next 2 -- @preserve Exhaustive guard. */
    default:
      throw new UnreachableCaseError(method)
  }
}
