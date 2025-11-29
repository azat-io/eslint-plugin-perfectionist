import type { JSONSchema4 } from '@typescript-eslint/utils/json-schema'

import type { CommonPartitionOptions } from '../../types/common-partition-options'
import type { CommonOptions, RegexOption } from '../../types/common-options'
import type { CommonGroupsOptions } from '../../types/common-groups-options'

import {
  buildCustomGroupModifiersJsonSchema,
  buildCustomGroupSelectorJsonSchema,
  regexJsonSchema,
} from '../../utils/common-json-schemas'

/**
 * Defines a custom group configuration for class members.
 *
 * Allows categorizing class members based on their selector type (method,
 * property, etc.) and various patterns matching their names, values, or
 * decorators.
 */
export type SingleCustomGroup =
  | AdvancedSingleCustomGroup<FunctionPropertySelector>
  | AdvancedSingleCustomGroup<AccessorPropertySelector>
  | BaseSingleCustomGroup<IndexSignatureSelector>
  | AdvancedSingleCustomGroup<GetMethodSelector>
  | AdvancedSingleCustomGroup<SetMethodSelector>
  | AdvancedSingleCustomGroup<PropertySelector>
  | BaseSingleCustomGroup<StaticBlockSelector>
  | BaseSingleCustomGroup<ConstructorSelector>
  | AdvancedSingleCustomGroup<MethodSelector>

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
 * Maps each selector type to its allowed modifiers.
 *
 * Defines which modifiers are valid for each type of class member, ensuring
 * type safety when configuring custom groups.
 *
 * @internal
 */
interface AllowedModifiersPerSelector {
  /** Valid modifiers for property members. */
  property:
    | PublicOrProtectedOrPrivateModifier
    | DecoratedModifier
    | AbstractModifier
    | OverrideModifier
    | ReadonlyModifier
    | OptionalModifier
    | DeclareModifier
    | StaticModifier

  /** Valid modifiers for method members. */
  method:
    | PublicOrProtectedOrPrivateModifier
    | DecoratedModifier
    | AbstractModifier
    | OverrideModifier
    | OptionalModifier
    | StaticModifier
    | AsyncModifier

  /** Valid modifiers for function properties (arrow functions as properties). */
  'function-property':
    | PublicOrProtectedOrPrivateModifier
    | DecoratedModifier
    | OverrideModifier
    | ReadonlyModifier
    | StaticModifier
    | AsyncModifier

  /** Valid modifiers for accessor properties (auto-accessors). */
  'accessor-property':
    | PublicOrProtectedOrPrivateModifier
    | DecoratedModifier
    | AbstractModifier
    | OverrideModifier
    | StaticModifier

  /** Valid modifiers for setter methods. */
  'set-method':
    | PublicOrProtectedOrPrivateModifier
    | DecoratedModifier
    | AbstractModifier
    | OverrideModifier
    | StaticModifier

  /** Valid modifiers for getter methods (same as setter methods). */
  'get-method': AllowedModifiersPerSelector['set-method']

  /** Valid modifiers for index signatures. */
  'index-signature': ReadonlyModifier | StaticModifier

  /** Valid modifiers for constructors. */
  constructor: PublicOrProtectedOrPrivateModifier

  /** Static blocks don't support any modifiers. */
  'static-block': never
}

/**
 * Extended custom group configuration with pattern matching capabilities.
 *
 * @template T - The selector type this group applies to.
 */
type AdvancedSingleCustomGroup<T extends Selector> = {
  /** Pattern to match decorator names (e.g., '@Component'). */
  decoratorNamePattern?: RegexOption

  /**
   * Pattern to match the value of the member (for properties with
   * initializers).
   */
  elementValuePattern?: RegexOption

  /** Pattern to match the member name. */
  elementNamePattern?: RegexOption
} & BaseSingleCustomGroup<T>

/**
 * Base configuration for a custom group.
 *
 * @template T - The selector type this group applies to.
 */
interface BaseSingleCustomGroup<T extends Selector> {
  /** List of modifiers that members must have to be included in this group. */
  modifiers?: AllowedModifiersPerSelector[T][]
  /** The type of class member this group applies to. */
  selector?: T
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
  elementNamePattern: regexJsonSchema,
}
