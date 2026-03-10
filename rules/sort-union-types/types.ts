import type { JSONSchema4 } from '@typescript-eslint/utils/json-schema'

import type { RegexOption, TypeOption } from '../../types/common-options'
import type { AllCommonOptions } from '../../types/all-common-options'

import { buildCustomGroupSelectorJsonSchema } from '../../utils/json-schemas/common-groups-json-schemas'

/**
 * Configuration options for the sort-union-types rule.
 *
 * Controls how TypeScript union type members are sorted.
 */
export type Options = Partial<
  {
    /**
     * Conditional configuration based on pattern matching.
     */
    useConfigurationIf: {
      /**
       * Regular expression pattern to match against all member names. The rule
       * is only applied when all member names match this pattern.
       */
      allNamesMatchPattern?: RegexOption

      /**
       * AST selector to match against TSUnionType or TSIntersectionType nodes.
       */
      matchesAstSelector?: string
    }
  } & AllCommonOptions<
    TypeOption,
    AdditionalSortOptions,
    CustomGroupMatchOptions
  >
>[]

/**
 * Union type of all available selectors for union type members.
 *
 * Selectors categorize different kinds of TypeScript types that can appear in a
 * union, enabling fine-grained control over sorting.
 */
export type Selector = (typeof allSelectors)[number]

/**
 * Match options for a custom group.
 */
interface CustomGroupMatchOptions {
  /**
   * The selector type this group matches. Determines what kind of type members
   * belong to this group.
   */
  selector?: Selector
}

type AdditionalSortOptions = object

/**
 * Array of all available selectors for union type members.
 *
 * Used for validation and configuration in the ESLint rule.
 */
export let allSelectors = [
  'intersection',
  'conditional',
  'function',
  'operator',
  'keyword',
  'literal',
  'nullish',
  'import',
  'object',
  'named',
  'tuple',
  'union',
] as const

/**
 * Additional custom group match options JSON schema. Used by ESLint to validate
 * rule options at configuration time.
 */
export let additionalCustomGroupMatchOptionsJsonSchema: Record<
  string,
  JSONSchema4
> = {
  selector: buildCustomGroupSelectorJsonSchema(allSelectors),
}
