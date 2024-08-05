import type {
  ClassicConfig,
  FlatConfig,
} from '@typescript-eslint/utils/ts-eslint'

import sortVariableDeclarations from './rules/sort-variable-declarations'
import sortIntersectionTypes from './rules/sort-intersection-types'
import sortSvelteAttributes from './rules/sort-svelte-attributes'
import sortAstroAttributes from './rules/sort-astro-attributes'
import sortArrayIncludes from './rules/sort-array-includes'
import sortVueAttributes from './rules/sort-vue-attributes'
import sortClasses from './rules/sort-classes/sort-classes'
import sortNamedImports from './rules/sort-named-imports'
import sortNamedExports from './rules/sort-named-exports'
import sortObjectTypes from './rules/sort-object-types'
import sortSwitchCase from './rules/sort-switch-case'
import sortUnionTypes from './rules/sort-union-types'
import sortInterfaces from './rules/sort-interfaces'
import sortJsxProps from './rules/sort-jsx-props'
import sortImports from './rules/sort-imports'
import sortExports from './rules/sort-exports'
import sortObjects from './rules/sort-objects'
import sortEnums from './rules/sort-enums'
import sortMaps from './rules/sort-maps'

interface BaseOptions {
  type: 'alphabetical' | 'line-length' | 'natural'
  order: 'desc' | 'asc'
}

type RuleSeverity = 'error' | 'warn' | 'off'

type RuleDeclaration = [RuleSeverity, Object?]

let name = 'perfectionist'

let plugin = {
  rules: {
    'sort-variable-declarations': sortVariableDeclarations,
    'sort-intersection-types': sortIntersectionTypes,
    'sort-svelte-attributes': sortSvelteAttributes,
    'sort-astro-attributes': sortAstroAttributes,
    'sort-vue-attributes': sortVueAttributes,
    'sort-array-includes': sortArrayIncludes,
    'sort-named-imports': sortNamedImports,
    'sort-named-exports': sortNamedExports,
    'sort-object-types': sortObjectTypes,
    'sort-union-types': sortUnionTypes,
    'sort-switch-case': sortSwitchCase,
    'sort-interfaces': sortInterfaces,
    'sort-jsx-props': sortJsxProps,
    'sort-classes': sortClasses,
    'sort-imports': sortImports,
    'sort-exports': sortExports,
    'sort-objects': sortObjects,
    'sort-enums': sortEnums,
    'sort-maps': sortMaps,
  },
  name,
}

let getRules = (options: BaseOptions): Record<string, RuleDeclaration> =>
  Object.fromEntries(
    Object.keys(plugin.rules).map(rule => [
      `${name}/${rule}`,
      ['error', options],
    ]),
  )

let createConfig = (options: BaseOptions): FlatConfig.Config => ({
  plugins: {
    [name]: plugin,
  },
  rules: getRules(options),
})

let createLegacyConfig = (options: BaseOptions): ClassicConfig.Config => ({
  rules: getRules(options),
  plugins: [name],
})

export default {
  ...plugin,
  configs: {
    'recommended-alphabetical-legacy': createLegacyConfig({
      type: 'alphabetical',
      order: 'asc',
    }),
    'recommended-line-length-legacy': createLegacyConfig({
      type: 'line-length',
      order: 'desc',
    }),
    'recommended-natural-legacy': createLegacyConfig({
      type: 'natural',
      order: 'asc',
    }),
    'recommended-alphabetical': createConfig({
      type: 'alphabetical',
      order: 'asc',
    }),
    'recommended-line-length': createConfig({
      type: 'line-length',
      order: 'desc',
    }),
    'recommended-natural': createConfig({
      type: 'natural',
      order: 'asc',
    }),
  },
}
