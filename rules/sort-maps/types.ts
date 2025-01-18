import type { JSONSchema4 } from '@typescript-eslint/utils/json-schema'

import { elementNamePatternJsonSchema } from '../../utils/common-json-schemas'

export type Options = Partial<{
  partitionByComment:
    | {
        block?: string[] | boolean | string
        line?: string[] | boolean | string
      }
    | string[]
    | boolean
    | string
  groups: (
    | { newlinesBetween: 'ignore' | 'always' | 'never' }
    | Group[]
    | Group
  )[]
  useConfigurationIf: {
    allNamesMatchPattern?: string
  }
  type: 'alphabetical' | 'line-length' | 'natural' | 'custom'
  newlinesBetween: 'ignore' | 'always' | 'never'
  specialCharacters: 'remove' | 'trim' | 'keep'
  locales: NonNullable<Intl.LocalesArgument>
  partitionByNewLine: boolean
  customGroups: CustomGroup[]
  order: 'desc' | 'asc'
  ignoreCase: boolean
  alphabet: string
}>[]

export interface SingleCustomGroup {
  elementNamePattern?: string
}

export interface AnyOfCustomGroup {
  anyOf: SingleCustomGroup[]
}

type CustomGroup = (
  | {
      order?: Options[0]['order']
      type?: Options[0]['type']
    }
  | {
      type?: 'unsorted'
    }
) &
  (SingleCustomGroup | AnyOfCustomGroup) & {
    groupName: string
  }

type Group = 'unknown' | string

export let singleCustomGroupJsonSchema: Record<string, JSONSchema4> = {
  elementNamePattern: elementNamePatternJsonSchema,
}
