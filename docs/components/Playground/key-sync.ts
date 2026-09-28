import type { KeyedTokensInfo, KeyedToken } from '@shikijs/magic-move/types'

/**
 * Place of a token in its frame.
 */
interface Position {
  /**
   * 0-based column of the token.
   */
  column: number

  /**
   * 0-based line of the token.
   */
  line: number
}

/**
 * Gives tokens of the target frame the keys of their counterparts in the source
 * frame, so the renderer moves them instead of fading one out and another in.
 *
 * The default diff of magic-move matches characters and leaves most tokens of a
 * reordered block unmatched. Sorting moves whole lines, so matching goes from
 * coarse to fine:
 *
 * 1. Lines that appear once in both frames keep all their tokens.
 * 2. Repeated identical lines pair up in order of displacement, so blocks move as
 *    a whole.
 * 3. Remaining tokens whose text is unique on both sides pair up.
 * 4. The rest pair by text, preferring the source line most tokens of the target
 *    line came from, then the nearest line and column.
 *
 * Tokens left without a pair fade out or in.
 *
 * @param from - Frame currently on screen.
 * @param to - Frame to animate to. Its keys are rewritten.
 * @returns The target frame.
 */
export function syncKeys(
  from: KeyedTokensInfo,
  to: KeyedTokensInfo,
): KeyedTokensInfo {
  let fromLines = splitLines(from.tokens)
  let toLines = splitLines(to.tokens)
  let fromPositions = getPositions(fromLines)
  let toPositions = getPositions(toLines)
  let used = new Set<KeyedToken>()
  let matched = new Set<KeyedToken>()
  let sourceByKey = new Map<string, KeyedToken>()
  let usedLines = new Set<number>()
  let pairedLines = Array.from({ length: toLines.length }, () => -1)

  function pair(target: KeyedToken, source: KeyedToken): void {
    target.key = source.key
    used.add(source)
    matched.add(target)
    sourceByKey.set(source.key, source)
  }

  function pairLine(toIndex: number, fromIndex: number): void {
    let sourceLine = fromLines[fromIndex]!
    let targetLine = toLines[toIndex]!
    if (sourceLine.length !== targetLine.length) {
      return
    }
    pairedLines[toIndex] = fromIndex
    usedLines.add(fromIndex)
    for (let [index, token] of targetLine.entries()) {
      pair(token, sourceLine[index]!)
    }
  }

  let fromBySignature = groupBy(fromLines.keys(), index =>
    getSignature(fromLines[index]!),
  )
  let toBySignature = groupBy(toLines.keys(), index =>
    getSignature(toLines[index]!),
  )
  for (let [signature, toIndexes] of toBySignature) {
    let fromIndexes = fromBySignature.get(signature)
    if (fromIndexes?.length === 1 && toIndexes.length === 1) {
      pairLine(toIndexes[0]!, fromIndexes[0]!)
    }
  }

  let displacement = 0
  for (let [toIndex, line] of toLines.entries()) {
    if (pairedLines[toIndex]! >= 0) {
      displacement = toIndex - pairedLines[toIndex]!
      continue
    }
    let expected = toIndex - displacement
    let candidates = (fromBySignature.get(getSignature(line)) ?? [])
      .filter(fromIndex => !usedLines.has(fromIndex))
      .toSorted(
        (first, second) =>
          Math.abs(first - expected) - Math.abs(second - expected) ||
          first - second,
      )
    let [best] = candidates
    if (best !== undefined) {
      pairLine(toIndex, best)
      displacement = toIndex - best
    }
  }

  let freeSources = groupBy(
    from.tokens.filter(token => !used.has(token)),
    token => token.content,
  )
  let freeTargets = groupBy(
    to.tokens.filter(token => !matched.has(token)),
    token => token.content,
  )
  for (let [content, targets] of freeTargets) {
    let sources = freeSources.get(content)
    if (content.trim() && targets.length === 1 && sources?.length === 1) {
      pair(targets[0]!, sources[0]!)
      freeSources.delete(content)
    }
  }

  for (let [toIndex, line] of toLines.entries()) {
    let sourceLine =
      pairedLines[toIndex]! >= 0 ? pairedLines[toIndex]! : vote(line)
    let wanted = sourceLine >= 0 ? sourceLine : toIndex
    for (let token of line) {
      if (matched.has(token)) {
        continue
      }
      let candidates = freeSources
        .get(token.content)
        ?.filter(candidate => !used.has(candidate))
      if (!candidates?.length) {
        continue
      }
      let target = toPositions.get(token)!
      let [best] = candidates
      for (let candidate of candidates) {
        if (
          distance(candidate, wanted, target) < distance(best!, wanted, target)
        ) {
          best = candidate
        }
      }
      pair(token, best!)
    }
  }

  return to

  function vote(line: KeyedToken[]): number {
    let votes = new Map<number, number>()
    for (let token of line) {
      let source = matched.has(token) ? sourceByKey.get(token.key) : undefined
      if (source) {
        let sourceLine = fromPositions.get(source)!.line
        votes.set(sourceLine, (votes.get(sourceLine) ?? 0) + 1)
      }
    }
    let best = -1
    let bestVotes = 0
    for (let [sourceLine, count] of votes) {
      if (count > bestVotes) {
        best = sourceLine
        bestVotes = count
      }
    }
    return best
  }

  function distance(
    candidate: KeyedToken,
    wantedLine: number,
    target: Position,
  ): number {
    let position = fromPositions.get(candidate)!
    return (
      Math.abs(position.line - wantedLine) * 1000 +
      Math.abs(position.column - target.column)
    )
  }
}

function getPositions(lines: KeyedToken[][]): Map<KeyedToken, Position> {
  let positions = new Map<KeyedToken, Position>()
  for (let [line, tokens] of lines.entries()) {
    let column = 0
    for (let token of tokens) {
      positions.set(token, { column, line })
      column += token.content.length
    }
  }
  return positions
}

function groupBy<T, K>(
  items: Iterable<T>,
  getKey: (item: T) => K,
): Map<K, T[]> {
  let groups = new Map<K, T[]>()
  for (let item of items) {
    let key = getKey(item)
    let group = groups.get(key)
    if (group) {
      group.push(item)
    } else {
      groups.set(key, [item])
    }
  }
  return groups
}

function splitLines(tokens: KeyedToken[]): KeyedToken[][] {
  let lines: KeyedToken[][] = [[]]
  for (let token of tokens) {
    lines.at(-1)!.push(token)
    if (token.content === '\n') {
      lines.push([])
    }
  }
  return lines
}

/**
 * Joins token texts with a separator, so lines with the same text but split
 * into different tokens never count as identical.
 *
 * @param line - Tokens of one line.
 * @returns Line signature.
 */
function getSignature(line: KeyedToken[]): string {
  return line.map(token => token.content).join('\u{0}')
}
