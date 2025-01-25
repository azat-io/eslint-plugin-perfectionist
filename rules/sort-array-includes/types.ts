import type { JSONSchema4 } from '@typescript-eslint/utils/json-schema'

import type {
  PartitionByCommentOption,
  NewlinesBetweenOption,
  CommonOptions,
  GroupsOptions,
  TypeOption,
} from '../../types/common-options'

import {
  buildCustomGroupSelectorJsonSchema,
  elementNamePatternJsonSchema,
} from '../../utils/common-json-schemas'

export type Options = Partial<
  {
    useConfigurationIf: {
      allNamesMatchPattern?: string
    }
    /**
     * @deprecated for {@link `groups`}
     */
    groupKind: 'literals-first' | 'spreads-first' | 'mixed'
    partitionByComment: PartitionByCommentOption
    newlinesBetween: NewlinesBetweenOption
    type: TypeOption | 'unsorted'
    groups: GroupsOptions<Group>
    customGroups: CustomGroup[]
    partitionByNewLine: boolean
  } & CommonOptions
>[]

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
