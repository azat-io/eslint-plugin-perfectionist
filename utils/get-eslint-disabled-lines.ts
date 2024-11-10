import type { TSESLint } from '@typescript-eslint/utils'

import { getEslintDisabledRules } from './get-eslint-disabled-rules'

export const getEslintDisabledLines = (props: {
  sourceCode: TSESLint.SourceCode
  ruleName: string
}) => {
  let { sourceCode, ruleName } = props
  let returnValue: number[] = []
  let lineRulePermanentlyDisabled: number | null = null
  for (let comment of sourceCode.getAllComments()) {
    let eslintDisabledRules = getEslintDisabledRules(comment.value)
    let includesRule =
      eslintDisabledRules?.rules === 'all' ||
      eslintDisabledRules?.rules.includes(ruleName)
    if (!includesRule) {
      continue
    }
    switch (eslintDisabledRules?.eslintDisableDirective) {
      case 'eslint-disable-next-line':
        returnValue.push(comment.loc.end.line + 1)
        continue
      case 'eslint-disable-line':
        returnValue.push(comment.loc.start.line)
        continue
      case 'eslint-disable':
        lineRulePermanentlyDisabled =
          lineRulePermanentlyDisabled ?? comment.loc.start.line
        break
      case 'eslint-enable':
        /* v8 ignore next 3 - Hard to cover in test without raising another ESLint error */
        if (!lineRulePermanentlyDisabled) {
          continue
        }
        returnValue.push(
          ...createArrayFromTo(
            lineRulePermanentlyDisabled + 1,
            comment.loc.start.line,
          ),
        )
        lineRulePermanentlyDisabled = null
        break
    }
  }
  return returnValue
}

const createArrayFromTo = (i: number, j: number) =>
  Array.from({ length: j - i + 1 }, (_, k) => i + k)
