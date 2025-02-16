export type CustomGroupsOption<SingleCustomGroup = object> = ({
  newlinesInside?: 'always' | 'never'
  fallbackSort?: FallbackSortOption
  groupName: string
} & (AnyOfCustomGroup<SingleCustomGroup> | SingleCustomGroup) & {
    order?: OrderOption
    type?: TypeOption
  })[]

export interface CommonOptions {
  specialCharacters: SpecialCharactersOption
  locales: NonNullable<Intl.LocalesArgument>
  fallbackSort: FallbackSortOption
  ignoreCase: boolean
  order: OrderOption
  alphabet: string
}

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

export type GroupsOptions<T> = (
  | { newlinesBetween: NewlinesBetweenOption }
  | T[]
  | T
)[]

export interface AnyOfCustomGroup<SingleCustomGroup> {
  anyOf: SingleCustomGroup[]
}

export interface FallbackSortOption {
  order?: OrderOption
  type: TypeOption
}

export type DeprecatedCustomGroupsOption = Record<string, string[] | string>

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
