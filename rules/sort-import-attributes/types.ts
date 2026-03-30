import type { TSESTree } from '@typescript-eslint/types'

import type { RegexOption, TypeOption } from '../../types/common-options'
import type { AllCommonOptions } from '../../types/all-common-options'
import type { SortingNode } from '../../types/sorting-node'

export type Options = Partial<
  {
    /**
     * Conditional configuration based on pattern matching.
     */
    useConfigurationIf: {
      /**
       * Regular expression pattern to match against all attribute key names.
       * The rule is only applied when all names match this pattern.
       */
      allNamesMatchPattern?: RegexOption

      /**
       * AST selector to match against ImportDeclaration or
       * ExportNamedDeclaration nodes.
       */
      matchesAstSelector?: string
    }
  } & AllCommonOptions<
    TypeOption,
    AdditionalSortOptions,
    CustomGroupMatchOptions
  >
>[]

export type SortImportAttributesSortingNode =
  SortingNode<TSESTree.ImportAttribute>

/**
 * Match options for a custom group.
 */
type CustomGroupMatchOptions = object

type AdditionalSortOptions = object

export let allSelectors = [] as const
export type Selector = (typeof allSelectors)[number]

export let allModifiers = [] as const
export type Modifier = (typeof allModifiers)[number]
