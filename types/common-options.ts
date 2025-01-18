export type PartitionByCommentOption =
  | {
      block?: string[] | boolean | string
      line?: string[] | boolean | string
    }
  | string[]
  | boolean
  | string

export type GroupOptions<T> = (
  | { newlinesBetween: 'ignore' | 'always' | 'never' }
  | T[]
  | T
)[]
