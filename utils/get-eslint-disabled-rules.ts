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
type EslintDisableDirective = (typeof eslintDisableDirectives)[number]

/**
 * Parses an ESLint disable comment to extract the directive type and affected
 * rules.
 *
 * Analyzes comment text to determine if it contains an ESLint disable directive
 * and which rules are affected. The justification that ESLint lets a directive
 * carry after a `--` separator is cut off before the rule list is read. Returns
 * null if the comment is not a valid ESLint disable directive.
 *
 * @example
 *
 * ```ts
 * getEslintDisabledRules('eslint-disable')
 * // Returns: { eslintDisableDirective: 'eslint-disable', rules: 'all' }
 * ```
 *
 * @example
 *
 * ```ts
 * getEslintDisabledRules('eslint-disable-next-line no-console, no-alert')
 * // Returns: {
 * //   eslintDisableDirective: 'eslint-disable-next-line',
 * //   rules: ['no-console', 'no-alert']
 * // }
 * ```
 *
 * @example
 *
 * ```ts
 * getEslintDisabledRules('eslint-disable-line no-console -- Debug output.')
 * // Returns: {
 * //   eslintDisableDirective: 'eslint-disable-line',
 * //   rules: ['no-console']
 * // }
 * ```
 *
 * @example
 *
 * ```ts
 * getEslintDisabledRules('regular comment')
 * // Returns: null
 * ```
 *
 * @param comment - Comment text to parse (without comment delimiters).
 * @returns Object containing directive type and affected rules, or null if not
 *   a disable comment.
 */
export function getEslintDisabledRules(comment: string): {
  eslintDisableDirective: EslintDisableDirective
  rules: string[] | 'all'
} | null {
  let directivePart = getDirectivePart(comment)
  for (let eslintDisableDirective of eslintDisableDirectives) {
    let disabledRules = getEslintDisabledRulesByType(
      directivePart,
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
 * Extracts disabled rules from the directive part of a comment for a specific
 * ESLint directive type.
 *
 * Attempts to parse the directive part as the specified ESLint disable
 * directive. Returns the list of disabled rules if the directive part matches
 * the directive, 'all' if no specific rules are mentioned (global disable), or
 * null if the directive part doesn't match the directive pattern. The directive
 * part is expected to be trimmed and free of its justification, the way
 * `getDirectivePart` returns it.
 *
 * @example
 *
 * ```ts
 * getEslintDisabledRulesByType('eslint-disable', 'eslint-disable')
 * // Returns: 'all'
 * ```
 *
 * @example
 *
 * ```ts
 * getEslintDisabledRulesByType(
 *   'eslint-disable-line rule1, rule2',
 *   'eslint-disable-line',
 * )
 * // Returns: ['rule1', 'rule2']
 * ```
 *
 * @example
 *
 * ```ts
 * getEslintDisabledRulesByType(
 *   'eslint-disable-line rule1',
 *   'eslint-disable-next-line',
 * )
 * // Returns: null (wrong directive type)
 * ```
 *
 * @param directivePart - Comment text without its justification, trimmed.
 * @param eslintDisableDirective - Specific directive type to match against.
 * @returns Array of rule names, 'all' for global disable, or null if no match.
 */
function getEslintDisabledRulesByType(
  directivePart: string,
  eslintDisableDirective: EslintDisableDirective,
): string[] | 'all' | null {
  if (eslintDisableDirective === directivePart) {
    return 'all' as const
  }
  let regexp = new RegExp(String.raw`^${eslintDisableDirective} ((?:.|\s)*)$`)
  let disabledRulesMatch = directivePart.match(regexp)
  let disableRulesMatchValue = disabledRulesMatch?.[1]
  if (!disableRulesMatchValue) {
    return null
  }
  return disableRulesMatchValue
    .split(',')
    .map(rule => rule.trim())
    .filter(rule => !!rule)
}

/**
 * Separates the directive part of a comment from its justification.
 *
 * ESLint lets every directive carry a justification after two or more dashes
 * surrounded by whitespace, and drops it before the rule list is parsed. This
 * mirrors `ConfigCommentParser#extractDirectiveComment` from
 * `@eslint/plugin-kit`: the separator is searched in the raw comment text
 * rather than in the trimmed one, so that a directive whose justification is
 * empty is recognized as well.
 *
 * @example
 *
 * ```ts
 * getDirectivePart('eslint-disable-line no-console -- Debug output.')
 * // Returns: 'eslint-disable-line no-console'
 * ```
 *
 * @example
 *
 * ```ts
 * getDirectivePart(' eslint-disable no-console ')
 * // Returns: 'eslint-disable no-console'
 * ```
 *
 * @param comment - Comment text to remove the justification from.
 * @returns Trimmed comment text without its justification.
 */
function getDirectivePart(comment: string): string {
  let justificationMatch = /\s-{2,}\s/u.exec(comment)
  if (!justificationMatch) {
    return comment.trim()
  }
  return comment.slice(0, justificationMatch.index).trim()
}
