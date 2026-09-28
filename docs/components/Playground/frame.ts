import type { KeyedTokensInfo } from '@shikijs/magic-move/types'
import type { HighlighterCore } from 'shiki'

import { toKeyedTokens } from '@shikijs/magic-move/core'
import { splitTokens } from 'shiki/core'

import type { LintProblem } from './lint-config'

export interface FrameOptions {
  highlighter: HighlighterCore | null

  /**
   * Split tokens at word, space and punctuation boundaries, so single words can
   * move during an animation. Typing does not need it and renders fewer
   * elements without it.
   */
  words?: boolean
  marks?: Mark[]
  theme: string
}

/**
 * A code range to underline, as offsets into the code. `fatal` marks a parse
 * error. `problem` is the index of the problem in the list the marks were made
 * from.
 */
export interface Mark {
  problem: number
  fatal: boolean
  start: number
  end: number
}

/**
 * Code longer than this is shown as plain text and is not linted.
 */
export const CODE_SIZE_LIMIT = 100_000

/**
 * Salts keys, so every frame gets its own. The renderer reuses an element by
 * key without checking its tag: with the same code, a frame split differently
 * would turn a line break element into a word and add stray lines.
 */
let frameCount = 0

interface Token {
  content: string
  offset: number
  color?: string
}

/**
 * Converts lint problems to marks. ESLint positions are 1-based lines and
 * columns in UTF-16 code units with an exclusive end. An empty range, as for
 * most parse errors, marks the character at the position or the one before it
 * at the end of a line.
 *
 * @param code - Linted code.
 * @param problems - Problems to mark.
 * @returns Marks sorted by position.
 */
export function toMarks(code: string, problems: LintProblem[]): Mark[] {
  let lineStarts = getLineStarts(code)
  function toOffset(line: number, column: number): number {
    let lineStart = lineStarts[Math.min(line, lineStarts.length) - 1] ?? 0
    return Math.min(lineStart + column - 1, code.length)
  }
  return problems
    .flatMap((problem, index) => {
      let start = toOffset(problem.line, problem.column)
      let end = toOffset(problem.endLine, problem.endColumn)
      if (end <= start) {
        start = findVisibleCharacter(code, start)
        if (start === -1) {
          return []
        }
        end = start + 1
      }
      return [
        {
          start: isLowSurrogate(code, start) ? start - 1 : start,
          end: isLowSurrogate(code, end) ? end + 1 : end,
          fatal: problem.ruleId === null,
          problem: index,
        },
      ]
    })
    .toSorted((first, second) => first.start - second.start)
}

/**
 * Finds the part of the text that differs between two versions. Boundaries
 * never split a surrogate pair.
 *
 * @param from - Previous text.
 * @param to - New text.
 * @returns Start of the change and its end in both texts.
 */
export function getChangedRange(
  from: string,
  to: string,
): { fromEnd: number; start: number; toEnd: number } {
  let start = 0
  let maxStart = Math.min(from.length, to.length)
  while (start < maxStart && from[start] === to[start]) {
    start++
  }
  if (isLowSurrogate(from, start) || isLowSurrogate(to, start)) {
    start--
  }
  let suffix = 0
  let maxSuffix = maxStart - start
  while (
    suffix < maxSuffix &&
    from[from.length - 1 - suffix] === to[to.length - 1 - suffix]
  ) {
    suffix++
  }
  if (
    suffix > 0 &&
    (isLowSurrogate(from, from.length - suffix) ||
      isLowSurrogate(to, to.length - suffix))
  ) {
    suffix--
  }
  return { fromEnd: from.length - suffix, toEnd: to.length - suffix, start }
}

/**
 * Builds renderer tokens for code.
 *
 * Every token gets a class, because the renderer only replaces `className` when
 * a token has one: a token without it would keep the underline of the element
 * it reuses. An underlined token also gets a `problem-N` class for each problem
 * it belongs to, so hovering it can find the messages.
 *
 * @param code - Code to show.
 * @param options - Highlighter, marks and splitting mode.
 * @returns Keyed tokens for `MagicMoveRenderer`.
 */
export function toFrame(
  code: string,
  { words = false, highlighter, marks = [], theme }: FrameOptions,
): KeyedTokensInfo {
  let breakpoints = new Set<number>()
  for (let mark of marks) {
    breakpoints.add(mark.start)
    breakpoints.add(mark.end)
  }
  if (words) {
    addWordBreakpoints(code, breakpoints)
  }
  let lines: Token[][] =
    highlighter ?
      highlighter.codeToTokens(code, { lang: 'tsx', theme }).tokens
    : toPlainLines(code)
  frameCount += 1
  let info = toKeyedTokens(
    code,
    splitTokens(lines, breakpoints),
    String(frameCount),
  )
  setMarkClasses(info.tokens, marks)
  return info
}

/**
 * Checks whether a change only reorders tokens. Sorting usually does; then
 * moves can start at once instead of waiting for leaving tokens.
 *
 * @param from - Frame before the change.
 * @param to - Frame after the change.
 * @returns Whether both frames hold the same non-space tokens.
 */
