import { ESLintUtils } from '@typescript-eslint/utils'

export let createEslintRule = ESLintUtils.RuleCreator(
  ruleName => `https://perfectionist.dev/rules/${ruleName}`,
)
