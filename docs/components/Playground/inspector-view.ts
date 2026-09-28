import type { InspectedElement, InspectedBlock } from './inspection'

import { getChangedRange, getLineStarts } from './frame'

/**
 * What the editor draws over the code while the inspector is on.
 */
export interface InspectorView {
  /**
   * Group labels at the end of the first line of each element.
   */
  pills: InspectorPill[]

  /**
   * Colored bars before the lines of each element that starts its line.
   */
  bars: InspectorBar[]

  /**
   * Dashed lines between partitions.
   */
  breaks: number[]
}

/**
 * Label of one element.
 */
interface PillItem {
  /**
   * Name of the element, shown when the line has several elements.
   */
  name: string | null

  /**
   * Index of the group entry, which picks the color, or `null` for elements
   * outside of the groups.
   */
  slot: number | null

  /**
   * The rule keeps the element in place.
   */
  kept: boolean

  /**
   * Text of the label.
   */
  label: string
}

/**
 * Bar next to the lines of one element.
 */
interface InspectorBar {
  /**
   * Index of the group entry, or `null` for elements outside of the groups.
   */
  slot: number | null

  /**
   * Column the element starts at. The bar stands just before it, so bars of
   * nested blocks do not merge.
   */
  column: number

  /**
   * 0-based first line.
   */
  start: number

  /**
   * 0-based last line.
   */
  end: number
}

/**
 * Labels at the end of one line. Several elements can start on one line, such
 * as the keys of a short object.
 */
interface InspectorPill {
  /**
   * Labels, one per element that starts on the line.
   */
  items: PillItem[]

  /**
   * Column after the last character of the line, with tabs expanded.
   */
  column: number

  /**
   * 0-based line.
   */
  line: number
}

/**
 * Tab width of the editor.
 */
const TAB_SIZE = 2

/**
 * Builds what the editor draws for the inspected blocks.
 *
 * @param code - Code on screen.
 * @param blocks - Blocks to show, with offsets into `code`.
 * @returns Pills, bars and partition breaks.
 */
export function toInspectorView(
  code: string,
  blocks: InspectedBlock[],
): InspectorView {
  let lineStarts = getLineStarts(code)
  let lines = code.split(/\r\n|[\n\r\u{2028}\u{2029}]/u)
  let pills = new Map<number, PillItem[]>()
  let breaks: number[] = []
  let bars: InspectorBar[] = []
  for (let block of blocks) {
    let grouped = block.groups.length > 0
    let previous: InspectedElement | null = null
    for (let element of block.elements) {
      let start = findLine(lineStarts, element.start)
      let end = findLine(lineStarts, Math.max(element.start, element.end - 1))
      let slot = element.slot < block.groups.length ? element.slot : null
      if (grouped || element.disabled) {
        let items = pills.get(start) ?? []
        items.push({
          label: element.disabled ? 'kept in place' : element.group,
          kept: element.disabled,
          name: element.name,
          slot,
        })
        pills.set(start, items)
      }
      if (grouped) {
        let before = lines[start]?.slice(0, element.start - lineStarts[start]!)
        if (before?.trim() === '') {
          bars.push({ column: getLineWidth(before), start, slot, end })
        }
      }
      if (previous && previous.partition !== element.partition) {
        let previousEnd = findLine(
          lineStarts,
          Math.max(previous.start, previous.end - 1),
        )
        if (start > previousEnd) {
          breaks.push(getBreakLine(lines, previousEnd, start))
        }
      }
      previous = element
    }
  }
  return {
    pills: [...pills].map(([line, items]) => ({
      items: items.map(item => ({
        ...item,
        name: items.length > 1 ? item.name : null,
      })),
      column: getLineWidth(lines[line] ?? ''),
      line,
    })),
    breaks,
    bars,
  }
}

/**
 * Moves the elements of blocks after an edit, so the inspector stays on its
 * elements until the next lint result arrives. Elements that touch the edited
 * part are dropped.
 *
 * @param blocks - Blocks for the previous code.
 * @param from - Previous code.
 * @param to - Code after the edit.
 * @returns Blocks for the new code.
 */
export function shiftBlocks(
  blocks: InspectedBlock[],
  from: string,
  to: string,
): InspectedBlock[] {
  if (from === to) {
    return blocks
  }
  let { fromEnd, start } = getChangedRange(from, to)
  let delta = to.length - from.length
  return blocks.flatMap(block => {
    let elements = block.elements.flatMap(element => {
      if (element.end <= start) {
        return [element]
      }
      if (element.start >= fromEnd) {
        return [
          {
            ...element,
            start: element.start + delta,
            end: element.end + delta,
          },
        ]
      }
      return []
    })
    return elements.length > 0 ? [{ ...block, elements }] : []
  })
}

/**
 * Picks the block the caret is in: the smallest one that contains it, or the
 * first block of the code when the caret is outside of all of them.
 *
 * @param blocks - Blocks to choose from.
 * @param caret - Offset of the caret, or `null` when the editor never had it.
 * @returns The block, or `null` when there are none.
 */
export function findBlockAt(
  blocks: InspectedBlock[],
  caret: number | null,
): InspectedBlock | null {
  let best: InspectedBlock | null = null
  let bestSize = Infinity
  let first: InspectedBlock | null = null
  let firstStart = Infinity
  for (let block of blocks) {
    let { start, end } = getBlockRange(block)
    if (start < firstStart) {
      first = block
      firstStart = start
    }
    if (
      caret !== null &&
      start <= caret &&
      caret <= end &&
      end - start < bestSize
    ) {
      best = block
      bestSize = end - start
    }
  }
  return best ?? first
}

/**
 * Finds where to draw the line between two partitions: in the middle of the
 * blank lines between them, or on top of the next element.
 *
 * @param lines - Lines of the code.
 * @param previousEnd - Last line of the element before the break.
 * @param nextStart - First line of the element after it.
 * @returns Line position; a fraction lies between two lines.
 */
function getBreakLine(
  lines: string[],
  previousEnd: number,
  nextStart: number,
): number {
  let blank = lines
    .slice(previousEnd + 1, nextStart)
    .flatMap((text, index) =>
      text.trim() === '' ? [previousEnd + 1 + index] : [],
    )
  if (blank.length === 0) {
    return nextStart
  }
  return (blank[0]! + blank.at(-1)! + 1) / 2
}

/**
 * Finds the line of an offset.
 *
 * @param lineStarts - Offsets of line starts in order.
 * @param offset - Offset in the code.
 * @returns 0-based line.
 */
function findLine(lineStarts: number[], offset: number): number {
  let low = 0
  let high = lineStarts.length - 1
  while (low < high) {
    let middle = Math.ceil((low + high) / 2)
    if (lineStarts[middle]! <= offset) {
      low = middle
    } else {
      high = middle - 1
    }
  }
  return low
}

/**
 * Returns the range a block covers.
 *
 * @param block - Block with at least one element.
 * @returns Offsets of its first character and after its last one.
 */
function getBlockRange(block: InspectedBlock): {
  start: number
  end: number
} {
  let start = Infinity
  let end = -Infinity
  for (let element of block.elements) {
    start = Math.min(start, element.start)
    end = Math.max(end, element.end)
  }
  return { start, end }
}

/**
 * Returns the width of a line in columns, with tabs expanded.
 *
 * @param text - Line without its line break.
 * @returns Columns the line takes.
 */
function getLineWidth(text: string): number {
  let width = 0
  for (let character of text) {
    width =
      character === '\t' ?
        (Math.floor(width / TAB_SIZE) + 1) * TAB_SIZE
      : width + 1
  }
  return width
}
