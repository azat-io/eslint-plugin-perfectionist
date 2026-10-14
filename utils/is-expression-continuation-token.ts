import type { TSESTree } from '@typescript-eslint/types'

/**
 * First characters of the tokens that continue the expression written on the
 * previous line instead of starting a new element.
 */
const EXPRESSION_CONTINUATION_CHARACTERS = new Set([
  '[',
  '(',
  '`',
  '*',
  '+',
  '-',
  '/',
  '<',
])

/**
 * Determines whether a token continues the expression that precedes it.
 *
 * Such a token prevents Automatic Semicolon Insertion from terminating the
 * previous element at the line break: `[` starts a member access or a computed
 * key, `*` a multiplication or a generator, a backtick a tagged template, and
 * so on.
 *
 * @param token - Token that follows the element, if any.
 * @returns True if the token continues the preceding expression.
 */
export function isExpressionContinuationToken(
  token: TSESTree.Token | undefined | null,
): boolean {
  return EXPRESSION_CONTINUATION_CHARACTERS.has(token?.value.charAt(0) ?? '')
}
