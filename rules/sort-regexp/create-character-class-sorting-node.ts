import type { CharacterClass } from '@eslint-community/regexpp/ast'
import type { TSESTree } from '@typescript-eslint/types'

import type { SortingNode } from '../../types/sorting-node'

import { getCharacterClassElementSortKey } from './get-character-class-element-sort-key'

/**
 * Creates a sorting node for a character class element.
 *
 * @param parameters - Character class element metadata.
 * @returns Sorting node describing the element.
 */
export function createCharacterClassSortingNode({
  literalNode,
  element,
}: {
  element: CharacterClass['elements'][number]
  literalNode: TSESTree.Literal
}): SortingNode<TSESTree.Literal> {
  let key = getCharacterClassElementSortKey(element)

  return {
    group: 'character-class',
    isEslintDisabled: false,
    size: key.raw.length,
    name: key.normalized,
    node: literalNode,
    partitionId: 0,
  }
}
