import type { TSESTree } from '@typescript-eslint/types'
import type { TSESLint } from '@typescript-eslint/utils'

import type { NodeNameDetails, Modifier, Selector } from '../types'
import type { RegexOption } from '../../../types/common-options'

import {
  computeAccessibilityModifier,
  computeDecoratedModifier,
  computeAbstractModifier,
  computeOverrideModifier,
  computeStaticModifier,
} from './common-modifiers'
import { computeMethodOrPropertyNameDetails } from './compute-method-or-property-name-details'
import { computeDependencyName } from '../compute-dependency-name'
import { isFunctionExpression } from './is-function-expression'
import { computeDependencies } from '../compute-dependencies'

/**
 * Computes details related to an accessor property.
 *
 * @param params - Parameters object.
 * @param params.isDecorated - Whether the accessor is decorated.
 * @param params.ignoreCallbackDependenciesPatterns - Patterns to ignore when
 *   computing dependencies.
 * @param params.useExperimentalDependencyDetection - Whether to use
 *   experimental dependency detection.
 * @param params.sourceCode - The source code object.
 * @param params.className - The name of the class containing the accessor.
 * @param params.accessor - The accessor node to compute information for.
 * @returns An object containing various details about the accessor.
 */
export function computeAccessorDetails({
  ignoreCallbackDependenciesPatterns,
  useExperimentalDependencyDetection,
  isDecorated,
  sourceCode,
  className,
  accessor,
}: {
  accessor: TSESTree.TSAbstractAccessorProperty | TSESTree.AccessorProperty
  ignoreCallbackDependenciesPatterns: RegexOption
  useExperimentalDependencyDetection: boolean
  sourceCode: TSESLint.SourceCode
  className: undefined | string
  isDecorated: boolean
}): {
  nameDetails: NodeNameDetails
  dependencyNames: string[]
  dependencies: string[]
  modifiers: Modifier[]
  selectors: Selector[]
  isStatic: boolean
} {
  let nameDetails = computeMethodOrPropertyNameDetails(accessor, sourceCode)
  let modifiers = computeModifiers({
    hasPrivateHash: nameDetails.hasPrivateHash,
    isDecorated,
    accessor,
  })

  return {
    dependencyNames: [
      computeDependencyName({
        nodeNameWithoutStartingHash: nameDetails.nameWithoutStartingHash,
        hasPrivateHash: nameDetails.hasPrivateHash,
        isStatic: modifiers.includes('static'),
      }),
    ],
    dependencies: computeAccessorDependencies({
      ignoreCallbackDependenciesPatterns,
      useExperimentalDependencyDetection,
      className,
      accessor,
    }),
    selectors: ['accessor-property'],
    isStatic: accessor.static,
    nameDetails,
    modifiers,
  }
}

function computeAccessorDependencies({
  ignoreCallbackDependenciesPatterns,
  useExperimentalDependencyDetection,
  className,
  accessor,
}: {
  accessor: TSESTree.TSAbstractAccessorProperty | TSESTree.AccessorProperty
  ignoreCallbackDependenciesPatterns: RegexOption
  useExperimentalDependencyDetection: boolean
  className: undefined | string
}): string[] {
  if (isFunctionExpression(accessor.value)) {
    return []
  }
  if (!accessor.value) {
    return []
  }

  return computeDependencies({
    ignoreCallbackDependenciesPatterns,
    useExperimentalDependencyDetection,
    isMemberStatic: accessor.static,
    expression: accessor.value,
    className,
  })
}

function computeModifiers({
  hasPrivateHash,
  isDecorated,
  accessor,
}: {
  accessor: TSESTree.TSAbstractAccessorProperty | TSESTree.AccessorProperty
  hasPrivateHash: boolean
  isDecorated: boolean
}): Modifier[] {
  return [
    ...computeStaticModifier(accessor),
    ...computeAbstractModifier(accessor),
    ...computeDecoratedModifier(isDecorated),
    ...computeOverrideModifier(accessor),
    ...computeAccessibilityModifier({
      hasPrivateHash,
      node: accessor,
    }),
  ]
}
