import type { JSONSchema4 } from '@typescript-eslint/utils/json-schema'

import type { CommonPartitionOptions } from '../../types/common-partition-options'
import type { CommonOptions, RegexOption } from '../../types/common-options'
import type { CommonGroupsOptions } from '../../types/common-groups-options'
import type { JoinWithDash } from '../../types/join-with-dash'

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
    } & CommonGroupsOptions<Group, SingleCustomGroup> &
      CommonPartitionOptions &
      CommonOptions
  >,
]

/**
 * Represents all possible group combinations for non-declare properties.
 * Combines modifiers with the property selector using dash notation.
 */
export type NonDeclarePropertyGroup = JoinWithDash<
  [
    PublicOrProtectedOrPrivateModifier,
    StaticOrAbstractModifier,
    OverrideModifier,
    ReadonlyModifier,
    DecoratedModifier,
    OptionalModifier,
    PropertySelector,
  ]
>

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
 * Represents all possible group combinations for function properties. Combines
 * modifiers with the function-property selector using dash notation.
 */
export type FunctionPropertyGroup = JoinWithDash<
  [
    PublicOrProtectedOrPrivateModifier,
    StaticModifier,
    OverrideModifier,
    ReadonlyModifier,
    DecoratedModifier,
    AsyncModifier,
    FunctionPropertySelector,
  ]
>

/**
 * Represents all possible group combinations for methods. Combines modifiers
 * with the method selector using dash notation.
 */
export type MethodGroup = JoinWithDash<
  [
    PublicOrProtectedOrPrivateModifier,
    StaticOrAbstractModifier,
    OverrideModifier,
    DecoratedModifier,
    AsyncModifier,
    OptionalModifier,
    MethodSelector,
  ]
>

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
 * Represents all possible group combinations for declare properties. Combines
 * modifiers with the property selector using dash notation.
 */
export type DeclarePropertyGroup = JoinWithDash<
  [
    DeclareModifier,
    PublicOrProtectedOrPrivateModifier,
    StaticOrAbstractModifier,
    ReadonlyModifier,
    OptionalModifier,
    PropertySelector,
  ]
>

/**
 * Represents all possible group combinations for getter and setter methods.
 * Combines modifiers with get-method or set-method selectors using dash
 * notation.
 */
export type GetMethodOrSetMethodGroup = JoinWithDash<
  [
    PublicOrProtectedOrPrivateModifier,
    StaticOrAbstractModifier,
    OverrideModifier,
    DecoratedModifier,
    GetMethodOrSetMethodSelector,
  ]
>

/**
 * Represents all possible group combinations for accessor properties. Combines
 * modifiers with the accessor-property selector using dash notation.
 */
export type AccessorPropertyGroup = JoinWithDash<
  [
    PublicOrProtectedOrPrivateModifier,
    StaticOrAbstractModifier,
    OverrideModifier,
    DecoratedModifier,
    AccessorPropertySelector,
  ]
>

/**
 * Represents all possible group combinations for index signatures. Combines
 * modifiers with the index-signature selector using dash notation.
 */
export type IndexSignatureGroup = JoinWithDash<
  [StaticModifier, ReadonlyModifier, IndexSignatureSelector]
>

/**
 * Represents all possible group combinations for constructors. Combines access
 * modifiers with the constructor selector using dash notation.
 */
export type ConstructorGroup = JoinWithDash<
  [PublicOrProtectedOrPrivateModifier, ConstructorSelector]
>

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
 * Represents all possible group identifiers for class members.
 *
 * Groups can be predefined combinations of modifiers and selectors, 'unknown'
 * for uncategorized members, or custom group names.
 *
 * Note: Some invalid modifier combinations (e.g., private abstract) are still
 * technically allowed by this type but will be rejected at runtime.
 */
type Group =
  | GetMethodOrSetMethodGroup
  | NonDeclarePropertyGroup
  | AccessorPropertyGroup
  | FunctionPropertyGroup
  | DeclarePropertyGroup
  | IndexSignatureGroup
  | ConstructorGroup
  | StaticBlockGroup
  | MethodGroup
  | 'unknown'
  | string

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

/** Union type for getter and setter method selectors. */
type GetMethodOrSetMethodSelector = GetMethodSelector | SetMethodSelector

/** Union type for static and abstract modifiers. */
type StaticOrAbstractModifier = AbstractModifier | StaticModifier

/** Selector for function properties (arrow functions assigned to properties). */
type FunctionPropertySelector = 'function-property'

/** Selector for accessor properties (auto-accessors with 'accessor' keyword). */
type AccessorPropertySelector = 'accessor-property'

/** Selector for index signatures. */
type IndexSignatureSelector = 'index-signature'

/** Group identifier for static blocks. */
type StaticBlockGroup = StaticBlockSelector

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
