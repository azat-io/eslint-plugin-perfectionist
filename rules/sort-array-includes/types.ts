import type { JSONSchema4 } from '@typescript-eslint/utils/json-schema'

import type {
  PartitionByCommentOption,
  NewlinesBetweenOption,
  CustomGroupsOption,
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
    customGroups: CustomGroupsOption<SingleCustomGroup>
    partitionByComment: PartitionByCommentOption
    newlinesBetween: NewlinesBetweenOption
    type: TypeOption | 'unsorted'
    groups: GroupsOptions<Group>
    partitionByNewLine: boolean
  } & CommonOptions
>[]

export interface SingleCustomGroup {
  elementNamePattern?: string
  selector?: Selector
}

export type Selector = LiteralSelector | SpreadSelector

type LiteralSelector = 'literal'

type Group = 'unknown' | string

type SpreadSelector = 'spread'

export let allSelectors: Selector[] = ['literal', 'spread']

export let singleCustomGroupJsonSchema: Record<string, JSONSchema4> = {
  selector: buildCustomGroupSelectorJsonSchema(allSelectors),
  elementNamePattern: elementNamePatternJsonSchema,
}
