import type { JSONSchema4 } from '@typescript-eslint/utils/json-schema'

import type {
  PartitionByCommentOption,
  NewlinesBetweenOption,
  CustomGroupsOption,
  CommonOptions,
  GroupsOptions,
  RegexOption,
} from '../../types/common-options'
import type { JoinWithDash } from '../../types/join-with-dash'

import {
  buildCustomGroupModifiersJsonSchema,
  buildCustomGroupSelectorJsonSchema,
  regexJsonSchema,
} from '../../utils/common-json-schemas'

/**
 * Configuration options for the sort-modules rule.
 *
 * This rule enforces consistent ordering of module-level declarations (classes,
 * interfaces, functions, types, enums) to improve code organization.
 */
export type SortModulesOptions = [
  Partial<
    {
      /**
       * Custom groups for organizing module members. Allows defining groups
       * based on member types, modifiers, and patterns.
       */
      customGroups: CustomGroupsOption<SingleCustomGroup>

      /**
       * Partition module members by comment delimiters. Members separated by
       * specific comments are sorted independently.
       */
      partitionByComment: PartitionByCommentOption

      /**
       * Controls the placement of newlines between different groups of module
       * members.
       */
      newlinesBetween: NewlinesBetweenOption

      /**
       * Defines the order and grouping of module members. Members are sorted
       * within their groups and groups are ordered as specified.
       */
      groups: GroupsOptions<Group>

      /**
       * Whether to partition module members by newlines. When true, members
       * separated by empty lines are sorted independently.
       */
      partitionByNewLine: boolean
    } & CommonOptions
  >,
]

/**
 * Defines a custom group for module member categorization.
 *
 * Custom groups allow fine-grained control over how module members are grouped
 * and sorted based on their types, modifiers, and patterns.
 */
export type SingleCustomGroup = (
  | (DecoratorNamePatternFilterCustomGroup &
      BaseSingleCustomGroup<ClassSelector>)
  | BaseSingleCustomGroup<InterfaceSelector>
  | BaseSingleCustomGroup<FunctionSelector>
  | BaseSingleCustomGroup<EnumSelector>
  | BaseSingleCustomGroup<TypeSelector>
) &
  ElementNamePatternFilterCustomGroup

/**
 * Union type of all available module member selectors. Used to categorize
 * different types of module-level declarations.
 */
export type Selector =
  // | NamespaceSelector
  | InterfaceSelector
  | FunctionSelector
  // | ModuleSelector
  | ClassSelector
  | TypeSelector
  | EnumSelector

/**
 * Union type of all available module member modifiers. Used to identify
 * specific characteristics of module declarations.
 */
export type Modifier =
  | DecoratedModifier
  | DeclareModifier
  | DefaultModifier
  | ExportModifier
  | AsyncModifier

/**
 * Maps each selector type to its allowed modifiers.
 *
 * Defines which modifiers are valid for each type of module member, ensuring
 * type safety when configuring custom groups.
 *
 * Note: The 'decorated' modifier is included for class to support decorated
 * classes, aligning with the group types and allModifiers definitions.
 *
 * @internal
 */
interface AllowedModifiersPerSelector {
  /** Valid modifiers for class declarations (including decorated classes). */
  class: DecoratedModifier | DeclareModifier | DefaultModifier | ExportModifier

  /** Valid modifiers for function declarations. */
  function: DeclareModifier | DefaultModifier | ExportModifier | AsyncModifier

  /** Valid modifiers for interface declarations. */
  interface: DeclareModifier | DefaultModifier | ExportModifier

  /** Valid modifiers for namespace declarations. */
  namespace: DeclareModifier | ExportModifier

  /** Valid modifiers for module declarations. */
  module: DeclareModifier | ExportModifier

  /** Valid modifiers for enum declarations. */
  enum: DeclareModifier | ExportModifier

  /** Valid modifiers for type alias declarations. */
  type: DeclareModifier | ExportModifier
}

/**
 * Base configuration for a custom group.
 *
 * @template T - The selector type this group applies to.
 */
interface BaseSingleCustomGroup<T extends Selector> {
  /** List of modifiers that members must have to be included in this group. */
  modifiers?: AllowedModifiersPerSelector[T][]

  /** The type of module member this group applies to. */
  selector?: T
}

