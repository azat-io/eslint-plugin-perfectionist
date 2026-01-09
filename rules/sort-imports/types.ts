import type { JSONSchema4 } from '@typescript-eslint/utils/json-schema'
import type { TSESTree } from '@typescript-eslint/types'

import type { SortingNodeWithDependencies } from '../../utils/sort-nodes-by-dependencies'
import type { RegexOption, TypeOption } from '../../types/common-options'
import type { AllCommonOptions } from '../../types/all-common-options'

import {
  buildCustomGroupModifiersJsonSchema,
  buildCustomGroupSelectorJsonSchema,
} from '../../utils/json-schemas/common-groups-json-schemas'

/**
 * Configuration options for the sort-imports rule.
 *
 * This rule enforces consistent ordering of import statements to improve code
 * organization, readability, and maintainability.
 */
export type Options = Partial<
  {
    /**
     * TypeScript configuration for resolving module paths. Enables path alias
     * resolution based on tsconfig.json paths configuration.
     */
    tsconfig: {
      /**
       * Optional filename of the TypeScript config file. `@default`
       * tsconfig.json'.
       */
      filename?: string

      /** Root directory where to search for the TypeScript config file. */
      rootDir: string
    }

    /** Enables experimental dependency detection. */
    useExperimentalDependencyDetection: boolean

    /**
     * Patterns to identify internal imports. Imports matching these patterns
     * are categorized as 'internal'.
     */
    internalPattern: RegexOption[]

    /**
     * Runtime environment for resolving built-in modules. Determines which
     * modules are considered built-in.
     *
     * @default 'node'
     */
    environment: 'node' | 'bun'

    /**
     * Controls whether side-effect imports should be sorted. When false,
     * side-effect imports remain in their original positions.
     *
     * @default false
     */
    sortSideEffects: boolean

    /**
     * Maximum line length for imports. When exceeded, import names are used for
     * sorting instead of the entire line.
     */
    maxLineLength: number
  } & AllCommonOptions<
    CustomTypeOption,
    AdditionalSortOptions,
    CustomGroupMatchOptions
  >
>[]

/**
 * Represents a sorting node for an import statement. Extends the base sorting
 * node with dependency information and ignore flag.
 */
export interface SortImportsSortingNode extends SortingNodeWithDependencies<SortImportsNode> {
  /** The name of the import specifier for sorting purposes. */
  specifierName: string | null

  /** Whether this import is a type-only import. */
  isTypeImport: boolean

  /**
   * Whether this import should be ignored during sorting. Typically true for
   * side-effect imports when sortSideEffects is false.
   */
  isIgnored: boolean
}

export type SortImportsNode =
  | TSESTree.TSImportEqualsDeclaration
  | TSESTree.VariableDeclaration
  | TSESTree.ImportDeclaration

export type CustomTypeOption = 'type-import-first' | TypeOption

/**
 * Union type of all available import selectors. Used to categorize different
 * types of import statements.
 */
export type Selector = (typeof allSelectors)[number]

/**
 * Union type of all available import modifiers. Used to identify specific
 * characteristics of import statements.
 */
export type Modifier = (typeof allModifiers)[number]

/**
 * Additional configuration for a single custom group.
 *
 * @example
 *   {
 *     "modifiers": ["type"],
 *     "selector": "external"
 *   }
 */
interface CustomGroupMatchOptions {
  /** List of modifiers that imports must have to be included in this group. */
  modifiers?: Modifier[]

  /** The selector type that imports must match to be included in this group. */
  selector?: Selector
}

interface AdditionalSortOptions {
  sortBy: SortByOption
}

/**
 * Complete list of available active import selectors. Used for validation and
 * JSON schema generation.
 */
export let allSelectors = [
  'side-effect-style',
  'tsconfig-path',
  'side-effect',
  'external',
  'internal',
  'builtin',
  'sibling',
  'subpath',
  'import',
  'parent',
  'index',
  'style',
  'type',
] as const

/**
 * Complete list of available import modifiers. Used for validation and JSON
 * schema generation.
 */
export let allModifiers = [
  'default',
  'multiline',
  'named',
  'require',
  'side-effect',
  'singleline',
  'ts-equals',
  'type',
  'value',
  'wildcard',
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
}

const SORT_BY_OPTION = ['specifier', 'path'] as const
type SortByOption = (typeof SORT_BY_OPTION)[number]

export let additionalSortOptionsJsonSchema: Record<string, JSONSchema4> = {
  sortBy: {
    enum: [...SORT_BY_OPTION],
    type: 'string',
  },
}

export const TYPE_IMPORT_FIRST_TYPE_OPTION = 'type-import-first'
