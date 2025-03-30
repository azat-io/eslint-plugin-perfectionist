import type {
  DeprecatedCustomGroupsOption,
  CommonOptions,
  GroupsOptions,
} from '../../types/common-options'

export type Options = Partial<
  {
    customGroups: DeprecatedCustomGroupsOption
    groups: GroupsOptions<Group>
  } & CommonOptions
>[]

type Group = 'unknown' | string
