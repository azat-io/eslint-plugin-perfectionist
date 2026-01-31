import type { SortingNodeWithDependencies } from './sort-nodes-by-dependencies'

/**
 * Detects nodes that are part of circular dependency chains.
 *
 * Uses a depth-first search (DFS) algorithm with three-color marking to
 * identify cycles in the dependency graph. When a cycle is detected, all nodes
 * in that cycle are added to the result set.
 *
 * The algorithm tracks three states for each node:
 *
 * - Not visited: Node hasn't been processed yet
 * - Visiting: Currently in the DFS path (gray in three-color marking)
 * - Visited: Completely processed (black in three-color marking).
 *
 * A cycle is detected when we encounter a node that is already in the
 * "visiting" state, meaning we've found a back edge in the graph.
 *
 * @example
 *
 * ```ts
 * const nodes = [
 *   { name: 'A', dependencies: ['B'], dependencyNames: ['A'] },
 *   { name: 'B', dependencies: ['C'], dependencyNames: ['B'] },
 *   { name: 'C', dependencies: ['A'], dependencyNames: ['C'] },
 * ]
 * const circularNodes = computeNodesInCircularDependencies(nodes)
 * // Returns: Set containing all three nodes (A, B, C)
 * ```
 *
 * @template T - Type of sorting node with dependencies.
 * @param elements - Array of nodes with dependency information.
 * @returns Set of nodes that participate in circular dependencies.
 */
export function computeNodesInCircularDependencies<
  T extends Pick<
    SortingNodeWithDependencies,
    'dependencyNames' | 'dependencies'
  >,
>(elements: T[]): Set<T> {
  let elementsInCycles = new Set<T>()
  let visitingElements = new Set<T>()
  let visitedElements = new Set<T>()

  /**
   * Performs depth-first search to detect cycles starting from the given
   * element.
   *
   * Recursively traverses the dependency graph, maintaining a path of the
   * current traversal. If a node in the current path is encountered again, a
   * cycle is detected and all nodes in the cycle are marked.
   *
   * @param element - Current node being visited.
   * @param path - Array of nodes in the current DFS path.
   */
  function depthFirstSearch(element: T, path: T[]): void {
    if (visitedElements.has(element)) {
      return
    }

    if (visitingElements.has(element)) {
      let cycleStartIndex = path.indexOf(element)
      /* v8 ignore else -- @preserve Visiting path already contains the element when this branch executes. */
      if (cycleStartIndex !== -1) {
        for (let cycleElements of path.slice(cycleStartIndex)) {
          elementsInCycles.add(cycleElements)
        }
      }
      return
    }

    visitingElements.add(element)
    path.push(element)

    for (let dependency of element.dependencies) {
      let dependencyElement = elements
        .filter(currentElement => currentElement !== element)
        .find(currentElement =>
          currentElement.dependencyNames.includes(dependency),
        )
      /* v8 ignore next -- @preserve Dependencies are pre-filtered; missing entries are defensive fallback. */
      if (dependencyElement) {
        depthFirstSearch(dependencyElement, [...path])
      }
    }

    visitingElements.delete(element)
    visitedElements.add(element)
  }

  for (let element of elements) {
    if (!visitedElements.has(element)) {
      depthFirstSearch(element, [])
    }
  }

  return elementsInCycles
}
