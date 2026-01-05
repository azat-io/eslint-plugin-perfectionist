import type {
  FallbackSortOption,
  OrderOption,
  RegexOption,
} from './common-options'

/**
 * Configuration for custom groups with sorting and newline options.
 *
 * Defines custom groups that can override global sorting settings and specify
 * how elements should be organized. Each custom group can have its own sorting
 * algorithm, order, and newline handling behavior.
 *
 * @example
 *   const customGroups: CustomGroupsOption = [
 *     {
 *       groupName: 'react',
 *       anyOf: ['react', 'react-*'],
 *       type: 'alphabetical',
 *       order: 'asc',
 *       newlinesInside: 1,
 *     },
 *     {
 *       groupName: 'lodash',
 *       anyOf: ['lodash', 'lodash/*'],
 *       fallbackSort: { type: 'natural' },
 *     },
 *   ]
 *
 * @template MatchOptions - Options for matching elements to the custom group.
 * @template AdditionalSortProperties - Additional sort options that extend the
 *   base configuration.
 */
export type CustomGroupsOption<
  MatchOptions,
  AdditionalSortProperties,
  CustomTypeOption extends string,
> = ({
  /**
   * Fallback sorting configuration used when primary sort returns equal. Useful
   * for stable sorting when elements have identical primary sort values.
   */
  fallbackSort?: FallbackSortOption<CustomTypeOption, AdditionalSortProperties>

  /** Specify the exact number of newlines required between elements of groups. */
  newlinesInside?: NewlinesInsideOption

  /**
   * Regular expression pattern to match the element's name. Elements matching
   * this pattern will be included in this custom group.
   */
  elementNamePattern?: RegexOption

  /**
   * Sorting algorithm type for this custom group. Overrides the global type
   * setting for elements in this group.
   */
  type?: CustomTypeOption

  /**
   * Sort direction for this custom group. Overrides the global order setting
   * for elements in this group.
   */
  order?: OrderOption

  /**
   * Name identifier for the custom group. Used to reference this group in the
   * groups configuration array.
   */
  groupName: string
} & (AnyOfCustomGroup<MatchOptions> | MatchOptions) &
  AdditionalSortProperties)[]

/**
 * Configuration for groups with overriding settings.
 *
 * @example
 *   const groups = [
 *     'imports',
 *     { group: 'group', commentAbove: '// Component Definitions' },
 *     'components',
 *   ]
 */
export type GroupWithOverridesOption<
  CustomTypeOption extends string,
  AdditionalSortProperties,
> = {
  /**
   * Fallback sorting configuration used when primary sort returns equal. Useful
   * for stable sorting when elements have identical primary sort values.
   */
  fallbackSort?: FallbackSortOption<CustomTypeOption, AdditionalSortProperties>

  /** Specify the exact number of newlines required inside the group. */
  newlinesInside?: NewlinesInsideOption

  /** Name of the group or array of group names for composite groups. */
  group: string[] | string

  /** Same as `type` in CommonOptions - Sorting algorithm to use for this group. */
  type?: CustomTypeOption

  /**
   * Text of the comment to insert above the group. The comment will be
   * formatted as a line comment (// ...).
   */
  commentAbove?: string

  /** Same as `order` in CommonOptions - Sort direction for this group. */
  order?: OrderOption
} & AdditionalSortProperties

export interface CommonGroupsOptions<
  CustomGroupMatchOptions,
  AdditionalSortProperties,
  CustomTypeOption extends string,
> {
  /** Specify the exact number of newlines required between elements of groups. */
  newlinesInside:
    | NewlinesInsideOption
    /**
     * @deprecated The `newlinesBetween` value is deprecated and will be removed
     *   in V6.
     */
    | 'newlinesBetween'

  /** Custom groups for organizing nodes. */
  customGroups: CustomGroupsOption<
    CustomGroupMatchOptions,
    AdditionalSortProperties,
    CustomTypeOption
  >

  /**
   * Defines the order and grouping of nodes. Nodes are sorted within their
   * groups and groups are ordered as specified.
   */
  groups: GroupsOptions<CustomTypeOption, AdditionalSortProperties>

  /** Specify the exact number of newlines required between groups. */
  newlinesBetween: NewlinesBetweenOption
}

/**
 * Configuration for matching multiple patterns in custom groups.
 *
 * Allows a custom group to match elements based on any of several patterns,
 * providing flexibility in how elements are categorized.
 *
 * @example
 *   const customGroup: AnyOfCustomGroup<string> = {
 *     anyOf: ['react', 'react-*', '@react/*'],
 *   }
 *
 * @template MatchOptions - Options for matching elements to the custom group.
 */
export interface AnyOfCustomGroup<MatchOptions> {
  /**
   * Regular expression pattern to match the element's name. Elements matching
   * this pattern will be included in this custom group.
   */
  elementNamePattern?: RegexOption

  /**
   * Array of patterns where matching any single pattern includes the element in
   * the group. Provides OR logic for group membership.
   */
  anyOf: MatchOptions[]
}

/**
 * Configuration for managing newlines between sorted elements.
 *
 * Controls how blank lines are handled between elements, either preserving,
 * enforcing, or removing them based on the configuration.
 *
 * @example
 *   // Always require one blank line between elements
 *   const newlines: NewlinesBetweenOption = 1
 *
 * @example
 *   // Require exactly 2 blank lines
 *   const newlines: NewlinesBetweenOption = 2
 */
export type NewlinesBetweenOption =
  /**
   * Preserve existing newlines without modification. The plugin will not add or
   * remove blank lines.
   */
  | 'ignore'

  /**
   * Require exactly this number of blank lines between elements. Enforces
   * consistent spacing with the specified line count.
   */
  | number

/**
 * Configuration for controlling newlines between groups.
 *
 * Placed between group names in the groups array to specify how many blank
 * lines should separate adjacent groups in the sorted output.
 *
 * @example
 *   const groups = [
 *     'imports',
 *     { newlinesBetween: 1 }, // One newline after imports
 *     'types',
 *   ]
 */
export interface GroupNewlinesBetweenOption {
  /**
   * Specifies the newline requirement between adjacent groups. This option is
   * placed between group names to control their spacing.
   */
  newlinesBetween: NewlinesBetweenOption

  group?: never
}

/**
 * Configuration for organizing elements into groups with optional formatting.
 *
 * Supports flexible group definitions including simple group names, arrays of
 * group names for composite groups, and special configuration objects for
 * controlling newlines and comments between groups.
 *
 * @example
 *   const groups: GroupsOptions<'imports' | 'types' | 'components'> = [
 *     'imports',
 *     { newlinesBetween: 1 },
 *     'types',
 *     { group: 'components', commentAbove: '// Components' }, // Object-based group
 *     ['services', 'hooks'], // Composite group
 *     { newlinesBetween: 2 },
 *     'utils',
 *   ]
 */
export type GroupsOptions<
  CustomTypeOption extends string = string,
  AdditionalSortProperties = object,
> = (
  | GroupWithOverridesOption<CustomTypeOption, AdditionalSortProperties>
  | GroupNewlinesBetweenOption
  | string[]
  | string
)[]

export type NewlinesInsideOption =
  /** Preserve existing newlines without modification. */
  | 'ignore'

  /** Require exactly this number of blank lines between elements of a group. */
  | number
