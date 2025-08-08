import type { JSONSchema4 } from '@typescript-eslint/utils/json-schema'

import type {
  PartitionByCommentOption,
  NewlinesBetweenOption,
  CustomGroupsOption,
  CommonOptions,
  GroupsOptions,
  RegexOption,
} from '../../types/common-options'

import {
  buildCustomGroupSelectorJsonSchema,
  regexJsonSchema,
} from '../../utils/common-json-schemas'

/**
 * Configuration options for the sort-union-types rule.
 *
 * Controls how TypeScript union type members are sorted.
 */
export type Options = Partial<
  {
    /**
     * Custom groups for organizing union type members. Allows defining groups
     * based on type patterns and selectors.
     */
    customGroups: CustomGroupsOption<SingleCustomGroup>

    /**
     * Partition union type members by comment delimiters. Members separated by
     * specific comments are sorted independently.
     */
    partitionByComment: PartitionByCommentOption

    /**
     * Controls the placement of newlines between different groups of union type
     * members.
     */
    newlinesBetween: NewlinesBetweenOption

    /**
     * Defines the order and grouping of union type members. Members are sorted
     * within their groups and groups are ordered as specified.
     */
    groups: GroupsOptions<Group>

    /**
     * Whether to partition union type members by newlines. When true, members
     * separated by empty lines are sorted independently.
     */
    partitionByNewLine: boolean
  } & CommonOptions
>[]

/**
 * Configuration for a single custom group in union type sorting.
 *
 * Allows defining custom groups based on type member patterns and selectors.
 */
export type SingleCustomGroup = {
  /**
   * Regular expression pattern to match against type member names. Only type
   * members with names matching this pattern will be included in the group.
   */
  elementNamePattern?: RegexOption
} & {
  /**
   * The selector type this group matches. Determines what kind of type members
   * belong to this group.
   */
  selector?: Selector
}

/**
 * Union type of all available selectors for union type members.
 *
 * Selectors categorize different kinds of TypeScript types that can appear in a
 * union, enabling fine-grained control over sorting.
 */
export type Selector =
  | IntersectionSelector
  | ConditionalSelector
  | FunctionSelector
  | OperatorSelector
  | KeywordSelector
  | LiteralSelector
  | NullishSelector
  | ImportSelector
  | ObjectSelector
  | NamedSelector
  | TupleSelector
  | UnionSelector

/**
 * Selector for intersection types.
 *
 * Matches TypeScript intersection types like `A & B`.
 */
type IntersectionSelector = 'intersection'

/**
 * Union type of all possible group identifiers for union type members.
 *
 * Groups are used to organize and sort related type members together. Can be
 * selector types, 'unknown' for unmatched members, or custom string
 * identifiers.
 */
type Group = 'unknown' | Selector | string

/**
 * Selector for conditional types.
 *
 * Matches TypeScript conditional types like `T extends U ? X : Y`.
 */
type ConditionalSelector = 'conditional'

/**
 * Selector for function types.
 *
 * Matches function type signatures like `() => void` or `(x: number) =>
 * string`.
 */
type FunctionSelector = 'function'

/**
 * Selector for type operator types.
 *
 * Matches TypeScript type operators like `keyof T`, `typeof x`, `readonly T[]`.
 */
type OperatorSelector = 'operator'

/**
 * Selector for TypeScript keyword types.
 *
 * Matches built-in TypeScript keyword types like `any`, `unknown`, `never`,
 * `void`, `boolean`, `string`, `number`, `bigint`, `symbol`, etc.
 */
type KeywordSelector = 'keyword'

/**
 * Selector for literal types.
 *
 * Matches literal type values like `'foo'`, `42`, `true`, or template literals.
 */
type LiteralSelector = 'literal'

/**
 * Selector for nullish types.
 *
 * Matches `null` and `undefined` types.
 */
type NullishSelector = 'nullish'

/**
 * Selector for import types.
 *
 * Matches TypeScript import types like `import('module').Type`.
 */
type ImportSelector = 'import'

/**
 * Selector for object types.
 *
 * Matches object type literals like `{ x: number; y: string }`.
 */
type ObjectSelector = 'object'

/**
 * Selector for named types.
 *
 * Matches type references by name like `User`, `Array<T>`, or qualified names.
 */
type NamedSelector = 'named'

/**
 * Selector for tuple types.
 *
 * Matches tuple types like `[string, number]` or `[first: string, second:
 * number]`.
 */
type TupleSelector = 'tuple'

/**
 * Selector for nested union types.
 *
 * Matches union types within a union like `(A | B)`.
 */
type UnionSelector = 'union'

/**
 * Array of all available selectors for union type members.
 *
 * Used for validation and configuration in the ESLint rule.
 */
export let allSelectors: Selector[] = [
  'intersection',
  'conditional',
  'function',
  'operator',
  'keyword',
  'literal',
  'nullish',
  'import',
  'object',
  'named',
  'tuple',
  'union',
]

/**
 * JSON Schema definitions for single custom group configurations.
 *
 * Provides additional schema properties specific to the sort-union-types rule,
 * extending the base custom group schema with element name patterns.
 */
export let singleCustomGroupJsonSchema: Record<string, JSONSchema4> = {
  selector: buildCustomGroupSelectorJsonSchema(allSelectors),
  elementNamePattern: regexJsonSchema,
}
