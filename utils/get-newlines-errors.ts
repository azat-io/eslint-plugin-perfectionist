import type { TSESLint } from '@typescript-eslint/utils'

import type { SortingNode } from '../types/sorting-node'

import { getNewlinesBetweenOption } from './get-newlines-between-option'
import { getLinesBetween } from './get-lines-between'

interface GetNewlinesErrorsParameters<T extends string> {
  options: {
    customGroups?: Record<string, string[] | string> | CustomGroup[]
    newlinesBetween: 'ignore' | 'always' | 'never'
    groups: (string[] | string)[]
  }
  sourceCode: TSESLint.SourceCode
  missedSpacingError: T
  extraSpacingError: T
  right: SortingNode
  left: SortingNode
  rightNum: number
  leftNum: number
}

interface CustomGroup {
  newlinesAbove?: 'ignore' | 'always' | 'never'
  newlinesBelow?: 'ignore' | 'always' | 'never'
  newlinesInside?: 'always' | 'never'
  groupName: string
}

export let getNewlinesErrors = <T extends string>({
  missedSpacingError,
  extraSpacingError,
  sourceCode,
  rightNum,
  leftNum,
  options,
  right,
  left,
}: GetNewlinesErrorsParameters<T>): T[] => {
  let newlinesBetween = getNewlinesBetweenOption({
    nextSortingNode: right,
    sortingNode: left,
    options,
  })
  let numberOfEmptyLinesBetween = getLinesBetween(sourceCode, left, right)
  switch (newlinesBetween) {
    case 'ignore':
      return []
    case 'never':
      return numberOfEmptyLinesBetween > 0 ? [extraSpacingError] : []
    case 'always':
      if (leftNum > rightNum) {
        return []
      }
      if (numberOfEmptyLinesBetween === 0) {
        return [missedSpacingError]
      } else if (numberOfEmptyLinesBetween > 1) {
        return [extraSpacingError]
      }
  }
  return []
}
