export type PartitionByCommentOption =
  | {
      block?: string[] | boolean | string
      line?: string[] | boolean | string
    }
  | string[]
  | boolean
  | string
