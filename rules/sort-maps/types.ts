export type Options = Partial<{
  partitionByComment:
    | {
        block?: string[] | boolean | string
        line?: string[] | boolean | string
      }
    | string[]
    | boolean
    | string
  type: 'alphabetical' | 'line-length' | 'natural' | 'custom'
  specialCharacters: 'remove' | 'trim' | 'keep'
  locales: NonNullable<Intl.LocalesArgument>
  partitionByNewLine: boolean
  order: 'desc' | 'asc'
  ignoreCase: boolean
  alphabet: string
}>[]
