export type Options = Partial<{
  partitionByComment:
    | {
        block?: string[] | boolean | string
        line?: string[] | boolean | string
      }
    | string[]
    | boolean
    | string
  useConfigurationIf: {
    callingFunctionNamePattern?: string
    allNamesMatchPattern?: string
  }
  groups: (
    | { newlinesBetween: 'ignore' | 'always' | 'never' }
    | Group[]
    | Group
  )[]
  type: 'alphabetical' | 'line-length' | 'unsorted' | 'natural' | 'custom'
  destructuredObjects: { groups: boolean } | boolean
  customGroups: Record<string, string[] | string>
  newlinesBetween: 'ignore' | 'always' | 'never'
  specialCharacters: 'remove' | 'trim' | 'keep'
  locales: NonNullable<Intl.LocalesArgument>
  partitionByNewLine: boolean
  objectDeclarations: boolean
  styledComponents: boolean
  /**
   * @deprecated for {@link `destructuredObjects`} and {@link `objectDeclarations`}
   */
  destructureOnly: boolean
  ignorePattern: string[]
  order: 'desc' | 'asc'
  ignoreCase: boolean
  alphabet: string
}>[]

type Group = 'multiline' | 'unknown' | 'method' | string
