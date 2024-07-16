import sortIntersectionTypes, { RULE_NAME as sortIntersectionTypesName } from './rules/sort-intersection-types'
import sortSvelteAttributes, { RULE_NAME as sortSvelteAttributesName } from './rules/sort-svelte-attributes'
import sortAstroAttributes, { RULE_NAME as sortAstroAttributesName } from './rules/sort-astro-attributes'
import sortArrayIncludes, { RULE_NAME as sortArrayIncludesName } from './rules/sort-array-includes'
import sortVueAttributes, { RULE_NAME as sortVueAttributesName } from './rules/sort-vue-attributes'
import sortNamedExports, { RULE_NAME as sortNamedExportsName } from './rules/sort-named-exports'
import sortNamedImports, { RULE_NAME as sortNamedImportsName } from './rules/sort-named-imports'
import sortObjectTypes, { RULE_NAME as sortObjectTypesName } from './rules/sort-object-types'
import sortUnionTypes, { RULE_NAME as sortUnionTypesName } from './rules/sort-union-types'
import sortInterfaces, { RULE_NAME as sortInterfacesName } from './rules/sort-interfaces'
import sortJsxProps, { RULE_NAME as sortJsxPropsName } from './rules/sort-jsx-props'
import sortExports, { RULE_NAME as sortExportsName } from './rules/sort-exports'
import sortImports, { RULE_NAME as sortImportsName } from './rules/sort-imports'
import sortObjects, { RULE_NAME as sortObjectsName } from './rules/sort-objects'
import sortClasses, { RULE_NAME as sortClassesName } from './rules/sort-classes'
import sortEnums, { RULE_NAME as sortEnumsName } from './rules/sort-enums'
import sortMaps, { RULE_NAME as sortMapsName } from './rules/sort-maps'

interface BaseOptions {
  type: 'alphabetical' | 'line-length' | 'natural'
  order: 'desc' | 'asc'
}

type RuleSeverity = 'error' | 'warn' | 'off'

type RuleDeclaration = [RuleSeverity, { [key: string]: unknown }?]

let plugin = {
  rules: {
    [sortIntersectionTypesName]: sortIntersectionTypes,
    [sortSvelteAttributesName]: sortSvelteAttributes,
    [sortAstroAttributesName]: sortAstroAttributes,
    [sortArrayIncludesName]: sortArrayIncludes,
    [sortVueAttributesName]: sortVueAttributes,
    [sortNamedExportsName]: sortNamedExports,
    [sortNamedImportsName]: sortNamedImports,
    [sortObjectTypesName]: sortObjectTypes,
    [sortInterfacesName]: sortInterfaces,
    [sortUnionTypesName]: sortUnionTypes,
    [sortJsxPropsName]: sortJsxProps,
    [sortClassesName]: sortClasses,
    [sortExportsName]: sortExports,
    [sortImportsName]: sortImports,
    [sortObjectsName]: sortObjects,
    [sortEnumsName]: sortEnums,
    [sortMapsName]: sortMaps,
  },
  name: 'perfectionist',
}

let getRules = (
  options: BaseOptions,
): {
  [key: string]: RuleDeclaration
} => {
  let recommendedRules: {
    [key: string]: RuleDeclaration
  } = {
    [sortImportsName]: [
      'error',
      {
        groups: [
          'type',
          ['builtin', 'external'],
          'internal-type',
          'internal',
          ['parent-type', 'sibling-type', 'index-type'],
          ['parent', 'sibling', 'index'],
          'object',
          'unknown',
        ],
        customGroups: {
          value: {},
          type: {},
        },
        newlinesBetween: 'always',
        internalPattern: ['~/**'],
      },
    ],
    [sortClassesName]: [
      'error',
      {
        groups: [
          'index-signature',
          'static-property',
          'private-property',
          'property',
          'constructor',
          'static-method',
          'private-method',
          'method',
          ['get-method', 'set-method'],
          'unknown',
        ],
      },
    ],
    [sortObjectsName]: [
      'error',
      {
        partitionByComment: false,
      },
    ],
    [sortArrayIncludesName]: [
      'error',
      {
        spreadLast: true,
      },
    ],
    [sortIntersectionTypesName]: ['error'],
    [sortSvelteAttributesName]: ['error'],
    [sortAstroAttributesName]: ['error'],
    [sortVueAttributesName]: ['error'],
    [sortNamedExportsName]: ['error'],
    [sortNamedImportsName]: ['error'],
    [sortObjectTypesName]: ['error'],
    [sortUnionTypesName]: ['error'],
    [sortInterfacesName]: ['error'],
    [sortJsxPropsName]: ['error'],
    [sortExportsName]: ['error'],
    [sortEnumsName]: ['error'],
    [sortMapsName]: ['error'],
  }
  return Object.fromEntries(
    Object.entries(recommendedRules).map(([key, [message, baseOptions = {}]]) => [
      `perfectionist/${key}`,
      [message, Object.assign(baseOptions, options)],
    ]),
  )
}

let createConfig = (options: BaseOptions) => ({
  plugins: {
    perfectionist: plugin,
  },
  rules: getRules(options),
})

let createLegacyConfig = (options: BaseOptions) => ({
  plugins: ['perfectionist'],
  rules: getRules(options),
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
