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

export type TypeOption = 'alphabetical' | 'line-length' | 'natural' | 'custom'

export type NewlinesBetweenOption = 'ignore' | 'always' | 'never'

export type SpecialCharactersOption = 'remove' | 'trim' | 'keep'

export type OrderOption = 'desc' | 'asc'
