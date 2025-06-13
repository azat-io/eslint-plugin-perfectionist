import type { RegexOption } from '../types/common-options'

import { matches } from './matches'

/**
 * Configuration options with conditional application criteria.
 *
 * Allows defining conditions under which a specific configuration should be
 * applied to a set of nodes.
 */
interface Options {
  /** Conditions that must be met for this configuration to apply. */
  useConfigurationIf?: {
    /**
     * Pattern that all node names must match for this configuration to apply.
     * If not specified or if all names match, the configuration is used.
     */
    allNamesMatchPattern?: RegexOption
  }
}

/**
 * Filters context options based on whether all node names match the specified
 * pattern.
 *
 * Returns only those context options whose `allNamesMatchPattern` condition is
 * satisfied by all provided node names. This allows applying different sorting
 * configurations based on the content being sorted.
 *
 * The function returns a configuration if:
 *
 * - No `allNamesMatchPattern` is specified (applies to everything)
 * - All node names match the specified pattern.
 *
 * @example
 *   const contextOptions = [
 *     {
 *       type: 'natural',
 *       useConfigurationIf: { allNamesMatchPattern: '^get' },
 *     },
 *     {
 *       type: 'alphabetical',
 *       useConfigurationIf: { allNamesMatchPattern: '^set' },
 *     },
 *     { type: 'line-length' }, // No condition, always matches
 *   ]
 *
 *   const nodeNames = ['getName', 'getAge', 'getEmail']
 *   filterOptionsByAllNamesMatch({ contextOptions, nodeNames })
 *   // Returns: [
 *   //   {
 *   //     type: 'natural',
 *   //     useConfigurationIf: { allNamesMatchPattern: '^get' },
 *   //   },
 *   //   {
 *   //     type: 'line-length'
 *   //   }
 *   // ]
 *
 * @example
 *   const nodeNames = ['setName', 'setAge']
 *   filterOptionsByAllNamesMatch({ contextOptions, nodeNames })
 *   // Returns: [
 *   //   {
 *   //     type: 'alphabetical',
 *   //     useConfigurationIf: { allNamesMatchPattern: '^set' },
 *   //   },
 *   //   {
 *   //     type: 'line-length'
 *   //   }
 *   // ]
 *
 * @template T - Type of the options object extending the base Options
 *   interface.
 * @param params - Parameters object.
 * @param params.contextOptions - Array of configuration options to filter.
 * @param params.nodeNames - Array of node names to test against patterns.
 * @returns Array of context options that match the conditions.
 */
export function filterOptionsByAllNamesMatch<T extends Options>({
  contextOptions,
  nodeNames,
}: {
  contextOptions: T[]
  nodeNames: string[]
}): T[] {
  return contextOptions.filter(options => {
    let allNamesMatchPattern = options.useConfigurationIf?.allNamesMatchPattern
    return (
      !allNamesMatchPattern ||
      nodeNames.every(nodeName => matches(nodeName, allNamesMatchPattern))
    )
  })
}
