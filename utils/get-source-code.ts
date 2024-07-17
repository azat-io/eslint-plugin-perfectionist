import type { TSESLint } from '@typescript-eslint/utils'

export let getSourceCode = (context: TSESLint.RuleContext<string, unknown[]>) =>
  /* v8 ignore next 2 */
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  context.sourceCode ?? context.getSourceCode()
