import type { JSONSchema4 } from '@typescript-eslint/utils/json-schema'
import type { TSESTree } from '@typescript-eslint/types'

import type { SortingNodeWithDependencies } from '../../utils/sort-nodes-by-dependencies'
import type { CommonPartitionOptions } from '../../types/common-partition-options'
import type { CommonOptions, RegexOption } from '../../types/common-options'
import type { CommonGroupsOptions } from '../../types/common-groups-options'

import {
  buildCustomGroupModifiersJsonSchema,
  buildCustomGroupSelectorJsonSchema,
  regexJsonSchema,
} from '../../utils/common-json-schemas'

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
  } & CommonGroupsOptions<SingleCustomGroup> &
    CommonPartitionOptions &
    CommonOptions
>[]

/**
 * Defines a custom group for import categorization.
 *
 * Custom groups allow fine-grained control over how imports are grouped and
 * sorted based on their module names, selectors, and modifiers.
 *
 * @example
 *   {
 *     "modifiers": ["type"],
 *     "selector": "external",
 *     "elementNamePattern": "^@company/"
 *   }
 */
export interface SingleCustomGroup {
  /**
   * Regular expression pattern to match import module names. Imports from
   * modules matching this pattern will be included in this custom group.
   */
  elementNamePattern?: RegexOption

  /** List of modifiers that imports must have to be included in this group. */
  modifiers?: Modifier[]

  /** The selector type that imports must match to be included in this group. */
  selector?: Selector
}

/**
 * Represents a sorting node for an import statement. Extends the base sorting
 * node with dependency information and ignore flag.
 */
export interface SortImportsSortingNode
  extends SortingNodeWithDependencies<
    | TSESTree.TSImportEqualsDeclaration
    | TSESTree.VariableDeclaration
    | TSESTree.ImportDeclaration
  > {
  /**
   * Whether this import should be ignored during sorting. Typically true for
   * side-effect imports when sortSideEffects is false.
   */
  isIgnored: boolean
}

/**
 * Union type of all available import selectors. Used to categorize different
 * types of import statements.
 */
export type Selector =
  | SideEffectStyleSelector
  | TsconfigPathSelector
  | SideEffectSelector
  | ExternalSelector
  | InternalSelector
  | BuiltinSelector
  | SiblingSelector
  | SubpathSelector
  | ImportSelector
  | ParentSelector
  | IndexSelector
  | StyleSelector
  | TypeSelector

/**
 * Union type of all available import modifiers. Used to identify specific
 * characteristics of import statements.
 */
export type Modifier =
  | SideEffectModifier
  | SinglelineModifier
  | MultilineModifier
  | WildcardModifier
  | TsEqualsModifier
  | RequireModifier
  | DefaultModifier
  | ValueModifier
  | NamedModifier
  | TypeModifier

/** Selector for side-effect imports that are style files (CSS, SCSS, etc.). */
type SideEffectStyleSelector = 'side-effect-style'

/** Selector for imports using TypeScript path aliases defined in tsconfig.json. */
type TsconfigPathSelector = 'tsconfig-path'

/** Selector for side-effect imports (imports without bindings). */
type SideEffectSelector = 'side-effect'

/** Modifier for side-effect imports. */
type SideEffectModifier = 'side-effect'

/** Modifier for single-line imports. */
type SinglelineModifier = 'singleline'

/** Modifier for multiline imports. */
type MultilineModifier = 'multiline'

/** Modifier for TypeScript import-equals declarations. */
type TsEqualsModifier = 'ts-equals'

/** Modifier for namespace/wildcard imports (`import * as ...`). */
type WildcardModifier = 'wildcard'

/** Selector for external module imports (from node_modules). */
type ExternalSelector = 'external'

/** Selector for internal module imports (matching internalPattern). */
type InternalSelector = 'internal'

/**
 * Selector for subpath imports (modules with internal paths like
 * 'lodash/merge').
 */
type SubpathSelector = 'subpath'

/** Selector for built-in module imports (Node.js/Bun core modules). */
type BuiltinSelector = 'builtin'

/** Selector for sibling module imports (same directory). */
type SiblingSelector = 'sibling'

/** Modifier for default imports. */
type DefaultModifier = 'default'

/** Modifier for CommonJS require() imports. */
type RequireModifier = 'require'

/** Selector for parent module imports (from parent directories). */
type ParentSelector = 'parent'

/** Base selector for all import statements. */
type ImportSelector = 'import'

/** Selector for index file imports. */
type IndexSelector = 'index'

/** Selector for style file imports (CSS, SCSS, etc.). */
type StyleSelector = 'style'

/** Modifier for value imports (non-type imports). */
type ValueModifier = 'value'

/** Modifier for named imports. */
type NamedModifier = 'named'

/** Modifier for type-only imports. */
type TypeModifier = 'type'

/** Selector for type-only import statements. */
type TypeSelector = 'type'

/**
 * Complete list of available active import selectors. Used for validation and
 * JSON schema generation.
 */
export let allSelectors: Selector[] = [
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
]

/**
 * Complete list of available import modifiers. Used for validation and JSON
 * schema generation.
 */
export let allModifiers: Modifier[] = [
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
]

/**
 * Ideally, we should generate as many schemas as there are selectors, and
 * ensure that users do not enter invalid modifiers for a given selector.
 */
export let singleCustomGroupJsonSchema: Record<string, JSONSchema4> = {
  modifiers: buildCustomGroupModifiersJsonSchema(allModifiers),
  selector: buildCustomGroupSelectorJsonSchema(allSelectors),
  elementValuePattern: regexJsonSchema,
  elementNamePattern: regexJsonSchema,
}
