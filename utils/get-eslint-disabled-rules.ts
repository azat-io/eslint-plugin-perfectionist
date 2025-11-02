/**
 * Array of all ESLint disable directive types. Used to identify and parse
 * ESLint disable comments in source code.
 */
let eslintDisableDirectives = [
  'eslint-disable',
  'eslint-enable',
  'eslint-disable-line',
  'eslint-disable-next-line',
] as const

/**
 * Type representing one of the ESLint disable directive types. Can be
 * 'eslint-disable', 'eslint-enable', 'eslint-disable-line', or
 * 'eslint-disable-next-line'.
 */
export type EslintDisableDirective = (typeof eslintDisableDirectives)[number]

/**
 * Parses an ESLint disable comment to extract the directive type and affected
 * rules.
 *
 * Analyzes comment text to determine if it contains an ESLint disable directive
 * and which rules are affected. Returns null if the comment is not a valid
 * ESLint disable directive.
 *
 * @example
 *   getEslintDisabledRules('eslint-disable')
 *   // Returns: { eslintDisableDirective: 'eslint-disable', rules: 'all' }
 *
 * @example
 *   getEslintDisabledRules('eslint-disable-next-line no-console, no-alert')
 *   // Returns: {
 *   //   eslintDisableDirective: 'eslint-disable-next-line',
 *   //   rules: ['no-console', 'no-alert']
 *   // }
 *
 * @example
 *   getEslintDisabledRules('regular comment')
 *   // Returns: null
 *
 * @param comment - Comment text to parse (without comment delimiters).
 * @returns Object containing directive type and affected rules, or null if not
 *   a disable comment.
 */
export function getEslintDisabledRules(comment: string): {
  eslintDisableDirective: EslintDisableDirective
  rules: string[] | 'all'
} | null {
  for (let eslintDisableDirective of eslintDisableDirectives) {
    let disabledRules = getEslintDisabledRulesByType(
      comment,
      eslintDisableDirective,
    )
    if (disabledRules) {
      return {
        eslintDisableDirective,
        rules: disabledRules,
      }
    }
  }
  return null
}

/**
 * Extracts disabled rules from a comment for a specific ESLint directive type.
 *
 * Attempts to parse the comment as the specified ESLint disable directive.
 * Returns the list of disabled rules if the comment matches the directive,
 * 'all' if no specific rules are mentioned (global disable), or null if the
 * comment doesn't match the directive pattern.
 *
 * @example
 *   getEslintDisabledRulesByType('eslint-disable', 'eslint-disable')
 *   // Returns: 'all'
 *
 * @example
 *   getEslintDisabledRulesByType(
 *     'eslint-disable-line rule1, rule2',
 *     'eslint-disable-line',
 *   )
 *   // Returns: ['rule1', 'rule2']
 *
 * @example
 *   getEslintDisabledRulesByType(
 *     'eslint-disable-line rule1',
 *     'eslint-disable-next-line',
 *   )
 *   // Returns: null (wrong directive type)
 *
 * @param comment - Comment text to parse.
 * @param eslintDisableDirective - Specific directive type to match against.
 * @returns Array of rule names, 'all' for global disable, or null if no match.
 */
function getEslintDisabledRulesByType(
  comment: string,
  eslintDisableDirective: EslintDisableDirective,
): string[] | 'all' | null {
  let trimmedCommentValue = comment.trim()
  if (eslintDisableDirective === trimmedCommentValue) {
    return 'all' as const
  }
  let regexp = new RegExp(String.raw`^${eslintDisableDirective} ((?:.|\s)*)$`)
  let disabledRulesMatch = trimmedCommentValue.match(regexp)
  let disableRulesMatchValue = disabledRulesMatch?.[1]
  if (!disableRulesMatchValue) {
    return null
  }
  return disableRulesMatchValue
    .split(',')
    .map(rule => rule.trim())
    .filter(rule => !!rule)
}
