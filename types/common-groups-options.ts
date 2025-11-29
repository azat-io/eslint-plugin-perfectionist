import type {
  NewlinesBetweenOption,
  CustomGroupsOption,
  GroupsOptions,
} from './common-options'

export interface CommonGroupsOptions<SingleCustomGroup> {
  /** Custom groups for organizing nodes. */
  customGroups: CustomGroupsOption<SingleCustomGroup>

  /** Controls the placement of newlines between different groups of nodes. */
  newlinesBetween: NewlinesBetweenOption

  /**
   * Defines the order and grouping of nodes. Nodes are sorted within their
   * groups and groups are ordered as specified.
   */
  groups: GroupsOptions
}
