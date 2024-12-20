import type { TSESLint } from '@typescript-eslint/utils'

import type { SortingNode } from '../types'

import { getLinesBetween } from './get-lines-between'

interface Props<T extends string> {
  sourceCode: TSESLint.SourceCode
  missedSpacingError: T
  extraSpacingError: T
  right: SortingNode
  left: SortingNode
  rightNum: number
  options: Options
  leftNum: number
}

interface Options {
  newlinesBetween: 'ignore' | 'always' | 'never'
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
}: Props<T>): T[] => {
  let errors: T[] = []

  let numberOfEmptyLinesBetween = getLinesBetween(sourceCode, left, right)
  if (options.newlinesBetween === 'never' && numberOfEmptyLinesBetween > 0) {
    errors.push(extraSpacingError)
  }

  if (options.newlinesBetween === 'always') {
    if (leftNum < rightNum && numberOfEmptyLinesBetween === 0) {
      errors.push(missedSpacingError)
    } else if (
      numberOfEmptyLinesBetween > 1 ||
      (leftNum === rightNum && numberOfEmptyLinesBetween > 0)
    ) {
      errors.push(extraSpacingError)
    }
  }

  return errors
}
