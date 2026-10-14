import type { ComparatorByOptionsComputer } from '../../utils/compare/default-comparator-by-options-computer'
import type { CommonOptions, TypeOption } from '../../types/common-options'
import type { SortingNode } from '../../types/sorting-node'

import { defaultComparatorByOptionsComputer } from '../../utils/compare/default-comparator-by-options-computer'

/**
 * Builds a comparator computer for sorting switch case blocks.
 *
 * Keeps `lastBlockToKeepInPlace` last and the block with the default clause
 * after all other blocks, which are compared by their first case. The options
 * passed to the computer are ignored, so blocks never use `fallbackSort`.
 *
 * @param props - Configuration object.
 * @param props.lastBlockToKeepInPlace - Block that must stay last, if any.
 * @param props.options - Sorting options.
 * @returns A comparator computer for case blocks.
 */
export function buildCaseBlockComparatorByOptionsComputer<
  Node extends { isDefaultClause: boolean } & SortingNode,
>({
  lastBlockToKeepInPlace,
  options,
}: {
  lastBlockToKeepInPlace: Node | null
  options: CommonOptions<TypeOption>
}): ComparatorByOptionsComputer<CommonOptions<TypeOption>, Node> {
  let comparator = defaultComparatorByOptionsComputer(options)

  return () => (a, b) => {
    if (a === lastBlockToKeepInPlace) {
      return 1
    }
    /* v8 ignore if -- @preserve last element might never be b. */
    if (b === lastBlockToKeepInPlace) {
      return -1
    }

    if (a.isDefaultClause) {
      return 1
    }
    if (b.isDefaultClause) {
      return -1
    }

    return comparator(a, b)
  }
}
