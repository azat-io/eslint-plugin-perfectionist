import type { TSESTree } from '@typescript-eslint/utils'

import { AST_NODE_TYPES } from '@typescript-eslint/utils'

import type { SortModulesNode } from './types'

import { OverloadSignatureGroup } from '../../utils/overload-signature/overload-signature-group'
import { isSortable } from '../../utils/is-sortable'

interface FunctionDetails {
  isImplementation: boolean
  node: SortModulesNode
  name: string
}

/**
 * Returns a list of groups of overload signatures.
 *
 * @param nodes - The nodes to process.
 * @returns A list of overload signature groups.
 */
export function computeOverloadSignatureGroups(
  nodes: SortModulesNode[],
): OverloadSignatureGroup<SortModulesNode>[] {
  let functionDetailsByName = new Map<string, FunctionDetails[]>()

  for (let node of nodes) {
    let functionDetails = computeNodeFunctionDetails(node)
    if (!functionDetails) {
      continue
    }

    let functionDetailsArray = functionDetailsByName.get(functionDetails.name)

    if (!functionDetailsArray) {
      functionDetailsArray = []
      functionDetailsByName.set(functionDetails.name, functionDetailsArray)
    }
    functionDetailsArray.push({
      ...functionDetails,
      node,
    })
  }

  /* Ignore groups that only have one function. */
  let overloadSignatureGroups: OverloadSignatureGroup<SortModulesNode>[] = []
  for (let functionDetailsArray of functionDetailsByName.values()) {
    if (isSortable(functionDetailsArray)) {
      overloadSignatureGroups.push(
        buildOverloadSignatureGroup(functionDetailsArray),
      )
    }
  }
  return overloadSignatureGroups
}

function computeNodeFunctionDetails(
  node:
    | TSESTree.DefaultExportDeclarations
    | TSESTree.NamedExportDeclarations
    | SortModulesNode,
): Omit<FunctionDetails, 'node'> | null {
  let currentNode:
    | TSESTree.DefaultExportDeclarations
    | TSESTree.NamedExportDeclarations
    | SortModulesNode = node
  while (
    currentNode.type === AST_NODE_TYPES.ExportDefaultDeclaration ||
    currentNode.type === AST_NODE_TYPES.ExportNamedDeclaration
  ) {
    /* v8 ignore start -- @preserve Unsure how we can reach that case */
    if (!currentNode.declaration) {
      return null
    }
    /* v8 ignore stop -- @preserve Unsure how we can reach that case */
    currentNode = currentNode.declaration
  }
  switch (currentNode.type) {
    case AST_NODE_TYPES.FunctionDeclaration:
    case AST_NODE_TYPES.TSDeclareFunction:
      return computeFunctionDetails(currentNode)
    default:
      return null
  }

  function computeFunctionDetails(
    functionNode: TSESTree.FunctionDeclaration | TSESTree.TSDeclareFunction,
  ): Omit<FunctionDetails, 'node'> | null {
    /* v8 ignore if -- @preserve Unsure how we can reach that case */
    if (!functionNode.id) {
      return null
    }

    return {
      isImplementation:
        functionNode.type === AST_NODE_TYPES.FunctionDeclaration,
      name: functionNode.id.name,
    }
  }
}

function buildOverloadSignatureGroup(
  functionDetailsArray: FunctionDetails[],
): OverloadSignatureGroup<SortModulesNode> {
  let implementation = (
    functionDetailsArray.find(isFunctionImplementation) ??
    functionDetailsArray.at(-1)!
  ).node

  let overloadSignatures = functionDetailsArray
    .filter(functionDetails => !isFunctionImplementation(functionDetails))
    .map(functionDetails => functionDetails.node)

  return new OverloadSignatureGroup({
    overloadSignatures,
    implementation,
  })

  function isFunctionImplementation(functionDetails: FunctionDetails): boolean {
    return functionDetails.isImplementation
  }
}
