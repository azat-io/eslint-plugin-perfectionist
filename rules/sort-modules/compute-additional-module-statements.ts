import type { TSESTree } from '@typescript-eslint/types'

const BUILT_IN_MODULE_BLOCK_TYPES = ['SvelteScriptElement'] as const

/**
 * Computes the statement list of a node that must be analyzed as a module
 * block.
 *
 * Some parsers wrap top-level code in a custom node instead of putting it
 * directly in `Program.body`. Such a node can only be analyzed as a module
 * block if it holds an array of statements in its `body` property.
 *
 * @param node - The AST node to compute the module block body of.
 * @param additionalModuleBlockTypes - The node types to analyze as module
 *   blocks.
 * @returns The statements of the module block, or null if the node is not a
 *   module block.
 */
export function computeAdditionalModuleStatements(
  node: TSESTree.Node,
  additionalModuleBlockTypes: string[],
): TSESTree.ProgramStatement[] | null {
  let allAdditionalModuleBlockTypes = [
    ...BUILT_IN_MODULE_BLOCK_TYPES,
    ...additionalModuleBlockTypes,
  ]
  if (!allAdditionalModuleBlockTypes.includes(node.type)) {
    return null
  }

  if (!('body' in node)) {
    return null
  }

  if (!Array.isArray(node.body)) {
    return null
  }

  return node.body as TSESTree.ProgramStatement[]
}
