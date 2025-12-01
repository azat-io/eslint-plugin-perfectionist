import type { JSONSchema4 } from '@typescript-eslint/utils/json-schema'

import type {
  CommonOptions,
  RegexOption,
  TypeOption,
} from '../../types/common-options'
import type { CommonPartitionOptions } from '../../types/common-partition-options'
import type { CommonGroupsOptions } from '../../types/common-groups-options'

import {
  buildCustomGroupModifiersJsonSchema,
  buildCustomGroupSelectorJsonSchema,
} from '../../utils/json-schemas/common-groups-json-schemas'
import { regexJsonSchema } from '../../utils/json-schemas/common-json-schemas'

/**
 * Configuration options for the sort-modules rule.
 *
 * This rule enforces consistent ordering of module-level declarations (classes,
 * interfaces, functions, types, enums) to improve code organization.
 */
export type SortModulesOptions = [
  Partial<
    CommonGroupsOptions<SingleCustomGroup, Record<string, never>, TypeOption> &
      CommonOptions<TypeOption> &
      CommonPartitionOptions
  >,
]

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
 * Additional configuration for a single custom group.
 *
 * Custom groups allow fine-grained control over how module members are grouped
 * and sorted based on their types, modifiers, and patterns.
 */
interface SingleCustomGroup {
  /**
   * Regular expression pattern to match decorator names. Members with
   * decorators matching this pattern will be included in this custom group.
   */
  decoratorNamePattern?: RegexOption

  /** List of modifiers that members must have to be included in this group. */
  modifiers?: Modifier[]

  /** The type of module member this group applies to. */
  selector?: Selector
}

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
}
