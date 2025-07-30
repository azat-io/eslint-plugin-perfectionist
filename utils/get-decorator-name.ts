import type { TSESTree } from '@typescript-eslint/types'
import type { TSESLint } from '@typescript-eslint/utils'

export function getDecoratorName({
  sourceCode,
  decorator,
}: {
  sourceCode: TSESLint.SourceCode
  decorator: TSESTree.Decorator
}): string {
  let fullName = sourceCode.getText(decorator)
  if (fullName.startsWith('@')) {
    fullName = fullName.slice(1)
  }
  return fullName.split('(')[0]!
}
