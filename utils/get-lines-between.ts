import type { TSESTree } from '@typescript-eslint/types'
import type { TSESLint } from '@typescript-eslint/utils'

export let getLinesBetween = (
  source: TSESLint.SourceCode,
  left: TSESTree.Node,
  right: TSESTree.Node,
) =>
  source.lines
    .slice(left.loc.end.line, right.loc.start.line - 1)
    .filter(line => !line.trim().length).length
