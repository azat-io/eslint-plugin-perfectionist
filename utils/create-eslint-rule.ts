import { ESLintUtils } from '@typescript-eslint/utils'

/**
 * Factory function for creating ESLint rules with consistent structure and
 * documentation.
 *
 * Wraps the ESLintUtils.RuleCreator to automatically generate documentation
 * URLs for each rule based on its name. All rules created with this function
 * will have their documentation hosted at perfectionist.dev.
 *
 * @see {@link https://typescript-eslint.io/packages/utils/} - TypeScript ESLint
 * Utils documentation
 * @see {@link https://perfectionist.dev/} - Perfectionist plugin documentation
 */
export let createEslintRule = ESLintUtils.RuleCreator<{
  /**
   * Indicates whether the rule is part of the recommended configuration.
   *
   * @default false
   */
  recommended?: boolean
}>(ruleName => `https://perfectionist.dev/rules/${ruleName}`)