export function isPermutation(
  from: KeyedTokensInfo,
  to: KeyedTokensInfo,
): boolean {
  let counts = new Map<string, number>()
  for (let token of from.tokens) {
    if (token.content.trim()) {
      counts.set(token.content, (counts.get(token.content) ?? 0) + 1)
    }
  }
  for (let token of to.tokens) {
    if (!token.content.trim()) {
      continue
    }
    let count = counts.get(token.content) ?? 0
    if (count === 0) {
      return false
    }
    counts.set(token.content, count - 1)
  }
  for (let count of counts.values()) {
    if (count !== 0) {
      return false
    }
  }
  return true
}

/**
 * Moves marks after an edit so underlines stay on their words until the next
 * lint result arrives. Marks that touch the edited part are dropped.
 *
 * @param marks - Marks for the previous code.
 * @param from - Previous code.
 * @param to - Code after the edit.
 * @returns Marks for the new code.
 */
export function shiftMarks(marks: Mark[], from: string, to: string): Mark[] {
  let { fromEnd, start } = getChangedRange(from, to)
  let delta = to.length - from.length
  return marks.flatMap(mark => {
    if (mark.end <= start) {
      return [mark]
    }
    if (mark.start >= fromEnd) {
      return [{ ...mark, start: mark.start + delta, end: mark.end + delta }]
    }
    return []
  })
}

/**
 * Builds the target frame of an animation. Its tokens carry no class: a class
 * on a moving token replaces the renderer's move class, and the token would
 * jump instead of sliding. Reused elements keep their underline until the
 * static frame replaces them after the animation.
 *
 * @param code - Code after the change.
 * @param options - Highlighter and theme.
 * @returns Keyed tokens split at word boundaries.
 */
export function toMotionFrame(
  code: string,
  options: Pick<FrameOptions, 'highlighter' | 'theme'>,
): KeyedTokensInfo {
  let info = toFrame(code, { ...options, words: true })
  for (let token of info.tokens) {
    delete token.htmlClass
  }
  return info
}

/**
 * Returns where each line starts, treating the same characters as line breaks
 * as ESLint does.
 *
 * @param code - Code to scan.
 * @returns Offsets of line starts.
 */
export function getLineStarts(code: string): number[] {
  let lineStarts = [0]
  for (let match of code.matchAll(/\r\n|[\n\r\u{2028}\u{2029}]/gu)) {
    lineStarts.push(match.index + match[0].length)
  }
  return lineStarts
}

/**
 * Gives every token its class in one pass over the tokens and the marks, both
 * in order of position. Checking every mark for every token would take seconds
 * on code with thousands of problems.
 *
 * @param tokens - Tokens in order of position.
 * @param marks - Marks to underline.
 */
function setMarkClasses(
  tokens: KeyedTokensInfo['tokens'],
  marks: Mark[],
): void {
  let pending = marks.toSorted((first, second) => first.start - second.start)
  let active: Mark[] = []
  let next = 0
  for (let token of tokens) {
    let start = token.offset
    let end = start + token.content.length
    while (next < pending.length && pending[next]!.start < end) {
      active.push(pending[next]!)
      next++
    }
    active = active.filter(mark => mark.end > start)
    token.htmlClass = getMarkClass(active)
  }
}

function addWordBreakpoints(code: string, breakpoints: Set<number>): void {
  let previous = getCharacterClass(code.codePointAt(0) ?? 0)
  for (let index = 1; index < code.length; index++) {
    if (isLowSurrogate(code, index)) {
      continue
    }
    let current = getCharacterClass(code.codePointAt(index)!)
    if (current !== previous || current === 'punctuation') {
      breakpoints.add(index)
    }
    previous = current
  }
}

/**
 * Finds the character to underline for an empty range: the one at the position,
 * or the last visible one before it when the position is at a line break or the
 * end of the code.
 *
 * @param code - Code the range belongs to.
 * @param position - Offset of the empty range.
 * @returns Offset of a visible character, or -1 when there is none.
 */
function findVisibleCharacter(code: string, position: number): number {
  if (position < code.length && !/\s/u.test(code[position]!)) {
    return position
  }
  for (let index = Math.min(position, code.length) - 1; index >= 0; index--) {
    if (!/\s/u.test(code[index]!)) {
      return isLowSurrogate(code, index) ? index - 1 : index
    }
  }
  return -1
}

/**
 * Returns the class of a token covered by the given marks.
 *
 * @param marks - Marks that overlap the token.
 * @returns Class names.
 */
function getMarkClass(marks: Mark[]): string {
  if (marks.length === 0) {
    return 'tok'
  }
  let fatal = marks.some(mark => mark.fatal)
  let problems = marks.map(mark => `problem-${mark.problem}`)
  return ['tok', 'lint', ...(fatal ? ['lint-fatal'] : []), ...problems].join(
    ' ',
  )
}

function getCharacterClass(
  codePoint: number,
): 'punctuation' | 'space' | 'word' {
  let character = String.fromCodePoint(codePoint)
  if (/[\p{L}\p{N}$_]/u.test(character)) {
    return 'word'
  }
  return /\s/u.test(character) ? 'space' : 'punctuation'
}

function isLowSurrogate(text: string, index: number): boolean {
  let code = text.charCodeAt(index)
  let previous = text.charCodeAt(index - 1)
  return (
    code >= 0xdc_00 &&
    code <= 0xdf_ff &&
    previous >= 0xd8_00 &&
    previous <= 0xdb_ff
  )
}

function toPlainLines(code: string): Token[][] {
  let offset = 0
  return code.split('\n').map(line => {
    let token = { content: line, offset }
    offset += line.length + 1
    return [token]
  })
}
