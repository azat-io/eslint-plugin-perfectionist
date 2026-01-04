import type { TSESTree } from '@typescript-eslint/utils'

import { AST_NODE_TYPES } from '@typescript-eslint/utils'

import { isSortable } from '../../utils/is-sortable'

/**
 * Returns a list of groups of overload signatures.
 *
 * @param members - The class elements to process.
 * @returns An array of groups of overload signatures.
 */
export function getOverloadSignatureGroups(
  members: TSESTree.ClassElement[],
): TSESTree.ClassElement[][] {
  let methods = members
    .filter(
      member =>
        member.type === AST_NODE_TYPES.MethodDefinition ||
        member.type === AST_NODE_TYPES.TSAbstractMethodDefinition,
    )
    .filter(member => member.kind === 'method')

  /* Static and non-static overload signatures can coexist with the same name. */
  let staticOverloadSignaturesByName = new Map<
    string,
    TSESTree.ClassElement[]
  >()
  let overloadSignaturesByName = new Map<string, TSESTree.ClassElement[]>()

  for (let method of methods) {
    if (method.key.type !== AST_NODE_TYPES.Identifier) {
      continue
    }

    let { name } = method.key
    let mapToUse = method.static
      ? staticOverloadSignaturesByName
      : overloadSignaturesByName
    let signatureOverloadsGroup = mapToUse.get(name)

    if (!signatureOverloadsGroup) {
      signatureOverloadsGroup = []
      mapToUse.set(name, signatureOverloadsGroup)
    }
    signatureOverloadsGroup.push(method)
  }

  /* Ignore groups that only have one method. */
  return [
    ...overloadSignaturesByName.values(),
    ...staticOverloadSignaturesByName.values(),
  ].filter(isSortable)
}
