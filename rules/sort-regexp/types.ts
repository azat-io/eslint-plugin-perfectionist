import type { JSONSchema4 } from '@typescript-eslint/utils/json-schema'

import type {
  CustomGroupsOption,
  CommonOptions,
  GroupsOptions,
  RegexOption,
} from '../../types/common-options'

import {
  buildCustomGroupSelectorJsonSchema,
  regexJsonSchema,
} from '../../utils/common-json-schemas'

/**
 * Configuration options for the sort-regexp rule.
 *
 * Controls how alternation branches inside regular expression literals are
 * sorted, while still supporting the shared Perfectionist sorting options and
 * custom grouping capabilities.
 */
export type Options = [
  Partial<
    {
      /**
       * Custom groups used to arrange alternation branches based on alias names
       * or pattern content.
       */
      customGroups: CustomGroupsOption<SingleCustomGroup>

      /** Describes the group ordering applied during sorting. */
      groups: GroupsOptions<Group>

      /**
       * Determines whether named capturing group aliases (e.g. `(?<alias>...)`)
       * should be ignored during comparisons.
       */
      ignoreAlias: boolean
    } & CommonOptions
  >,
]

/** Configuration for a single custom group of alternation branches. */
export interface SingleCustomGroup {
  /** Regular expression pattern that matches the full branch text. */
  elementValuePattern?: RegexOption

  /** Regular expression pattern that matches the alias name (`?<alias>`). */
  elementNamePattern?: RegexOption

  /**
   * Branch selector. `alias` targets named groups, `pattern` targets other
   * branches.
   */
  selector?: Selector
}

/** Available selectors for alternation branches. */
export type Selector = 'pattern' | 'alias'

/** No modifiers are currently defined for regex branches. */
export type Modifier = never

/** Complete selector list used for validation and schema generation. */
export let allSelectors: Selector[] = ['alias', 'pattern']

/** No modifiers exist, but export an empty array for API consistency. */
export let allModifiers: Modifier[] = []

/** JSON schema describing a single custom group configuration. */
export let singleCustomGroupJsonSchema: Record<string, JSONSchema4> = {
  selector: buildCustomGroupSelectorJsonSchema(allSelectors),
  elementValuePattern: regexJsonSchema,
  elementNamePattern: regexJsonSchema,
}

/** Built-in group identifiers. Custom group names are also allowed at runtime. */
export type Group = 'pattern' | 'unknown' | 'alias' | string
