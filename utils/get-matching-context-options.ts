import { matches } from './matches'

interface Options {
  useConfigurationIf?: {
    allNamesMatchPattern?: string
  }
}

export let getMatchingContextOptions = ({
  contextOptions,
  nodeNames,
}: {
  contextOptions: Options[]
  nodeNames: string[]
}): undefined | Options =>
  contextOptions.find(options => {
    let allNamesMatchPattern = options.useConfigurationIf?.allNamesMatchPattern
    return (
      !allNamesMatchPattern ||
      nodeNames.every(nodeName => matches(nodeName, allNamesMatchPattern))
    )
  })
