import type { TSESTree } from '@typescript-eslint/types'
import type { TSESLint } from '@typescript-eslint/utils'

import { AST_NODE_TYPES } from '@typescript-eslint/utils'

import type { NodeNameDetails, Modifier, Selector } from '../types'
import type { RegexOption } from '../../../types/common-options'

import {
  computeAccessibilityModifier,
  computeDecoratedModifier,
  computeAbstractModifier,
  computeOptionalModifier,
  computeOverrideModifier,
  computeReadonlyModifier,
  computeStaticModifier,
  computeAsyncModifier,
} from './common-modifiers'
import { computeMethodOrPropertyNameDetails } from './compute-method-or-property-name-details'
import { computeDependencyName } from '../compute-dependency-name'
import { computeDependencies } from '../compute-dependencies'

/**
 * Computes details related to a property.
 *
 * @param params - Parameters object.
 * @param params.isDecorated - Whether the accessor is decorated.
 * @param params.property - The property node to compute information for.
 * @param params.ignoreCallbackDependenciesPatterns - Patterns to ignore when
 *   computing dependencies.
 * @param params.useExperimentalDependencyDetection - Whether to use
 *   experimental dependency detection.
 * @param params.sourceCode - The source code object.
 * @param params.className - The name of the class containing the property.
 * @returns An object containing various details about the property.
 */
export function computePropertyDetails({
  ignoreCallbackDependenciesPatterns,
  useExperimentalDependencyDetection,
  isDecorated,
  sourceCode,
  className,
  property,
}: {
  property: TSESTree.TSAbstractPropertyDefinition | TSESTree.PropertyDefinition
  ignoreCallbackDependenciesPatterns: RegexOption
  useExperimentalDependencyDetection: boolean
  sourceCode: TSESLint.SourceCode
  className: undefined | string
  isDecorated: boolean
}): {
  memberValue: undefined | string
  nameDetails: NodeNameDetails
  dependencyNames: string[]
  dependencies: string[]
  modifiers: Modifier[]
  selectors: Selector[]
  isStatic: boolean
} {
  let nameDetails = computeMethodOrPropertyNameDetails(property, sourceCode)
  let modifiers = computeModifiers({
    hasPrivateHash: nameDetails.hasPrivateHash,
    isDecorated,
    property,
  })

  return {
    dependencyNames: [
      computeDependencyName({
        nodeNameWithoutStartingHash: nameDetails.nameWithoutStartingHash,
        hasPrivateHash: nameDetails.hasPrivateHash,
        isStatic: modifiers.includes('static'),
      }),
    ],
    dependencies: computePropertyDependencies({
      ignoreCallbackDependenciesPatterns,
      useExperimentalDependencyDetection,
      className,
      property,
    }),
    memberValue:
      !isFunctionExpression(property.value) && property.value
        ? sourceCode.getText(property.value)
        : undefined,
    selectors: computeSelectors(property),
    isStatic: property.static,
    nameDetails,
    modifiers,
  }
}

function computeModifiers({
  hasPrivateHash,
  isDecorated,
  property,
}: {
  property: TSESTree.TSAbstractPropertyDefinition | TSESTree.PropertyDefinition
  hasPrivateHash: boolean
  isDecorated: boolean
}): Modifier[] {
  return [
    ...computeStaticModifier(property),
    ...computeDeclareModifier(),
    ...computeAbstractModifier(property),
    ...computeDecoratedModifier(isDecorated),
    ...computeOverrideModifier(property),
    ...computeReadonlyModifier(property),
    ...computeAccessibilityModifier({
      hasPrivateHash,
      node: property,
    }),
    ...computeOptionalModifier(property),
    ...computeAsyncModifierIfFunctionProperty(),
  ]

  function computeDeclareModifier(): Modifier[] {
    return property.declare ? ['declare'] : []
  }
  function computeAsyncModifierIfFunctionProperty(): Modifier[] {
    if (!isFunctionExpression(property.value)) {
      return []
    }

    return computeAsyncModifier(property.value)
  }
}

function computePropertyDependencies({
  ignoreCallbackDependenciesPatterns,
  useExperimentalDependencyDetection,
  className,
  property,
}: {
  property: TSESTree.TSAbstractPropertyDefinition | TSESTree.PropertyDefinition
  ignoreCallbackDependenciesPatterns: RegexOption
  useExperimentalDependencyDetection: boolean
  className: undefined | string
}): string[] {
  if (isFunctionExpression(property.value)) {
    return []
  }
  if (!property.value) {
    return []
  }

  return computeDependencies({
    ignoreCallbackDependenciesPatterns,
    useExperimentalDependencyDetection,
    isMemberStatic: property.static,
    expression: property.value,
    className,
  })
}

function computeSelectors(
  property: TSESTree.TSAbstractPropertyDefinition | TSESTree.PropertyDefinition,
): Selector[] {
  return [...computeFunctionPropertySelector(), 'property']

  function computeFunctionPropertySelector(): Selector[] {
    return isFunctionExpression(property.value) ? ['function-property'] : []
  }
}

function isFunctionExpression(
  node: TSESTree.Node | null,
): node is TSESTree.ArrowFunctionExpression | TSESTree.FunctionExpression {
  if (!node) {
    return false
  }
  return (
    node.type === AST_NODE_TYPES.ArrowFunctionExpression ||
    node.type === AST_NODE_TYPES.FunctionExpression
  )
}
