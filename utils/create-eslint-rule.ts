import { ESLintUtils } from '@typescript-eslint/utils'

/**
 * Documentation metadata for ESLint rules.
 *
 * Provides additional information about the rule that can be used by ESLint
 * configurations and documentation generators.
 */
export interface ESLintPluginDocumentation {
  /**
   * Indicates whether the rule is part of the recommended configuration. Rules
   * marked as recommended are typically enabled by default in the plugin's
   * recommended preset.
   *
   * @default false
   */
  recommended?: boolean
}

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
export let createEslintRule =
  ESLintUtils.RuleCreator<ESLintPluginDocumentation>(
    ruleName => `https://perfectionist.dev/rules/${ruleName}`,
  )
