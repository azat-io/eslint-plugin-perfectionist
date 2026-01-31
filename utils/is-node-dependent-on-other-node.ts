import type { SortingNodeWithDependencies } from './sort-nodes-by-dependencies'

/**
 * Checks if one node has a dependency on another node.
 *
 * Determines whether sortingNode1 depends on sortingNode2 by checking if any of
 * sortingNode1's dependency names match any of sortingNode2's dependencies.
 * This is used in dependency-aware sorting to ensure that dependent nodes are
 * placed after their dependencies.
 *
 * Returns false for self-dependency (when both nodes are the same) to prevent
 * circular dependency issues.
 *
 * @example
 *
 * ```ts
 * const nodeA = {
 *   name: 'userService',
 *   dependencies: ['userService'],
 *   dependencyNames: ['logger', 'database'],
 * }
 *
 * const nodeB = {
 *   name: 'logger',
 *   dependencies: ['logger'],
 *   dependencyNames: [],
 * }
 *
 * isNodeDependentOnOtherNode(nodeA, nodeB)
 * // Returns: true (userService depends on logger)
 *
 * isNodeDependentOnOtherNode(nodeB, nodeA)
 * // Returns: false (logger doesn't depend on userService)
 *
 * isNodeDependentOnOtherNode(nodeA, nodeA)
 * // Returns: false (self-dependency check)
 * ```
 *
 * @param sortingNode1 - The node to check for dependencies.
 * @param sortingNode2 - The potential dependency node.
 * @returns True if sortingNode1 depends on sortingNode2, false otherwise.
 */
export function isNodeDependentOnOtherNode(
  sortingNode1: Pick<
    SortingNodeWithDependencies,
    'dependencyNames' | 'dependencies'
  >,
  sortingNode2: Pick<
    SortingNodeWithDependencies,
    'dependencyNames' | 'dependencies'
  >,
): boolean {
  if (sortingNode1 === sortingNode2) {
    return false
  }
  return sortingNode1.dependencyNames.some(dependency =>
    sortingNode2.dependencies.includes(dependency),
  )
}
