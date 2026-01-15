import type { TSESTree } from '@typescript-eslint/types'

import type {
  OverloadSignatureImplementation,
  OverloadSignatureGroup,
} from './overload-signature-group'
import type { SortingNode } from '../../types/sorting-node'

import { buildSortingNodeByNodeMap } from '../build-sorting-node-by-node-map'

/**
 * Populate sorting node groups with their corresponding overload signature
 * implementations fields if they exist.
 *
 * @param params - The parameters.
 * @param params.overloadSignatureGroups - List of overload signature groups.
 * @param params.sortingNodeGroups - List of sorting node groups.
 * @returns The populated sorting node groups.
 */
export function populateSortingNodeGroupsWithOverloadSignature<
  OverloadSignatureNode extends TSESTree.Node,
  T extends SortingNode,
>({
  overloadSignatureGroups,
  sortingNodeGroups,
}: {
  overloadSignatureGroups: OverloadSignatureGroup<OverloadSignatureNode>[]
  sortingNodeGroups: T[][]
}): (OverloadSignatureImplementation<OverloadSignatureNode> & T)[][] {
  return sortingNodeGroups.map(sortingNodes =>
    populateSortingNodeGroupWithOverloadSignature({
      overloadSignatureGroups,
      sortingNodes,
    }),
  )
}

function buildUpdatedSortingNode<
  OverloadSignatureNode extends TSESTree.Node,
  T extends SortingNode,
>({
  overloadSignatureGroups,
  sortingNodeByNode,
  sortingNode,
}: {
  overloadSignatureGroups: OverloadSignatureGroup<OverloadSignatureNode>[]
  sortingNodeByNode: Map<T['node'], T>
  sortingNode: T
}): OverloadSignatureImplementation<OverloadSignatureNode> & T {
  let overloadSignatureImplementation = computeOverloadSignatureImplementation({
    overloadSignatureGroups,
    node: sortingNode.node,
  })

  if (!overloadSignatureImplementation) {
    return {
      ...sortingNode,
      overloadSignatureImplementation: null,
    }
  }

  let implementationSortingNode = sortingNodeByNode.get(
    overloadSignatureImplementation,
  )
  /* v8 ignore if -- @preserve Unsure how we can reach that case */
  if (!implementationSortingNode) {
    return {
      ...sortingNode,
      overloadSignatureImplementation: null,
    }
  }

  let {
    addSafetySemicolonWhenInline,
    isEslintDisabled,
    node,
    ...relevantImplementationSortingNodeFields
  } = implementationSortingNode

  return {
    ...sortingNode,
    ...relevantImplementationSortingNodeFields,
    overloadSignatureImplementation,
  }
}

function populateSortingNodeGroupWithOverloadSignature<
  OverloadSignatureNode extends TSESTree.Node,
  T extends SortingNode,
>({
  overloadSignatureGroups,
  sortingNodes,
}: {
  overloadSignatureGroups: OverloadSignatureGroup<OverloadSignatureNode>[]
  sortingNodes: T[]
}): (OverloadSignatureImplementation<OverloadSignatureNode> & T)[] {
  let sortingNodeByNode = buildSortingNodeByNodeMap(sortingNodes)

  return sortingNodes.map(sortingNode =>
    buildUpdatedSortingNode({
      overloadSignatureGroups,
      sortingNodeByNode,
      sortingNode,
    }),
  )
}

function computeOverloadSignatureImplementation<T extends TSESTree.Node>({
  overloadSignatureGroups,
  node,
}: {
  overloadSignatureGroups: OverloadSignatureGroup<T>[]
  node: TSESTree.Node
}): null | T {
  let matchingOverloadSignature = overloadSignatureGroups.find(
    overloadSignatureGroup =>
      overloadSignatureGroup.doesNodeBelongToGroup(node),
  )
  if (!matchingOverloadSignature) {
    return null
  }

  return matchingOverloadSignature.implementation
}
