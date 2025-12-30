import type { JSONSchema4 } from '@typescript-eslint/utils/json-schema'
import type { TSESTree } from '@typescript-eslint/types'

import { AST_NODE_TYPES } from '@typescript-eslint/utils'

import type {
  CommonOptions,
  RegexOption,
  TypeOption,
} from '../../types/common-options'
import type { CommonPartitionOptions } from '../../types/common-partition-options'
import type { CommonGroupsOptions } from '../../types/common-groups-options'
import type { ScopedRegexOption } from '../../types/scoped-regex-option'
import type { SortingNode } from '../../types/sorting-node'
import type { NodeOfType } from '../../types/node-of-type'

import {
  buildCustomGroupModifiersJsonSchema,
  buildCustomGroupSelectorJsonSchema,
} from '../../utils/json-schemas/common-groups-json-schemas'
import { buildRegexJsonSchema } from '../../utils/json-schemas/common-json-schemas'

/**
 * Configuration options for the sort-object-types rule.
 *
 * Controls how object type properties, methods, and index signatures are sorted
 * within TypeScript type literals and interfaces.
 */
export type Options = Partial<
  {
    /**
     * Conditional configuration based on pattern matching. Allows applying the
     * rule only when specific conditions are met.
     */
    useConfigurationIf: {
      /**
       * Regular expression pattern to match against the comment declaration.
       * The rule is only applied to declaration comments with matching names.
       */
      declarationCommentMatchesPattern?: ScopedRegexOption

      /**
       * Regular expression pattern to match against the type declaration name.
       * The rule is only applied to declarations with matching names.
       */
      declarationMatchesPattern?: ScopedRegexOption

      /**
       * Regular expression pattern to match against all member names. The rule
       * is only applied when all member names match this pattern.
       */
      allNamesMatchPattern?: RegexOption

      /**
       * Specifies whether to only match types that have exclusively numeric
       * keys.
       */
      hasNumericKeysOnly?: boolean
    }
  } & CommonGroupsOptions<
    SingleCustomGroup,
    { sortBy?: SortByOption },
    TypeOption
  > &
    CommonOptions<TypeOption, { sortBy: SortByOption }> &
    CommonPartitionOptions
>[]

/**
 * Extended sorting node for object type members.
 *
 * Represents an object type member with additional metadata needed for sorting,
 * including whether the member is optional/required and its type annotation
 * value.
 */
export interface SortObjectTypesSortingNode extends SortingNode<TSESTree.TypeElement> {
  /**
   * The string representation of the member's type annotation. Used when
   * sorting by value instead of name.
   */
  value: string
}

type SortByOption = 'value' | 'name'

export let objectTypeParentTypes = [
  AST_NODE_TYPES.TSTypeAliasDeclaration,
  AST_NODE_TYPES.TSInterfaceDeclaration,
  AST_NODE_TYPES.TSPropertySignature,
  AST_NODE_TYPES.VariableDeclarator,
  AST_NODE_TYPES.PropertyDefinition,
] as const
export type ObjectTypeParentType = (typeof objectTypeParentTypes)[number]
export type ObjectTypeParent = NodeOfType<ObjectTypeParentType>

/**
 * Union type of all available selectors for object type members.
 *
 * Selectors identify the type of object member for grouping and sorting
 * purposes.
 */
export type Selector = (typeof allSelectors)[number]

/**
 * Union type of all available modifiers for object type members.
 *
 * Modifiers provide additional context about member characteristics, such as
 * whether they are optional, required, or span multiple lines.
 */
export type Modifier = (typeof allModifiers)[number]

/** Additional configuration for a single custom group. */
interface SingleCustomGroup {
  /**
   * Regular expression pattern to match against the member's type annotation
   * value. Only applicable to properties.
   */
  elementValuePattern?: RegexOption

  /**
   * Array of modifiers that members must have to match this group. Only
   * modifiers allowed for the specified selector type are valid.
   */
  modifiers?: Modifier[]

  /**
   * The selector type this group matches. Determines what kind of object
   * members belong to this group.
   */
  selector?: Selector
}

/**
 * Array of all available selectors for object type members.
 *
 * Used for validation and configuration in the ESLint rule.
 */
export let allSelectors = [
  'index-signature',
  'member',
  'method',
  'property',
] as const

/**
 * Array of all available modifiers for object type members.
 *
 * Used for validation and configuration in the ESLint rule.
 */
export let allModifiers = ['optional', 'required', 'multiline'] as const

/**
 * JSON Schema definition for the sortBy configuration option.
 *
 * Validates the sortBy parameter in ESLint rule configuration.
 */
export let sortByJsonSchema: JSONSchema4 = {
  enum: ['name', 'value'],
  type: 'string',
}

/**
 * JSON Schema definitions for single custom group configurations.
 *
 * Provides additional schema properties specific to the sort-object-types rule,
 * extending the base custom group schema with element patterns and sorting
 * options.
 *
 * Note: Ideally, we should generate as many schemas as there are selectors, and
 * ensure that users do not enter invalid modifiers for a given selector.
 */
export let singleCustomGroupJsonSchema: Record<string, JSONSchema4> = {
  modifiers: buildCustomGroupModifiersJsonSchema(allModifiers),
  selector: buildCustomGroupSelectorJsonSchema(allSelectors),
  elementValuePattern: buildRegexJsonSchema(),
}
