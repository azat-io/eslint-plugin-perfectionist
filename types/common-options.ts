export type CustomGroupsOption<SingleCustomGroup = object> = ((
  | {
      type?: TypeOption | 'unsorted'
      order?: OrderOption
    }
  | {
      type?: 'unsorted'
    }
) & {
  newlinesInside?: 'always' | 'never'
  fallbackSort?: FallbackSortOption
  groupName: string
} & (AnyOfCustomGroup<SingleCustomGroup> | SingleCustomGroup))[]

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

export type GroupsOptions<T> = (
  | { newlinesBetween: NewlinesBetweenOption }
  | T[]
  | T
)[]

export interface FallbackSortOption {
  type: TypeOption | 'unsorted'
  order?: OrderOption
}

export interface AnyOfCustomGroup<SingleCustomGroup> {
  anyOf: SingleCustomGroup[]
}

export type TypeOption = 'alphabetical' | 'line-length' | 'natural' | 'custom'

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
