interface Options {
  partitionByNewLine: string[] | boolean | string
  newlinesBetween: 'ignore' | 'always' | 'never'
}

export const validateNewlinesAndPartitionConfiguration = ({
  partitionByNewLine,
  newlinesBetween,
}: Options): void => {
  if (!!partitionByNewLine && newlinesBetween !== 'ignore') {
    throw new Error(
      "The 'partitionByNewLine' and 'newlinesBetween' options cannot be used together",
    )
  }
}
