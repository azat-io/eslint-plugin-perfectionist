import type { SortingNode } from '../typings'

export let compareDependencies = <T extends SortingNode>(nodes: T[]): T[] => {
  let result: T[] = []
  let visitedNodes = new Set<SortingNode>()
  let inProcessNodes = new Set<SortingNode>()

  let visitNode = (node: T) => {
    if (visitedNodes.has(node)) {
      return
    }
    if (inProcessNodes.has(node)) {
      // Circular dependency
      return
    }
    inProcessNodes.add(node)
    let dependentNodes = nodes.filter(n =>
      (node.dependencies ?? []).includes(n.dependencyName ?? n.name),
    )
    for (let dependentNode of dependentNodes) {
      visitNode(dependentNode)
    }
    visitedNodes.add(node)
    inProcessNodes.delete(node)
    result.push(node)
  }

  for (let node of nodes) {
    visitNode(node)
  }

  return result
}
