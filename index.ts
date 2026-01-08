import type { ESLint, Linter } from 'eslint'

import { version as packageVersion, name as packageName } from './package.json'
import sortVariableDeclarations from './rules/sort-variable-declarations'
import sortIntersectionTypes from './rules/sort-intersection-types'
import sortExportAttributes from './rules/sort-export-attributes'
import sortImportAttributes from './rules/sort-import-attributes'
import sortHeritageClauses from './rules/sort-heritage-clauses'
import sortArrayIncludes from './rules/sort-array-includes'
import sortNamedExports from './rules/sort-named-exports'
import sortNamedImports from './rules/sort-named-imports'
import sortObjectTypes from './rules/sort-object-types'
import sortSwitchCase from './rules/sort-switch-case'
import sortUnionTypes from './rules/sort-union-types'
import sortDecorators from './rules/sort-decorators'
import sortInterfaces from './rules/sort-interfaces'
import sortJsxProps from './rules/sort-jsx-props'
import sortClasses from './rules/sort-classes'
import sortExports from './rules/sort-exports'
import sortImports from './rules/sort-imports'
import sortModules from './rules/sort-modules'
import sortObjects from './rules/sort-objects'
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
  'sort-export-attributes': sortExportAttributes,
  'sort-import-attributes': sortImportAttributes,
  'sort-heritage-clauses': sortHeritageClauses,
  'sort-array-includes': sortArrayIncludes,
  'sort-named-exports': sortNamedExports,
  'sort-named-imports': sortNamedImports,
  'sort-object-types': sortObjectTypes,
  'sort-switch-case': sortSwitchCase,
  'sort-union-types': sortUnionTypes,
  'sort-decorators': sortDecorators,
  'sort-interfaces': sortInterfaces,
  'sort-jsx-props': sortJsxProps,
  'sort-classes': sortClasses,
  'sort-exports': sortExports,
  'sort-imports': sortImports,
  'sort-modules': sortModules,
  'sort-objects': sortObjects,
  'sort-enums': sortEnums,
  'sort-maps': sortMaps,
  'sort-sets': sortSets,
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
