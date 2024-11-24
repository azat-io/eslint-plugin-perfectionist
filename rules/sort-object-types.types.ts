import type { JSONSchema4 } from '@typescript-eslint/utils/json-schema'

export type Options = [
  Partial<{
    customGroups: Record<string, string[] | string> | CustomGroup[]
    /**
     * @deprecated for {@link `groups`}
     */
    groupKind: 'required-first' | 'optional-first' | 'mixed'
    type: 'alphabetical' | 'line-length' | 'natural'
    partitionByComment: string[] | boolean | string
    newlinesBetween: 'ignore' | 'always' | 'never'
    specialCharacters: 'remove' | 'trim' | 'keep'
    locales: NonNullable<Intl.LocalesArgument>
    groups: (Group[] | Group)[]
    partitionByNewLine: boolean
    order: 'desc' | 'asc'
    ignoreCase: boolean
  }>,
]

export type CustomGroup = (
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

export type SingleCustomGroup = (
  | BaseSingleCustomGroup<MultilineSelector>
  | BaseSingleCustomGroup<MethodSelector>
) &
  ElementNamePatternFilterCustomGroup

export interface AnyOfCustomGroup {
  anyOf: SingleCustomGroup[]
}

export type Modifier = RequiredModifier | OptionalModifier

export type Selector = MultilineSelector | MethodSelector

/**
 * Only used in code as well
 */
interface AllowedModifiersPerSelector {
  multiline: OptionalModifier | RequiredModifier
  method: OptionalModifier | RequiredModifier
}

interface BaseSingleCustomGroup<T extends Selector> {
  modifiers?: AllowedModifiersPerSelector[T][]
  selector?: T
}

type MultilineGroup =
  `${OptionalModifierPrefix | RequiredModifierPrefix}${MultilineSelector}`

type MethodGroup =
  `${OptionalModifierPrefix | RequiredModifierPrefix}${MethodSelector}`

interface ElementNamePatternFilterCustomGroup {
  elementNamePattern?: string
}

type RequiredModifierPrefix = WithDashSuffixOrEmpty<RequiredModifier>
type OptionalModifierPrefix = WithDashSuffixOrEmpty<OptionalModifier>

/**
 * Only used in code, so I don't know if it's worth maintaining this.
 */
type Group = MultilineGroup | MethodGroup | 'unknown' | string

type WithDashSuffixOrEmpty<T extends string> = `${T}-` | ''

type MultilineSelector = 'multiline'

type RequiredModifier = 'required'

type OptionalModifier = 'optional'

type MethodSelector = 'method'

export let allSelectors: Selector[] = ['method', 'multiline']

export let allModifiers: Modifier[] = ['optional', 'required']

export let customGroupSortJsonSchema: Record<string, JSONSchema4> = {
  type: {
    enum: ['alphabetical', 'line-length', 'natural', 'unsorted'],
    description: 'Custom group sort type.',
    type: 'string',
  },
  order: {
    description: 'Custom group sort order.',
    enum: ['desc', 'asc'],
    type: 'string',
  },
}

export let customGroupNameJsonSchema: Record<string, JSONSchema4> = {
  groupName: {
    description: 'Custom group name.',
    type: 'string',
  },
}

/**
 * Ideally, we should generate as many schemas as there are selectors, and ensure
 * that users do not enter invalid modifiers for a given selector
 */
export let singleCustomGroupJsonSchema: Record<string, JSONSchema4> = {
  modifiers: {
    items: {
      enum: allModifiers,
      type: 'string',
    },
    description: 'Modifier filters.',
    type: 'array',
  },
  selector: {
    description: 'Selector filter.',
    enum: allSelectors,
    type: 'string',
  },
  elementNamePattern: {
    description: 'Element name pattern filter.',
    type: 'string',
  },
}
