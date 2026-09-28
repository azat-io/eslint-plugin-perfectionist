import type { SortingNode } from '../../../types/sorting-node'

import { isGroupWithOverridesOption } from '../../../utils/is-group-with-overrides-option'
import { getGroupIndex } from '../../../utils/get-group-index'

/**
 * One element of a sorted block.
 */
export interface InspectedElement {
  /**
   * The element has an `eslint-disable` comment, so the rule keeps it in place.
   */
  disabled: boolean

  /**
   * Partition of the element. Elements of different partitions are sorted
   * separately.
   */
  partition: number

  /**
   * Group the rule put the element into.
   */
  group: string

  /**
   * Offset of the first character.
   */
  start: number

  /**
   * Index of the entry of `groups` the element belongs to, or the length of
   * `groups` when no entry matches.
   */
  slot: number

  /**
   * Name of the element, as in problem messages.
   */
  name: string

  /**
   * Offset after the last character.
   */
  end: number
}

/**
 * One block a rule sorted, such as the imports of a file or the keys of one
 * object, with the group of each element.
 */
export interface InspectedBlock {
  /**
   * Elements of the block in the order of the code.
   */
  elements: InspectedElement[]

  /**
   * Groups from the rule options, in order. Each entry lists the names of one
   * group; an array group puts several names into one.
   */
  groups: string[][]

  /**
   * Rule name without the plugin prefix.
   */
  rule: string
}

/**
 * What the rules pass to `reportAllErrors` that the inspector needs.
 */
interface BlockParameters {
  /**
   * Resolved rule options.
   */
  options: { groups: Group[] }

  /**
   * Rule context.
   */
  context: { id: string }

  /**
   * Elements of the block in the order of the code.
   */
  nodes: SortingNode[]
}

/**
 * Entry of the `groups` option.
 */
type Group = Parameters<typeof getGroupIndex>[0][number]

let pluginPrefix = 'perfectionist/'

/**
 * Blocks collected while `verify` runs, or `null` outside of it.
 */
let collected: InspectedBlock[] | null = null

/**
 * Records a block a rule is about to report on. The Playground build points the
 * rules' `reportAllErrors` to a wrapper that calls this first.
 *
 * @param parameters - Parameters the rule passed to `reportAllErrors`.
 */
export function recordBlock({
  options,
  context,
  nodes,
}: BlockParameters): void {
  if (!collected || nodes.length === 0) {
    return
  }
  let entries = options.groups.flatMap((entry, index) => {
    let names = getGroupNames(entry)
    return names ? [{ index, names }] : []
  })
  let slots = new Map(entries.map((entry, slot) => [entry.index, slot]))
  collected.push({
    elements: nodes.map(node => ({
      slot: slots.get(getGroupIndex(options.groups, node)) ?? entries.length,
      disabled: node.isEslintDisabled,
      partition: node.partitionId,
      start: node.node.range[0],
      end: node.node.range[1],
      group: node.group,
      name: node.name,
    })),
    rule: context.id.replace(pluginPrefix, ''),
    groups: entries.map(entry => entry.names),
  })
}

/**
 * Stops collecting blocks.
 *
 * @returns Blocks collected since the start.
 */
export function stopInspection(): InspectedBlock[] {
  let blocks = collected ?? []
  collected = null
  return blocks
}

/**
 * Starts collecting blocks. Autofix passes run the rules again on changed code,
 * so collecting stops before them.
 */
export function startInspection(): void {
  collected = []
}

/**
 * Returns the group names of an entry of the `groups` option.
 *
 * @param entry - Entry of `groups`.
 * @returns Names, or `null` for an entry that only sets newlines.
 */
function getGroupNames(entry: Group): string[] | null {
  if (typeof entry === 'string') {
    return [entry]
  }
  if (Array.isArray(entry)) {
    return entry
  }
  if (isGroupWithOverridesOption(entry)) {
    return typeof entry.group === 'string' ? [entry.group] : entry.group
  }
  return null
}
