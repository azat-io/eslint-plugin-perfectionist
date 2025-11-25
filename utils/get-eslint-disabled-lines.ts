import type { TSESLint } from '@typescript-eslint/utils'

import { getEslintDisabledRules } from './get-eslint-disabled-rules'
import { UnreachableCaseError } from './unreachable-case-error'

/**
 * Determines which lines have the specified ESLint rule disabled via comments.
 *
 * Parses ESLint disable comments in the source code to identify lines where a
 * specific rule should not be enforced. Handles all ESLint disable directives:
 *
 * - `eslint-disable-next-line` - Disables the rule for the next line
 * - `eslint-disable-line` - Disables the rule for the current line
 * - `eslint-disable` - Disables the rule from this point forward
 * - `eslint-enable` - Re-enables the rule after a previous disable.
 *
 * The function correctly handles:
 *
 * - Rule-specific disables (e.g., `eslint-disable-next-line rule-name`)
 * - Global disables (e.g., `eslint-disable-next-line` without specific rules)
 * - Nested disable/enable pairs.
 *
 * @example
 *   // Source code with disable comments:
 *   // eslint-disable-next-line perfectionist/sort-imports
 *   import { z } from 'zod'
 *   import { a } from 'a'
 *
 *   // eslint-disable perfectionist/sort-imports
 *   import { y } from 'y'
 *   import { b } from 'b'
 *   // eslint-enable perfectionist/sort-imports
 *
 *   getEslintDisabledLines({
 *     sourceCode,
 *     ruleName: 'perfectionist/sort-imports',
 *   })
 *   // Returns: [2, 5, 6] (lines where the rule is disabled)
 *
 * @param props - Configuration object.
 * @param props.sourceCode - ESLint source code object containing comments.
 * @param props.ruleName - Name of the rule to check for disable directives.
 * @returns Array of line numbers (1-indexed) where the rule is disabled.
 */
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
    /* v8 ignore next 3 -- @preserve Hard to test this false branch. */
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
      case 'eslint-enable': {
        /* v8 ignore next -- @preserve Hard to cover in test without raising another ESLint error. */
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
      /* v8 ignore next 4 -- @preserve Should never reach unreachable case. */
      default:
        throw new UnreachableCaseError(
          eslintDisabledRules.eslintDisableDirective,
        )
    }
  }
  return returnValue
}

/**
 * Creates an array of consecutive integers from start to end (inclusive).
 *
 * Helper function to generate an array of line numbers for ranges disabled by
 * eslint-disable/eslint-enable comment pairs.
 *
 * @example
 *   createArrayFromTo(5, 8)
 *   // Returns: [5, 6, 7, 8]
 *
 * @param i - Starting number (inclusive).
 * @param index - Ending number (inclusive).
 * @returns Array of consecutive integers from i to index.
 */
function createArrayFromTo(i: number, index: number): number[] {
  return Array.from({ length: index - i + 1 }, (_, item) => i + item)
}
