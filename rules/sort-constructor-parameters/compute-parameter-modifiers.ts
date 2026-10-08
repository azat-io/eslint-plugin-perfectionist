import type { TSESTree } from '@typescript-eslint/types'

import { AST_NODE_TYPES } from '@typescript-eslint/utils'

import type { Modifier } from './types'

import { UnreachableCaseError } from '../../utils/unreachable-case-error'
import { getNodeDecorators } from '../../utils/get-node-decorators'

type Parameter = Exclude<TSESTree.Parameter, TSESTree.RestElement>

/**
 * Computes the modifiers carried by a constructor parameter, ordered from most
 * to least important.
 *
 * Every parameter receives an accessibility modifier, defaulting to `public`
 * when none is declared (including plain parameters that are not parameter
 * properties).
 *
 * @param parameter - The constructor parameter node.
 * @returns The modifiers, ordered from most to least important.
 */
export function computeParameterModifiers(parameter: Parameter): Modifier[] {
  return [
    ...computeDecoratedModifier(parameter),
    ...computeOverrideModifier(parameter),
    ...computeReadonlyModifier(parameter),
    ...computeAccessibilityModifier(parameter),
    ...computeOptionalModifier(parameter),
  ]
}

function computeAccessibilityModifier(parameter: Parameter): Modifier[] {
  if (parameter.type !== AST_NODE_TYPES.TSParameterProperty) {
    return ['public']
  }

  switch (parameter.accessibility) {
    case 'protected':
      return ['protected']
    case 'private':
      return ['private']
    case undefined:
    case 'public':
      return ['public']
    /* v8 ignore next 2 -- @preserve Exhaustive guard. */
    default:
      throw new UnreachableCaseError(parameter.accessibility)
  }
}

function computeOptionalModifier(parameter: Parameter): Modifier[] {
  let isOptional = (
    parameter.type === AST_NODE_TYPES.TSParameterProperty ?
      parameter.parameter
    : parameter).optional
  return isOptional ? ['optional'] : []
}

function computeOverrideModifier(parameter: Parameter): Modifier[] {
  return (
      parameter.type === AST_NODE_TYPES.TSParameterProperty &&
        parameter.override
    ) ?
      ['override']
    : []
}

function computeReadonlyModifier(parameter: Parameter): Modifier[] {
  return (
      parameter.type === AST_NODE_TYPES.TSParameterProperty &&
        parameter.readonly
    ) ?
      ['readonly']
    : []
}

function computeDecoratedModifier(parameter: Parameter): Modifier[] {
  return getNodeDecorators(parameter).length > 0 ? ['decorated'] : []
}
