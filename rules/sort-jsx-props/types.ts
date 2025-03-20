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

export type Selector = AttributeSelector | MultilineSelector | ShorthandSelector

export type Modifier = MultilineModifier | ShorthandModifier

type AttributeGroup = JoinWithDash<
  [ShorthandModifier, MultilineModifier, AttributeSelector]
>

/**
 * Only used in code, so I don't know if it's worth maintaining this.
 */
type Group =
  | ShorthandGroup
  | MultilineGroup
  | AttributeGroup
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

type AttributeSelector = 'attribute'

export let allSelectors: Selector[] = ['multiline', 'attribute', 'shorthand']

export let allModifiers: Modifier[] = ['shorthand', 'multiline']
