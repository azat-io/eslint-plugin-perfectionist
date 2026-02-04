import type { ESLint, Linter } from 'eslint'

import { version as packageVersion, name as packageName } from './package.json'
import sortVariableDeclarations from './rules/sort-variable-declarations'
import sortIntersectionTypes from './rules/sort-intersection-types'
import sortImportAttributes from './rules/sort-import-attributes'
import sortExportAttributes from './rules/sort-export-attributes'
import sortHeritageClauses from './rules/sort-heritage-clauses'
import separateTypeImports from './rules/separate-type-imports'
import sortArrayIncludes from './rules/sort-array-includes'
import sortNamedImports from './rules/sort-named-imports'
import sortNamedExports from './rules/sort-named-exports'
import sortObjectTypes from './rules/sort-object-types'
import sortSwitchCase from './rules/sort-switch-case'
import sortUnionTypes from './rules/sort-union-types'
import sortInterfaces from './rules/sort-interfaces'
import sortDecorators from './rules/sort-decorators'
import sortJsxProps from './rules/sort-jsx-props'
import sortClasses from './rules/sort-classes'
import sortImports from './rules/sort-imports'
import sortExports from './rules/sort-exports'
import sortObjects from './rules/sort-objects'
import sortModules from './rules/sort-modules'
import sortEnums from './rules/sort-enums'
import sortMaps from './rules/sort-maps'
import sortSets from './rules/sort-sets'

interface PluginConfigs extends Record<
  string,
  Linter.LegacyConfig | Linter.Config[] | Linter.Config
> {
  'recommended-alphabetical-legacy': Linter.LegacyConfig
  'recommended-line-length-legacy': Linter.LegacyConfig
  'recommended-natural-legacy': Linter.LegacyConfig
  'recommended-custom-legacy': Linter.LegacyConfig
  'recommended-alphabetical': Linter.Config
  'recommended-line-length': Linter.Config
  'recommended-natural': Linter.Config
  'recommended-custom': Linter.Config
}

interface BaseOptions {
  type: 'alphabetical' | 'line-length' | 'natural' | 'custom'
  order: 'desc' | 'asc'
}

let pluginName = 'perfectionist'

export let rules = {
  'sort-variable-declarations': sortVariableDeclarations,
  'sort-intersection-types': sortIntersectionTypes,
  'sort-import-attributes': sortImportAttributes,
  'sort-export-attributes': sortExportAttributes,
  'sort-heritage-clauses': sortHeritageClauses,
  'separate-type-imports': separateTypeImports,
  'sort-array-includes': sortArrayIncludes,
  'sort-named-imports': sortNamedImports,
  'sort-named-exports': sortNamedExports,
  'sort-object-types': sortObjectTypes,
  'sort-union-types': sortUnionTypes,
  'sort-switch-case': sortSwitchCase,
  'sort-decorators': sortDecorators,
  'sort-interfaces': sortInterfaces,
  'sort-jsx-props': sortJsxProps,
  'sort-modules': sortModules,
  'sort-classes': sortClasses,
  'sort-imports': sortImports,
  'sort-exports': sortExports,
  'sort-objects': sortObjects,
  'sort-enums': sortEnums,
  'sort-sets': sortSets,
  'sort-maps': sortMaps,
} as unknown as ESLint.Plugin['rules']

let plugin = {
  meta: {
    version: packageVersion,
    name: packageName,
  },
  rules,
} as unknown as ESLint.Plugin

function getRules(options: BaseOptions): Linter.RulesRecord {
  return Object.fromEntries(
    Object.keys(plugin.rules!).map(ruleName => [
      `${pluginName}/${ruleName}`,
      ['error', options],
    ]),
  )
}

function createConfig(options: BaseOptions): Linter.Config {
  return {
    plugins: {
      [pluginName]: plugin,
    },
    rules: getRules(options),
  }
}

function createLegacyConfig(options: BaseOptions): Linter.LegacyConfig {
  return {
    rules: getRules(options),
    plugins: [pluginName],
  }
}

export let configs: PluginConfigs = {
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
  'recommended-custom-legacy': createLegacyConfig({
    type: 'custom',
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
  'recommended-custom': createConfig({
    type: 'custom',
    order: 'asc',
  }),
}

export default {
  ...plugin,
  configs,
} as { configs: PluginConfigs } & ESLint.Plugin
