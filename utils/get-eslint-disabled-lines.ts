import type { TSESLint } from '@typescript-eslint/utils'

import { getEslintDisabledRules } from './get-eslint-disabled-rules'
import { UnreachableCaseError } from './unreachable-case-error'

export function getEslintDisabledLines(props: {
  sourceCode: TSESLint.SourceCode
  ruleName: string
}): number[] {
  let { sourceCode, ruleName } = props
  let returnValue: number[] = []
  let lineRulePermanentlyDisabled: number | null = null
  for (let comment of sourceCode.getAllComments()) {
    let eslintDisabledRules = getEslintDisabledRules(comment.value)
    if (!eslintDisabledRules) {
      continue
    }

    let includesRule =
      eslintDisabledRules.rules === 'all' ||
      eslintDisabledRules.rules.includes(ruleName)
    /* v8 ignore next 3 */
    if (!includesRule) {
      continue
    }

    switch (eslintDisabledRules.eslintDisableDirective) {
      case 'eslint-disable-next-line':
        returnValue.push(comment.loc.end.line + 1)
        continue
      case 'eslint-disable-line':
        returnValue.push(comment.loc.start.line)
        continue
      case 'eslint-disable':
        lineRulePermanentlyDisabled ??= comment.loc.start.line
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
      /* v8 ignore next 4 */
      default:
        throw new UnreachableCaseError(
          eslintDisabledRules.eslintDisableDirective,
        )
    }
  }
  return returnValue
}

function createArrayFromTo(i: number, index: number): number[] {
  return Array.from({ length: index - i + 1 }, (_, item) => i + item)
}
