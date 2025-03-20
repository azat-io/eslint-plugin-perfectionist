import type {
  DeprecatedCustomGroupsOption,
  NewlinesBetweenOption,
  CommonOptions,
  GroupsOptions,
  RegexOption,
} from '../../types/common-options'

export type Options = Partial<
  {
    useConfigurationIf: {
      allNamesMatchPattern?: RegexOption
      tagMatchesPattern?: RegexOption
    }
    customGroups: DeprecatedCustomGroupsOption
    newlinesBetween: NewlinesBetweenOption
    groups: GroupsOptions<Group>
    partitionByNewLine: boolean
    /**
     * @deprecated for {@link `useConfigurationIf.tagMatchesPattern`}
     */
    ignorePattern: RegexOption
  } & CommonOptions
>[]

type Group = 'multiline' | 'shorthand' | 'unknown' | string
