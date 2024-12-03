import { matches } from './matches'

interface Options {
  useConfigurationIf?: {
    allElementNamesMatchPattern?: string
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
    let allElementNamesMatchPattern =
      options.useConfigurationIf?.allElementNamesMatchPattern
    return (
      !allElementNamesMatchPattern ||
      nodeNames.every(nodeName =>
        matches(nodeName, allElementNamesMatchPattern),
      )
    )
  })
