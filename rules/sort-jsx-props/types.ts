import type {
  DeprecatedCustomGroupsOption,
  NewlinesBetweenOption,
  CommonOptions,
  GroupsOptions,
  RegexOption,
} from '../../types/common-options'
import type { JoinWithDash } from '../../types/join-with-dash'

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

export interface SingleCustomGroup {
  elementValuePattern?: RegexOption
  elementNamePattern?: RegexOption
  modifiers?: Modifier[]
  selector?: Selector
}

export type Selector = MultilineSelector | ShorthandSelector | PropertySelector

export type Modifier = MultilineModifier | ShorthandModifier

type PropertyGroup = JoinWithDash<
  [ShorthandModifier, MultilineModifier, PropertySelector]
>

/**
 * Only used in code, so I don't know if it's worth maintaining this.
 */
type Group =
  | ShorthandGroup
  | MultilineGroup
  | PropertyGroup
  | 'unknown'
  | string

/**
 * @deprecated For {@link `MultilineModifier`}
 */
type MultilineGroup = JoinWithDash<[MultilineSelector]>

/**
 * @deprecated For {@link `ShorthandModifier`}
 */
type ShorthandGroup = JoinWithDash<[ShorthandSelector]>

/**
 * @deprecated For {@link `ShorthandModifier`}
 */
type ShorthandSelector = 'shorthand'

/**
 * @deprecated For {@link `MultilineModifier`}
 */
type MultilineSelector = 'multiline'

type MultilineModifier = 'multiline'

type ShorthandModifier = 'shorthand'

type PropertySelector = 'prop'

export let allSelectors: Selector[] = ['multiline', 'prop', 'shorthand']

export let allModifiers: Modifier[] = ['shorthand', 'multiline']
