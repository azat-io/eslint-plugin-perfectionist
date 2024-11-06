const eslintDisableDirectives = [
  'eslint-disable',
  'eslint-enable',
  'eslint-disable-line',
  'eslint-disable-next-line',
] as const

export type EslintDisableDirective = (typeof eslintDisableDirectives)[number]

export const getEslintDisabledRules = (
  comment: string,
): {
  eslintDisableDirective: EslintDisableDirective
  rules: string[] | 'all'
} | null => {
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

const getEslintDisabledRulesByType = (
  comment: string,
  eslintDisableDirective: EslintDisableDirective,
) => {
  let trimmedCommentValue = comment.trim()
  if (eslintDisableDirective === trimmedCommentValue) {
    return 'all' as const
  }
  let regexp = new RegExp(`^${eslintDisableDirective} ((?:.|\\s)*)$`)
  let disabledRulesMatch = trimmedCommentValue.match(regexp)
  if (!disabledRulesMatch) {
    return null
  }
  return disabledRulesMatch[1]
    .split(',')
    .map(rule => rule.trim())
    .filter(rule => !!rule)
}
