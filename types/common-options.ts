export interface CommonOptions {
  specialCharacters: 'remove' | 'trim' | 'keep'
  locales: NonNullable<Intl.LocalesArgument>
  order: 'desc' | 'asc'
  ignoreCase: boolean
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
  | { newlinesBetween: 'ignore' | 'always' | 'never' }
  | T[]
  | T
)[]
