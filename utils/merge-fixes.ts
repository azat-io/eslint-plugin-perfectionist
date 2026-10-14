import type { TSESLint } from '@typescript-eslint/utils'

/**
 * Parameters for merging a list of fixes into a single fix.
 */
interface MergeFixesParameters {
  /**
   * ESLint source code object, used to splice the original text back into the
   * gaps between fix ranges.
   */
  sourceCode: TSESLint.SourceCode

  /**
   * Fixes to merge. The array is never mutated.
   */
  fixes: TSESLint.RuleFix[]
}

/**
 * Merges a list of fixes into the single whole-range fix that the linter would
 * have built itself.
 *
 * This reproduces `mergeFixes` from
 * `node_modules/eslint/lib/linter/file-report.js:241-278` for the fix shapes
 * this plugin emits. That algorithm is byte-identical across the whole peer
 * range (`^8.45.0 || ^9.0.0 || ^10.0.0`); it only moved from
 * `report-translator.js` to `file-report.js` in 9.39.
 *
 * Doing the merge here lets one merged fix be shared by every report of the
 * same list. ESLint then takes the `assertValidFix(fix); return cloneFix(fix)`
 * path and `cloneFix` copies `text` by reference, so `n` messages retain one
 * string instead of `n` copies of it.
 *
 * Notes on the deliberate differences from ESLint's implementation:
 *
 * - The `|| a.range[1] - b.range[1]` tiebreak is load-bearing, not decorative.
 *   `makeFixes` concatenates order fixes with comment-after or newlines fixes
 *   whose ranges interleave, and a zero-width insertion at offset `x` regularly
 *   shares its start with a replacement that begins at `x`. Sorting on the
 *   start offset alone silently under-covers the merged range instead of
 *   failing loudly.
 * - Three of ESLint's branches are not reproduced because they are unreachable
 *   here: the `if (fix.range[0] >= 0)` guard, the `0` term of `Math.max(0,
 *   start, lastPos)` (replaced by initializing `lastPosition` to `start`), and
 *   the trailing `text += originalText.slice(..., end)`. Every fix range comes
 *   from an AST node or token, so it is never negative, and non-overlap makes
 *   `lastPosition === end` after the loop, which makes that trailing slice
 *   provably empty. ESLint's `fixes.length === 1` shortcut is subsumed by the
 *   `length < 2` early return.
 * - Overlapping fixes fall back to the original array instead of throwing. ESLint
 *   raises `Fix objects must not be overlapped in a report.` from its own
 *   `mergeFixes`, and oxlint has no overlap check at all, so returning the
 *   unmerged array leaves both hosts behaving exactly as they do today. The
 *   cost is that a future fixer which starts overlapping quietly keeps the
 *   O(n²) path instead of announcing itself.
 *
 * @example
 *
 * ```ts
 * mergeFixes({
 *   fixes: [
 *     { range: [6, 8], text: 'B' },
 *     { range: [2, 4], text: 'A' },
 *   ],
 *   sourceCode, // text: '0123456789'
 * })
 * // { range: [2, 8], text: 'A45B' }
 * ```
 *
 * @param params - Parameters for merging.
 * @returns The merged fix, or the original array when there is nothing to merge
 *   or the fixes overlap.
 */
export function mergeFixes({
  sourceCode,
  fixes,
}: MergeFixesParameters): TSESLint.RuleFix[] | TSESLint.RuleFix {
  if (fixes.length < 2) {
    return fixes
  }

  let sortedFixes = fixes.toSorted(
    (a, b) => a.range[0] - b.range[0] || a.range[1] - b.range[1],
  )
  let [start] = sortedFixes.at(0)!.range
  let [, end] = sortedFixes.at(-1)!.range

  let lastPosition = start
  let text = ''
  for (let fix of sortedFixes) {
    let [fixStart, fixEnd] = fix.range
    if (fixStart < lastPosition) {
      return fixes
    }
    text += sourceCode.text.slice(lastPosition, fixStart) + fix.text
    lastPosition = fixEnd
  }

  return { range: [start, end], text }
}
