import type { TSESTree } from '@typescript-eslint/types'
import type { TSESLint } from '@typescript-eslint/utils'

import { AST_NODE_TYPES } from '@typescript-eslint/utils'

import type { SortObjectsSortingNode } from './types'

import { computeCollidingNodeGroups } from '../../utils/compute-colliding-node-groups'
import { computeStaticKeyValue } from '../../utils/compute-static-key-value'

/**
 * Computes groups of object members whose keys collide at runtime.
 *
 * Object property keys are normalized to property-key strings: non-computed
 * keys use the identifier name or the stringified literal value, computed keys
 * with statically-known values normalize the same way, and dynamic computed
 * keys collide only on identical source text.
 *
 * Accessor exception: a lone get/set pair with the same key is not a collision
 * (defining them in either order yields the same combined accessor). However,
 * an accessor together with a data property or method, two getters, or two
 * setters do collide.
 *
 * @param params - Parameters.
 * @param params.nodes - Object members in source order.
 * @param params.ignoreEslintDisabledNodes - Whether to exclude ESLint-disabled
 *   members from collision groups.
 * @param params.sourceCode - The source code object.
 * @returns Groups of colliding members in source order.
 */
export function computeObjectsCollidingNodeGroups({
  ignoreEslintDisabledNodes,
  sourceCode,
  nodes,
}: {
  ignoreEslintDisabledNodes: boolean
  nodes: SortObjectsSortingNode[]
  sourceCode: TSESLint.SourceCode
}): SortObjectsSortingNode[][] {
  return computeCollidingNodeGroups({
    computeCollisionKey: ({ node }) =>
      computeCollisionKey({ property: node, sourceCode }),
    ignoreEslintDisabledNodes,
    nodes,
  }).flatMap(splitCollidingNodeGroupByAccessors)
}

/**
 * Computes the collision key of an object member as a normalized property-key
 * string.
 *
 * @param params - Parameters.
 * @param params.property - The property to compute the collision key for.
 * @param params.sourceCode - The source code object.
 * @returns The collision key of the property.
 */
function computeCollisionKey({
  sourceCode,
  property,
}: {
  sourceCode: TSESLint.SourceCode
  property: TSESTree.Property
}): string {
  if (property.computed) {
    let staticKeyValue = computeStaticKeyValue(property.key)
    return staticKeyValue ?
        `key:${String(staticKeyValue.value)}`
      : `text:${sourceCode.getText(property.key)}`
  }
  switch (property.key.type) {
    case AST_NODE_TYPES.Identifier:
      return `key:${property.key.name}`
    case AST_NODE_TYPES.Literal:
      return `key:${String(property.key.value)}`
    /* v8 ignore next 2 -- @preserve Non-computed keys are identifiers or literals. */
    default:
      return `text:${sourceCode.getText(property.key)}`
  }
}

/**
 * Splits a colliding node group according to the accessor exception.
 *
 * A group containing a data property or method collides as a whole. A group
 * consisting only of accessors collides per accessor kind: two or more getters
 * collide, two or more setters collide, and a lone get/set pair does not.
 *
 * @param collidingNodeGroup - Group of members with the same collision key.
 * @returns Groups of members that must keep their source order.
 */
function splitCollidingNodeGroupByAccessors(
  collidingNodeGroup: SortObjectsSortingNode[],
): SortObjectsSortingNode[][] {
  let getters = collidingNodeGroup.filter(({ node }) => node.kind === 'get')
  let setters = collidingNodeGroup.filter(({ node }) => node.kind === 'set')
  if (getters.length + setters.length < collidingNodeGroup.length) {
    return [collidingNodeGroup]
  }
  return [getters, setters].filter(accessors => accessors.length >= 2)
}
