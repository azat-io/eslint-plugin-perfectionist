import type { TSESLint } from '@typescript-eslint/utils'

import type { SortingNode } from '../typings'

export let getLinesBetween = (
  source: TSESLint.SourceCode,
  left: SortingNode,
  right: SortingNode,
): number => {
  let linesBetween = source.lines.slice(
    left.node.loc.end.line,
    right.node.loc.start.line - 1,
  )

  return linesBetween.filter(line => !line.trim().length).length
}
