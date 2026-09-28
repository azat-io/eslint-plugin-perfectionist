import type { LintProblem } from './lint-config'

/**
 * Why the options can't be used, to show under the Options field.
 */
export interface OptionsProblem {
  /**
   * Position of a syntax error in the field, or `null` when the error is about
   * the values.
   */
  position: { column: number; line: number } | null

  /**
   * Lines of the error.
   */
  lines: string[]
}

/**
 * Part of a problem message. Names in double quotes become code.
 */
export interface MessageSegment {
  /**
   * The part is a name from the message and is shown as code.
   */
  code: boolean

  /**
   * Text of the part.
   */
  text: string
}

let pluginPrefix = 'perfectionist/'

/**
 * Turns an error ESLint threw for rule options into lines to show under the
 * Options field. The config path prefix is dropped, and the schema's generic
 * `oneOf` line goes when a more specific line is there.
 *
 * @param message - Error message without ESLint's location note.
 * @returns Lines of the error.
 */
export function toOptionsErrors(message: string): string[] {
  let lines = message
    .replace(/^Key "rules": Key "[^"]+":\s*/u, '')
    .replace(/^Error while loading rule '[^']+': /u, '')
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
  let specific = lines.filter(
    line => !line.endsWith('should match exactly one schema in oneOf.'),
  )
  return specific.length > 0 ? specific : lines
}

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
 * Tells whether to show the groups of a problem's elements. Messages about the
 * order of groups already name them.
 *
 * @param problem - Lint problem.
 * @returns Whether the groups add information.
 */
export function hasGroupHint(problem: LintProblem): boolean {
  return (
    problem.groups !== undefined &&
    !problem.message.includes(`(${problem.groups.right})`)
  )
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
