import type { Options } from './types'

interface SortingNodeNameParameters {
  alternativeAlias: string | null
  alternative: { raw: string }
  options: ResolvedOptions
}

type ResolvedOptions = Required<Options[0]>

/**
 * Builds the display name used for comparing regex alternatives.
 *
 * @param parameters - Alternative metadata and rule options.
 * @returns String representation used during sorting.
 */
export function getSortingNodeName({
  alternativeAlias,
  alternative,
  options,
}: SortingNodeNameParameters): string {
  if (!options.ignoreAlias && alternativeAlias) {
    return `${alternativeAlias}: ${alternative.raw}`
  }
  return alternative.raw
}
