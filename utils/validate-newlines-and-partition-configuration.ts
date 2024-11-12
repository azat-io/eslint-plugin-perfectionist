interface Options {
  newlinesBetween: 'ignore' | 'always' | 'never'
  partitionByNewLine: boolean | number
}

export let validateNewlinesAndPartitionConfiguration = ({
  partitionByNewLine,
  newlinesBetween,
}: Options): void => {
  if (!!partitionByNewLine && newlinesBetween !== 'ignore') {
    throw new Error(
      "The 'partitionByNewLine' and 'newlinesBetween' options cannot be used together",
    )
  }
}
