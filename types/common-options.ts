export type CustomGroupsOption<
  SingleCustomGroup = object,
  AdditionalOptions = Record<never, never>,
> = ({
  newlinesInside?: 'always' | 'never'
  fallbackSort?: FallbackSortOption
  order?: OrderOption
  groupName: string
  type?: TypeOption
} & (AnyOfCustomGroup<SingleCustomGroup> | SingleCustomGroup) &
  AdditionalOptions)[]

export interface CommonOptions {
  specialCharacters: SpecialCharactersOption
  locales: NonNullable<Intl.LocalesArgument>
  fallbackSort: FallbackSortOption
  ignoreCase: boolean
  order: OrderOption
  alphabet: string
  type: TypeOption
}

export type GroupsOptions<T> = (
  | (GroupNewlinesBetweenOption & GroupCommentAboveOption)
  | GroupNewlinesBetweenOption
  | GroupCommentAboveOption
  | T[]
  | T
)[]

export type PartitionByCommentOption =
  | {
      block?: RegexOption | boolean
      line?: RegexOption | boolean
    }
  | RegexOption
  | boolean

export type TypeOption =
  | 'alphabetical'
  | 'line-length'
  | 'unsorted'
  | 'natural'
  | 'custom'

export interface GroupNewlinesBetweenOption {
  newlinesBetween: NewlinesBetweenOption
}

export interface AnyOfCustomGroup<SingleCustomGroup> {
  anyOf: SingleCustomGroup[]
}

export interface FallbackSortOption {
  order?: OrderOption
  type: TypeOption
}

export type DeprecatedCustomGroupsOption = Record<string, string[] | string>

export interface GroupCommentAboveOption {
  commentAbove: string
}

export type RegexOption = SingleRegexOption[] | SingleRegexOption

export type NewlinesBetweenOption = 'ignore' | 'always' | 'never'

export type SpecialCharactersOption = 'remove' | 'trim' | 'keep'

export type OrderOption = 'desc' | 'asc'

type SingleRegexOption =
  | {
      pattern: string
      flags?: string
    }
  | string
