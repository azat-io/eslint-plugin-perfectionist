import type { TSESTree } from '@typescript-eslint/types'

export let getNodeParent = (
  node: TSESTree.Node,
  type: string[] | string,
): TSESTree.Node | null => {
  let types = Array.isArray(type) ? type : [type]
  let { parent } = node as { parent: TSESTree.Node | null }
  while (parent) {
    if (types.includes(parent.type)) {
      return parent
    }

    ;({ parent } = parent as { parent: TSESTree.Node | null })
  }
  return null
}
