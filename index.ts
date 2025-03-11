import type { ESLint, Linter, Rule } from 'eslint'

import { version as packageVersion, name as packageName } from './package.json'
import sortVariableDeclarations from './rules/sort-variable-declarations'
import sortIntersectionTypes from './rules/sort-intersection-types'
import sortHeritageClauses from './rules/sort-heritage-clauses'
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

interface PluginConfig {
  rules: {
    'sort-variable-declarations': Rule.RuleModule
    'sort-intersection-types': Rule.RuleModule
    'sort-heritage-clauses': Rule.RuleModule
    'sort-array-includes': Rule.RuleModule
    'sort-named-imports': Rule.RuleModule
    'sort-named-exports': Rule.RuleModule
    'sort-object-types': Rule.RuleModule
    'sort-union-types': Rule.RuleModule
    'sort-switch-case': Rule.RuleModule
    'sort-interfaces': Rule.RuleModule
    'sort-decorators': Rule.RuleModule
    'sort-jsx-props': Rule.RuleModule
    'sort-modules': Rule.RuleModule
    'sort-classes': Rule.RuleModule
    'sort-imports': Rule.RuleModule
    'sort-exports': Rule.RuleModule
    'sort-objects': Rule.RuleModule
    'sort-enums': Rule.RuleModule
    'sort-sets': Rule.RuleModule
    'sort-maps': Rule.RuleModule
  }
  configs: {
    'recommended-alphabetical-legacy': Linter.LegacyConfig
    'recommended-line-length-legacy': Linter.LegacyConfig
    'recommended-natural-legacy': Linter.LegacyConfig
    'recommended-custom-legacy': Linter.LegacyConfig
    'recommended-alphabetical': Linter.Config
    'recommended-line-length': Linter.Config
    'recommended-natural': Linter.Config
    'recommended-custom': Linter.Config
  }
  meta: {
    version: string
    name: string
  }
  name: string
}

interface BaseOptions {
  type: 'alphabetical' | 'line-length' | 'natural' | 'custom'
  order: 'desc' | 'asc'
}

let pluginName = 'perfectionist'

let plugin = {
  rules: {
    'sort-variable-declarations': sortVariableDeclarations,
    'sort-intersection-types': sortIntersectionTypes,
    'sort-heritage-clauses': sortHeritageClauses,
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
  },
  meta: {
    version: packageVersion,
    name: packageName,
  },
  name: packageName,
} as unknown as ESLint.Plugin

let getRules = (options: BaseOptions): Linter.RulesRecord =>
  Object.fromEntries(
    Object.keys(plugin.rules!).map(ruleName => [
      `${pluginName}/${ruleName}`,
      ['error', options],
    ]),
  )

let createConfig = (options: BaseOptions): Linter.Config => ({
  plugins: {
    [pluginName]: plugin,
  },
  rules: getRules(options),
})

let createLegacyConfig = (options: BaseOptions): Linter.LegacyConfig => ({
  rules: getRules(options),
  plugins: [pluginName],
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
  },
} as PluginConfig