/**
 * Custom group filter based on decorator names. Only applicable to class
 * members that support decorators.
 */
interface DecoratorNamePatternFilterCustomGroup {
  /**
   * Regular expression pattern to match decorator names. Members with
   * decorators matching this pattern will be included in this custom group.
   */
  decoratorNamePattern?: RegexOption
}

/**
 * Custom group filter based on element names. Applicable to all module member
 * types.
 */
interface ElementNamePatternFilterCustomGroup {
  /**
   * Regular expression pattern to match member names. Members with names
   * matching this pattern will be included in this custom group.
   */
  elementNamePattern?: RegexOption
}

/**
 * Represents a group identifier for module member categorization. Can be a
 * predefined group combination, 'unknown' for uncategorized members, or a
 * custom group name.
 *
 * @internal
 */
type Group =
  | NonDefaultInterfaceGroup
  | NonDefaultFunctionGroup
  | DefaultInterfaceGroup
  | DefaultFunctionGroup
  | NonDefaultClassGroup
  | DefaultClassGroup
  | EnumGroup
  | TypeGroup
  | 'unknown'
  | string

/** Represents group combinations for non-default exported classes. */
type NonDefaultClassGroup = JoinWithDash<
  [ExportModifier, DeclareModifier, DecoratedModifier, ClassSelector]
>

/** Represents group combinations for default exported functions. */
type DefaultFunctionGroup = JoinWithDash<
  [ExportModifier, DefaultModifier, AsyncModifier, FunctionSelector]
>

/** Represents group combinations for default exported classes. */
type DefaultClassGroup = JoinWithDash<
  [ExportModifier, DefaultModifier, DecoratedModifier, ClassSelector]
>

/** Represents group combinations for non-default exported interfaces. */
type NonDefaultInterfaceGroup = JoinWithDash<
  [ExportModifier, DeclareModifier, InterfaceSelector]
>

/** Represents group combinations for non-default exported functions. */
type NonDefaultFunctionGroup = JoinWithDash<
  [ExportModifier, DeclareModifier, FunctionSelector]
>

/** Represents group combinations for default exported interfaces. */
type DefaultInterfaceGroup = JoinWithDash<
  [ExportModifier, DefaultModifier, InterfaceSelector]
>

/** Represents group combinations for type alias declarations. */
type TypeGroup = JoinWithDash<[ExportModifier, DeclareModifier, TypeSelector]>

/** Represents group combinations for enum declarations. */
type EnumGroup = JoinWithDash<[ExportModifier, DeclareModifier, EnumSelector]>

/** Modifier for decorated members (having decorators). */
type DecoratedModifier = 'decorated'

/** Selector for interface declarations. */
type InterfaceSelector = 'interface'

/** Selector for function declarations. */
type FunctionSelector = 'function'

/** Modifier for ambient declarations. */
type DeclareModifier = 'declare'

/** Modifier for default exports. */
type DefaultModifier = 'default'

/** Modifier for exported members. */
type ExportModifier = 'export'

/** Modifier for async functions. */
type AsyncModifier = 'async'

/** Selector for class declarations. */
type ClassSelector = 'class'

/** Selector for type alias declarations. */
type TypeSelector = 'type'

/** Selector for enum declarations. */
type EnumSelector = 'enum'

/**
 * Complete list of available module member selectors. Used for validation and
 * JSON schema generation.
 */
export let allSelectors: Selector[] = [
  'enum',
  'function',
  'interface',
  // 'module',
  // 'namespace',
  'type',
  'class',
]

/**
 * Complete list of available module member modifiers. Used for validation and
 * JSON schema generation.
 */
export let allModifiers: Modifier[] = [
  'async',
  'declare',
  'decorated',
  'default',
  'export',
]

/**
 * Ideally, we should generate as many schemas as there are selectors, and
 * ensure that users do not enter invalid modifiers for a given selector.
 */
export let singleCustomGroupJsonSchema: Record<string, JSONSchema4> = {
  modifiers: buildCustomGroupModifiersJsonSchema(allModifiers),
  selector: buildCustomGroupSelectorJsonSchema(allSelectors),
  decoratorNamePattern: regexJsonSchema,
  elementNamePattern: regexJsonSchema,
}
