import { ESLintUtils } from '@typescript-eslint/utils'

import { repository } from '~/package.json'

export let createEslintRule = ESLintUtils.RuleCreator(
  ruleName =>
    `https://github.com/${repository}/blob/main/docs/rules/${ruleName}.md`,
)
