import type { TSESTree } from '@typescript-eslint/types'

/**
 * Computes the name of an export specifier node.
 *
 * @param node - The export specifier node.
 * @param ignoreAlias - Whether to ignore the alias and use the local name.
 * @returns The computed name of the export specifier.
 */
export function computeNodeName(
  node: TSESTree.ExportSpecifier,
  ignoreAlias: boolean,
): string {
  if (ignoreAlias) {
    if (node.local.type === 'Identifier') {
      return node.local.name
    }
    // Should not be allowed in typescript, but is possible according to
    // The AST
    // Ex: `export { 'literal' as local } from './import'`
    return node.local.value
  }

  if (node.exported.type === 'Identifier') {
    return node.exported.name
  }
  return node.exported.value
}
