import type { TSESLint } from '@typescript-eslint/utils'
import type { TSESTree } from '@typescript-eslint/types'

import { AST_NODE_TYPES } from '@typescript-eslint/utils'

import { computeStaticKeyValue } from '../../utils/compute-static-key-value'

/**
 * Computes the collision key of a Map element for duplicate-key detection.
 *
 * For array expressions (key-value pairs), the runtime Map key is the first
 * element. Statically-known keys are tagged with their type so that entries
 * such as `16` and `0x10` collide while `16` and `'16'` do not, matching
 * SameValueZero key equality. Dynamic keys collide only on identical source
 * text. Elements that are not key-value pairs return null.
 *
 * @param params - Parameters object.
 * @param params.sourceCode - The ESLint source code object.
 * @param params.node - The Map element expression.
 * @returns The collision key, or null when the element has no detectable key.
 */
export function computeCollisionKey({
  sourceCode,
  node,
}: {
  sourceCode: TSESLint.SourceCode
  node: TSESTree.Expression
}): string | null {
  if (node.type !== AST_NODE_TYPES.ArrayExpression) {
    return null
  }

  let [left] = node.elements

  if (!left) {
    return computeStaticValueCollisionKey(undefined)
  }

  if (left.type !== AST_NODE_TYPES.SpreadElement) {
    let staticKeyValue = computeStaticKeyValue(left)
    if (staticKeyValue) {
      return computeStaticValueCollisionKey(staticKeyValue.value)
    }
  }

  return `text:${sourceCode.getText(left)}`
}

/**
 * Builds the collision key of a statically-known Map key value.
 *
 * The value is tagged with its type so that keys equal under SameValueZero
 * collide (an omitted key and `void 0` both produce the `undefined` key) while
 * keys of different types such as `16` and `'16'` do not.
 *
 * @param value - Statically-known runtime key value.
 * @returns The type-tagged collision key shared by all spellings of the value.
 */
function computeStaticValueCollisionKey(value: unknown): string {
  return `value:${typeof value}:${String(value)}`
}
