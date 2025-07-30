import type { RegexOption } from '../types/common-options'

import { matches } from './matches'

interface Options {
  useConfigurationIf?: {
    allNamesMatchPattern?: RegexOption
  }
}

export function getMatchingContextOptions<T extends Options>({
  contextOptions,
  nodeNames,
}: {
  contextOptions: T[]
  nodeNames: string[]
}): T[] {
  return contextOptions.filter(options => {
    let allNamesMatchPattern = options.useConfigurationIf?.allNamesMatchPattern
    return (
      !allNamesMatchPattern ||
      nodeNames.every(nodeName => matches(nodeName, allNamesMatchPattern))
    )
  })
}
