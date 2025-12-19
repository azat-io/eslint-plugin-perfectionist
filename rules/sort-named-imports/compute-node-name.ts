import type { TSESTree } from '@typescript-eslint/types'

/**
 * Computes the name of an import specifier node.
 *
 * @param node - The import specifier node.
 * @param ignoreAlias - Whether to ignore the alias and use the local name.
 * @returns The computed name of the import specifier.
 */
export function computeNodeName(
  node: TSESTree.ImportClause,
  ignoreAlias: boolean,
): string {
  let { name } = node.local

  if (node.type === 'ImportSpecifier' && ignoreAlias) {
    if (node.imported.type === 'Identifier') {
      ;({ name } = node.imported)
    } else {
      name = node.imported.value
    }
  }
  return name
}
