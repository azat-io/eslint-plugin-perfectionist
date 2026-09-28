/**
 * Part of a problem message. Names in double quotes become code.
 */
export interface MessageSegment {
  code: boolean
  text: string
}

let pluginPrefix = 'perfectionist/'

/**
 * Splits a message so names in double quotes can be shown as code.
 *
 * @param message - Problem message.
 * @returns Plain and code parts in order.
 */
export function toSegments(message: string): MessageSegment[] {
  return message
    .split(/"(?<name>[^\n"]*)"/u)
    .map((text, index) => ({ code: index % 2 === 1, text }))
    .filter(segment => segment.text !== '')
}

/**
 * Returns the rule name without the plugin prefix.
 *
 * @param ruleId - Rule id from ESLint, or `null` for a parse error.
 * @returns Rule name, or `null` when the problem is not from Perfectionist.
 */
export function getRuleName(ruleId: string | null): string | null {
  return ruleId?.startsWith(pluginPrefix) ?
      ruleId.slice(pluginPrefix.length)
    : null
}
