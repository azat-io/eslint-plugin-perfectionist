import type { JSONSchema4 } from '@typescript-eslint/utils/json-schema'

import type { CommonPartitionOptions } from '../../types/common-partition-options'
import type { CommonOptions, RegexOption } from '../../types/common-options'
import type { CommonGroupsOptions } from '../../types/common-groups-options'

import {
  buildCustomGroupModifiersJsonSchema,
  buildCustomGroupSelectorJsonSchema,
} from '../../utils/json-schemas/common-groups-json-schemas'
import { regexJsonSchema } from '../../utils/json-schemas/common-json-schemas'

/**
 * Configuration options for the sort-classes rule.
 *
 * This rule enforces consistent ordering of class members (properties, methods,
 * constructors, etc.) to improve code readability and maintainability.
 */
export type SortClassesOptions = [
  Partial<
    {
      /**
       * Regex patterns for function names whose callback argument dependencies
       * are ignored during class-member sorting. Dependencies inside these
       * callbacks won't influence the ordering.
       */
      ignoreCallbackDependenciesPatterns: RegexOption
    } & CommonGroupsOptions<SingleCustomGroup> &
      CommonPartitionOptions &
      CommonOptions
  >,
]

/**
 * Union type of all available class member selectors. Used to identify and
 * categorize different types of class members.
 */
export type Selector =
  | AccessorPropertySelector
  | FunctionPropertySelector
  | IndexSignatureSelector
  | ConstructorSelector
  | StaticBlockSelector
  | GetMethodSelector
  | SetMethodSelector
  | PropertySelector
  | MethodSelector

/**
 * Union type of all available class member modifiers. Includes access
 * modifiers, async, static, abstract, and other TypeScript modifiers.
 */
export type Modifier =
  | PublicOrProtectedOrPrivateModifier
  | DecoratedModifier
  | AbstractModifier
  | OverrideModifier
  | OptionalModifier
  | ReadonlyModifier
  | DeclareModifier
  | StaticModifier
  | AsyncModifier

/**
 * Defines a custom group configuration for class members.
 *
 * Allows categorizing class members based on their selector type (method,
 * property, etc.) and various patterns matching their names, values, or
 * decorators.
 */
interface SingleCustomGroup {
  /** Pattern to match decorator names (e.g., '@Component'). */
  decoratorNamePattern?: RegexOption

  /**
   * Pattern to match the value of the member (for properties with
   * initializers).
   */
  elementValuePattern?: RegexOption

  /** List of modifiers that members must have to be included in this group. */
  modifiers?: Modifier[]

  /** The type of class member this group applies to. */
  selector?: Selector
}

/** Union type for access level modifiers. */
type PublicOrProtectedOrPrivateModifier =
  | ProtectedModifier
  | PrivateModifier
  | PublicModifier

/** Selector for function properties (arrow functions assigned to properties). */
type FunctionPropertySelector = 'function-property'

/** Selector for accessor properties (auto-accessors with 'accessor' keyword). */
type AccessorPropertySelector = 'accessor-property'

/** Selector for index signatures. */
type IndexSignatureSelector = 'index-signature'

/** Selector for static initialization blocks. */
type StaticBlockSelector = 'static-block'

/** Selector for class constructors. */
type ConstructorSelector = 'constructor'

/** Selector for getter methods. */
type GetMethodSelector = 'get-method'

/** Selector for setter methods. */
type SetMethodSelector = 'set-method'

/** Modifier for protected members. */
type ProtectedModifier = 'protected'

/** Modifier for decorated members (having decorators). */
type DecoratedModifier = 'decorated'

/** Modifier for abstract members. */
type AbstractModifier = 'abstract'

/** Modifier for overridden members. */
type OverrideModifier = 'override'

/** Modifier for readonly members. */
type ReadonlyModifier = 'readonly'

/** Modifier for optional members. */
type OptionalModifier = 'optional'

/** Selector for regular properties. */
type PropertySelector = 'property'

/** Modifier for private members. */
type PrivateModifier = 'private'

/** Modifier for ambient declarations. */
type DeclareModifier = 'declare'

/** Modifier for public members. */
type PublicModifier = 'public'

/** Modifier for static members. */
type StaticModifier = 'static'

/** Selector for regular methods. */
type MethodSelector = 'method'

/** Modifier for async methods and function properties. */
type AsyncModifier = 'async'

/**
 * Complete list of available class member selectors. Used for validation and
 * JSON schema generation.
 */
export let allSelectors: Selector[] = [
  'accessor-property',
  'index-signature',
  'constructor',
  'static-block',
  'get-method',
  'set-method',
  'function-property',
  'property',
  'method',
]

/**
 * Complete list of available class member modifiers. Used for validation and
 * JSON schema generation.
 */
export let allModifiers: Modifier[] = [
  'async',
  'protected',
  'private',
  'public',
  'static',
  'abstract',
  'override',
  'readonly',
  'decorated',
  'declare',
  'optional',
]

/**
 * JSON schema definition for validating single custom group configurations.
 * Used by ESLint to validate rule options at configuration time.
 *
 * Note: Ideally, we should generate as many schemas as there are selectors, and
 * ensure that users do not enter invalid modifiers for a given selector.
 */
export let singleCustomGroupJsonSchema: Record<string, JSONSchema4> = {
  modifiers: buildCustomGroupModifiersJsonSchema(allModifiers),
  selector: buildCustomGroupSelectorJsonSchema(allSelectors),
  decoratorNamePattern: regexJsonSchema,
  elementValuePattern: regexJsonSchema,
}
