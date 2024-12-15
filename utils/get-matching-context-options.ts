import { matches } from './matches'

interface Options {
  useConfigurationIf?: {
    allNamesMatchPattern?: string
  }
}

export let getMatchingContextOptions = <T extends Options>({
  contextOptions,
  nodeNames,
}: {
  contextOptions: T[]
  nodeNames: string[]
}): T[] =>
  contextOptions.filter(options => {
    let allNamesMatchPattern = options.useConfigurationIf?.allNamesMatchPattern
    return (
      !allNamesMatchPattern ||
      nodeNames.every(nodeName => matches(nodeName, allNamesMatchPattern))
    )
  })
