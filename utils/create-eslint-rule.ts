import { ESLintUtils } from '@typescript-eslint/utils'

interface ESLintPluginDocumentation {
  recommended?: boolean
}

export let createEslintRule =
  ESLintUtils.RuleCreator<ESLintPluginDocumentation>(
    ruleName => `https://perfectionist.dev/rules/${ruleName}`,
  )
