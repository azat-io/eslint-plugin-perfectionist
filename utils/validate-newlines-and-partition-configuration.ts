import type {
  NewlinesBetweenOption,
  GroupsOptions,
} from '../types/common-options'

interface Options {
  newlinesBetween: NewlinesBetweenOption
  groups: GroupsOptions<string>
  partitionByNewLine: boolean
}

export let validateNewlinesAndPartitionConfiguration = ({
  partitionByNewLine,
  newlinesBetween,
  groups,
}: Options): void => {
  if (!partitionByNewLine) {
    return
  }
  if (newlinesBetween !== 'ignore') {
    throw new Error(
      "The 'partitionByNewLine' and 'newlinesBetween' options cannot be used together",
    )
  }
  let hasNewlinesBetweenGroup = groups.some(
    group => typeof group === 'object' && 'newlinesBetween' in group,
  )
  if (hasNewlinesBetweenGroup) {
    throw new Error(
      "'newlinesBetween' objects can not be used in 'groups' alongside 'partitionByNewLine'",
    )
  }
}
