import type { JSONSchema4 } from '@typescript-eslint/utils/json-schema'
import type { TSESTree } from '@typescript-eslint/types'

import type { SortingNodeWithDependencies } from '../../utils/sort-nodes-by-dependencies'
import type { RegexOption, TypeOption } from '../../types/common-options'
import type { AllCommonOptions } from '../../types/all-common-options'

import {
  buildCustomGroupModifiersJsonSchema,
  buildCustomGroupSelectorJsonSchema,
} from '../../utils/json-schemas/common-groups-json-schemas'
import { buildRegexJsonSchema } from '../../utils/json-schemas/common-json-schemas'

export type SortModulesNode =
  | TSESTree.ExportDefaultDeclaration
  | TSESTree.ExportNamedDeclaration
  | TSESTree.TSInterfaceDeclaration
  | TSESTree.TSTypeAliasDeclaration
  | TSESTree.FunctionDeclaration
  | TSESTree.TSModuleDeclaration
  | TSESTree.TSDeclareFunction
  | TSESTree.TSEnumDeclaration
  | TSESTree.ClassDeclaration

/**
 * Configuration options for the sort-modules rule.
 *
 * This rule enforces consistent ordering of module-level declarations (classes,
 * interfaces, functions, types, enums) to improve code organization.
 */
export type SortModulesOptions = [
  Partial<
    AllCommonOptions<
      CustomTypeOption,
      AdditionalSortOptions,
      CustomGroupMatchOptions
    >
  >,
]

/** Represents a sorting node for a module statement. */
export type SortModulesSortingNode =
  SortingNodeWithDependencies<SortModulesNode>

/**
 * Union type of all available module member modifiers. Used to identify
 * specific characteristics of module declarations.
 */
export type Modifier = (typeof allModifiers)[number]

/**
 * Union type of all available module member selectors. Used to categorize
 * different types of module-level declarations.
 */
export type Selector = (typeof allSelectors)[number]

/**
 * Additional configuration for a single custom group.
 *
 * Custom groups allow fine-grained control over how module members are grouped
 * and sorted based on their types, modifiers, and patterns.
 */
interface CustomGroupMatchOptions {
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

type CustomTypeOption = typeof USAGE_TYPE_OPTION | TypeOption

type AdditionalSortOptions = object

/**
 * Complete list of available module member selectors. Used for validation and
 * JSON schema generation.
 */
export let allSelectors = [
  'enum',
  'function',
  'interface',
  // 'module',
  // 'namespace',
  'type',
  'class',
] as const

/**
 * Complete list of available module member modifiers. Used for validation and
 * JSON schema generation.
 */
export let allModifiers = [
  'async',
  'declare',
  'decorated',
  'default',
  'export',
] as const

/**
 * Ideally, we should generate as many schemas as there are selectors, and
 * ensure that users do not enter invalid modifiers for a given selector.
 */
export let additionalCustomGroupMatchOptionsJsonSchema: Record<
  string,
  JSONSchema4
> = {
  modifiers: buildCustomGroupModifiersJsonSchema(allModifiers),
  selector: buildCustomGroupSelectorJsonSchema(allSelectors),
  decoratorNamePattern: buildRegexJsonSchema(),
}

export const USAGE_TYPE_OPTION = 'usage'
