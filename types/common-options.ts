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
  groupName: string
} & (AnyOfCustomGroup<SingleCustomGroup> | SingleCustomGroup))[]

export interface CommonOptions {
  specialCharacters: SpecialCharactersOption
  locales: NonNullable<Intl.LocalesArgument>
  ignoreCase: boolean
  order: OrderOption
  alphabet: string
}

export type PartitionByCommentOption =
  | {
      block?: string[] | boolean | string
      line?: string[] | boolean | string
    }
  | string[]
  | boolean
  | string

export type GroupsOptions<T> = (
  | { newlinesBetween: NewlinesBetweenOption }
  | T[]
  | T
)[]

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
