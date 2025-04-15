import { describe, expect, it } from 'vitest'

import type { SortingNodeWithDependencies } from '../../utils/sort-nodes-by-dependencies'

import { isNodeDependentOnOtherNode } from '../../utils/is-node-dependent-on-other-node'

describe('isNodeDependentOnOtherNode', () => {
  it('should return false if the two nodes are strictly equal', () => {
    let node = createNodeWithDependencies({
      dependencyNames: [],
      dependencies: [],
    })

    expect(isNodeDependentOnOtherNode(node, node)).toBeFalsy()
  })

  it('should return true if a dependency is among the dependency names', () => {
    let node1 = createNodeWithDependencies({
      dependencyNames: ['a', 'b'],
      dependencies: [],
    })
    let node2 = createNodeWithDependencies({
      dependencyNames: [],
      dependencies: ['b'],
    })

    expect(isNodeDependentOnOtherNode(node1, node2)).toBeTruthy()
  })

  let createNodeWithDependencies = ({
    dependencyNames,
    dependencies,
  }: {
    dependencyNames: string[]
    dependencies: string[]
  }): SortingNodeWithDependencies =>
    ({
      dependencyNames,
      dependencies,
    }) as SortingNodeWithDependencies
})
