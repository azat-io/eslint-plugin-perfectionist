import type { TSESLint } from '@typescript-eslint/utils'

export let getSourceCode = (context: TSESLint.RuleContext<string, unknown[]>) =>
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  context.sourceCode ?? context.getSourceCode()
