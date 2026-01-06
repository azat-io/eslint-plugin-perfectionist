import type { TSESTree } from '@typescript-eslint/types'
import type { TSESLint } from '@typescript-eslint/utils'

import type { Modifier, Selector } from '../types'

import {
  computeReadonlyModifier,
  computeStaticModifier,
} from './common-modifiers'

/**
 * Computes details related to an index-signature.
 *
 * @param params - Parameters object.
 * @param params.indexSignature - The index signature node to compute
 *   information for.
 * @param params.sourceCode - The source code object.
 * @returns An object containing various details about the index-signature.
 */
export function computeIndexSignatureDetails({
  indexSignature,
  sourceCode,
}: {
  indexSignature: TSESTree.TSIndexSignature
  sourceCode: TSESLint.SourceCode
}): {
  modifiers: Modifier[]
  selectors: Selector[]
  name: string
} {
  return {
    name: sourceCode.text.slice(
      indexSignature.range.at(0),
      indexSignature.typeAnnotation?.range.at(0) ?? indexSignature.range.at(1),
    ),
    modifiers: computeModifiers(indexSignature),
    selectors: ['index-signature'],
  }
}

function computeModifiers(
  indexSignature: TSESTree.TSIndexSignature,
): Modifier[] {
  return [
    ...computeStaticModifier(indexSignature),
    ...computeReadonlyModifier(indexSignature),
  ]
}
