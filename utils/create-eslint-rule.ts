import { ESLintUtils } from '@typescript-eslint/utils'

export let createEslintRule = ESLintUtils.RuleCreator(
  ruleName => `https://eslint-plugin-perfectionist.azat.io/rules/${ruleName}`,
)
