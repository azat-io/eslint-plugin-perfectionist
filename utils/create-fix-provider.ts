import type { TSESLint } from '@typescript-eslint/utils'

import type { SortingNode } from '../types/sorting-node'
import type { MakeFixesParameters } from './make-fixes'

import { mergeFixes } from './merge-fixes'
import { makeFixes } from './make-fixes'

/**
 * Returns the fix for one report of a sortable list.
 *
 * Called from inside a report's `fix` callback. Repeated calls with the same
 * `hasCommentAboveMissing` value return the very same value.
 */
export type FixProvider = (
  parameters: FixProviderParameters,
) => TSESLint.RuleFix[] | TSESLint.RuleFix

/**
 * Parameters a fix provider is called with for one report.
 */
interface FixProviderParameters {
  /**
   * Whether the reported pair is missing its required comment above.
   */
  hasCommentAboveMissing: boolean

  /**
   * ESLint fixer object of the report currently being created.
   */
  fixer: TSESLint.RuleFixer
}

/**
 * Creates a provider that builds a sortable list's fix at most once.
 *
 * Every report of a list carries the same whole-list fix, but `makeFixes` walks
 * the entire list on each call and ESLint invokes the `fix` callback of every
 * report eagerly. A list with `n` misplaced elements therefore costs `n`
 * reports times `O(n)` work and retains `n` copies of the whole-list string.
 *
 * The provider computes that fix lazily on the first report that asks for it,
 * merges it into the single `{ range, text }` object ESLint would have built
 * anyway, and hands the same object to every later report. ESLint's `cloneFix`
 * copies the `text` by reference, so the retained text collapses from `O(n²)`
 * to `O(n)` characters.
 *
 * The provider's lifetime is the closure's — exactly one sortable list. It must
 * never be hoisted above the loop that owns the invariant `nodes` and
 * `sortedNodes` arrays, or one list's fix would be handed to another list's
 * reports.
 *
 * Building is deferred to the `fix` callback on purpose: ESLint skips fix
 * normalization entirely when fixes are disabled, so `--fix`-less hosts and
 * language servers keep paying nothing.
 *
 * Two slots are kept, keyed on `hasCommentAboveMissing`, because `makeFixes`
 * branches on it. They are filled lazily and independently, and the miss is
 * detected with `=== undefined` rather than `??=`: `makeFixes` legitimately
 * returns an empty array, and a nullish-coalescing slot would recompute it on
 * every report and silently keep the quadratic behavior.
 *
 * @example
 *
 * ```ts
 * let getFix = createFixProvider({
 *   sortedNodes,
 *   sourceCode,
 *   options,
 *   nodes,
 * })
 * pairwise(nodes, (left, right) => {
 *   context.report({
 *     fix: fixer => getFix({ hasCommentAboveMissing: false, fixer }),
 *     // ...
 *   })
 * })
 * ```
 *
 * @template T - Type of sorting node.
 * @param makeFixesParameters - Everything `makeFixes` needs that is invariant
 *   across the list's reports.
 * @returns Provider returning the list's merged fix.
 */
export function createFixProvider<T extends SortingNode>(
  makeFixesParameters: Omit<
    MakeFixesParameters<T>,
    'hasCommentAboveMissing' | 'fixer'
  >,
): FixProvider {
  let cachedFixes = new Map<boolean, TSESLint.RuleFix[] | TSESLint.RuleFix>()

  return ({ hasCommentAboveMissing, fixer }) => {
    let cachedFix = cachedFixes.get(hasCommentAboveMissing)
    if (cachedFix === undefined) {
      cachedFix = mergeFixes({
        fixes: makeFixes({
          ...makeFixesParameters,
          hasCommentAboveMissing,
          fixer,
        }),
        sourceCode: makeFixesParameters.sourceCode,
      })
      cachedFixes.set(hasCommentAboveMissing, cachedFix)
    }
    return cachedFix
  }
}
