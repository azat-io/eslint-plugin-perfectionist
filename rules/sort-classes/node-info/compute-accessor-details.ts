import type { TSESTree } from '@typescript-eslint/types'
import type { TSESLint } from '@typescript-eslint/utils'

import type { NodeNameDetails, Modifier, Selector } from '../types'

import {
  computeAccessibilityModifier,
  computeDecoratedModifier,
  computeAbstractModifier,
  computeOverrideModifier,
  computeStaticModifier,
} from './common-modifiers'
import { computeMethodOrPropertyNameDetails } from './compute-method-or-property-name-details'
import { computeDependencyName } from '../compute-dependency-name'

/**
 * Computes details related to an accessor property.
 *
 * @param params - Parameters object.
 * @param params.isDecorated - Whether the accessor is decorated.
 * @param params.sourceCode - The source code object.
 * @param params.accessor - The accessor node to compute information for.
 * @returns An object containing various details about the accessor.
 */
export function computeAccessorDetails({
  isDecorated,
  sourceCode,
  accessor,
}: {
  accessor: TSESTree.TSAbstractAccessorProperty | TSESTree.AccessorProperty
  sourceCode: TSESLint.SourceCode
  isDecorated: boolean
}): {
  nameDetails: NodeNameDetails
  dependencyNames: string[]
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
    selectors: ['accessor-property'],
    isStatic: accessor.static,
    nameDetails,
    modifiers,
  }
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
