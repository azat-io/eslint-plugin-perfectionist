import type { JSONSchema4 } from '@typescript-eslint/utils/json-schema'

import {
  buildCustomGroupSelectorJsonSchema,
  elementNamePatternJsonSchema,
} from '../utils/common-json-schemas'

export type Options = Partial<{
  type: 'alphabetical' | 'line-length' | 'unsorted' | 'natural' | 'custom'
  useConfigurationIf: {
    allNamesMatchPattern?: string
  }
  /**
   * @deprecated for {@link `groups`}
   */
  groupKind: 'literals-first' | 'spreads-first' | 'mixed'
  partitionByComment: string[] | boolean | string
  specialCharacters: 'remove' | 'trim' | 'keep'
  locales: NonNullable<Intl.LocalesArgument>
  customGroups: CustomGroup[]
  partitionByNewLine: boolean
  groups: (Group[] | Group)[]
  order: 'desc' | 'asc'
  ignoreCase: boolean
  alphabet: string
}>[]

export interface SingleCustomGroup {
  elementNamePattern?: string
  selector?: Selector
}

export interface AnyOfCustomGroup {
  anyOf: SingleCustomGroup[]
}

export type Selector = LiteralSelector | SpreadSelector

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

type LiteralSelector = 'literal'

type Group = 'unknown' | string

type SpreadSelector = 'spread'

export let allSelectors: Selector[] = ['literal', 'spread']

export let singleCustomGroupJsonSchema: Record<string, JSONSchema4> = {
  selector: buildCustomGroupSelectorJsonSchema(allSelectors),
  elementNamePattern: elementNamePatternJsonSchema,
}
