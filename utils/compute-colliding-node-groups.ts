import type { SortingNode } from '../types/sorting-node'

/**
 * Parameters for computing colliding node groups.
 *
 * @template T - Type of sorting node.
 */
interface ComputeCollidingNodeGroupsParameters<T extends SortingNode> {
  /**
   * Computes the collision key for a node. Nodes sharing the same key are
   * considered to collide at runtime. Returning null excludes the node from
   * collision detection.
   */
  computeCollisionKey(node: T): string | null

  /**
   * Whether to exclude ESLint-disabled nodes from collision groups. Disabled
   * nodes keep their original positions during sorting, so they never
   * participate in collision-order restoration.
   */
  ignoreEslintDisabledNodes: boolean

  /**
   * Nodes to check, in source order.
   */
  nodes: T[]
}

/**
 * Groups nodes whose keys provably collide at runtime.
 *
 * Buckets nodes by their rule-supplied collision key, skipping nodes without a
 * statically-known key and, when requested, ESLint-disabled nodes. Only buckets
 * containing at least two nodes are returned, each preserving source order.
 *
 * Used together with `restoreCollidingNodesOrder` to prevent autofixes from
 * reordering members whose keys overwrite each other at runtime.
 *
 * @example
 *
 * ```ts
 * // Map entries: [[16, 'sixteen'], [0x10, 'hex'], [1, 'one']]
 * computeCollidingNodeGroups({
 *   computeCollisionKey,
 *   ignoreEslintDisabledNodes: false,
 *   nodes,
 * })
 * // Returns: [[node16, node0x10]] (both keys evaluate to the number 16)
 * ```
 *
 * @template T - Type of sorting node.
 * @param params - Parameters for collision detection.
 * @returns Groups of colliding nodes in source order.
 */
export function computeCollidingNodeGroups<T extends SortingNode>({
  ignoreEslintDisabledNodes,
  computeCollisionKey,
  nodes,
}: ComputeCollidingNodeGroupsParameters<T>): T[][] {
  let nodesByCollisionKey = new Map<string, T[]>()
  for (let node of nodes) {
    if (ignoreEslintDisabledNodes && node.isEslintDisabled) {
      continue
    }
    let collisionKey = computeCollisionKey(node)
    if (collisionKey === null) {
      continue
    }
    let collidingNodes = nodesByCollisionKey.get(collisionKey) ?? []
    collidingNodes.push(node)
    nodesByCollisionKey.set(collisionKey, collidingNodes)
  }
  return [...nodesByCollisionKey.values()].filter(
    collidingNodes => collidingNodes.length >= 2,
  )
}
