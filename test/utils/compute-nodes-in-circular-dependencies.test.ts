import { describe, expect, it } from 'vitest'

import type { SortingNodeWithDependencies } from '../../utils/sort-nodes-by-dependencies'

import { computeNodesInCircularDependencies } from '../../utils/compute-nodes-in-circular-dependencies'

describe('computeNodesInCircularDependencies', () => {
  it('returns nodes in circular dependencies', () => {
    let nodeA = createTestNode('a')
    let nodeB = createTestNode('b')
    let nodeC = createTestNode('c')
    let nodeD = createTestNode('d')
    let nodeE = createTestNode('e')
    let nodeF = createTestNode('f')
    let nodeG = createTestNode('g')
    let nodeH = createTestNode('h')
    linkNodes([nodeA, nodeB, nodeC, nodeA])
    linkNodes([nodeD, nodeE])
    linkNodes([nodeF, nodeA])
    linkNodes([nodeC, nodeG])
    linkNodes([nodeC, nodeH, nodeA])

    expect(
      computeNodesInCircularDependencies([
        nodeA,
        nodeB,
        nodeC,
        nodeD,
        nodeE,
        nodeF,
        nodeG,
        nodeH,
      ]),
    ).toEqual(new Set([nodeA, nodeB, nodeC, nodeH]))
  })

  let createTestNode = (name: string): SortingNodeWithDependencies =>
    ({
      dependencies: [] as string[],
      dependencyNames: [name],
      name,
    }) as SortingNodeWithDependencies
})

let linkNodes = (linkedNodes: SortingNodeWithDependencies[]): void => {
  for (let i = 0; i < linkedNodes.length - 1; i++) {
    let node = linkedNodes[i]!
    let nextNode = linkedNodes[i + 1]!
    if (!node.dependencies.includes(nextNode.name)) {
      node.dependencies.push(nextNode.name)
    }
  }
}
