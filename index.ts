import sortSvelteAttributes, { RULE_NAME as sortSvelteAttributesName } from './rules/sort-svelte-attributes'
import sortArrayIncludes, { RULE_NAME as sortArrayIncludesName } from './rules/sort-array-includes'
import sortNamedImports, { RULE_NAME as sortNamedImportsName } from './rules/sort-named-imports'
import sortNamedExports, { RULE_NAME as sortNamedExportsName } from './rules/sort-named-exports'
import sortObjectTypes, { RULE_NAME as sortObjectTypesName } from './rules/sort-object-types'
import sortUnionTypes, { RULE_NAME as sortUnionTypesName } from './rules/sort-union-types'
import sortInterfaces, { RULE_NAME as sortInterfacesName } from './rules/sort-interfaces'
import sortJsxProps, { RULE_NAME as sortJsxPropsName } from './rules/sort-jsx-props'
import sortObjects, { RULE_NAME as sortObjectsName } from './rules/sort-objects'
import sortImports, { RULE_NAME as sortImportsName } from './rules/sort-imports'
import sortClasses, { RULE_NAME as sortClassesName } from './rules/sort-classes'
import sortExports, { RULE_NAME as sortExportsName } from './rules/sort-exports'
import sortEnums, { RULE_NAME as sortEnumsName } from './rules/sort-enums'
import sortMaps, { RULE_NAME as sortMapsName } from './rules/sort-maps'
import { SortOrder, SortType } from './typings'
import { name } from './package.json'

type RuleSeverity = 'error' | 'warn' | 'off'

type RuleDeclaration = [RuleSeverity, { [key: string]: unknown }?]

let createConfigWithOptions = (options: {
  'ignore-case'?: boolean
  order: SortOrder
  type: SortType
}): {
  rules: {
    [key: string]: RuleDeclaration
  }
  plugins: ['perfectionist']
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
        'custom-groups': {
          value: {},
          type: {},
        },
        'newlines-between': 'always',
        'internal-pattern': ['~/**'],
        'read-tsconfig': false,
      },
    ],
    [sortClassesName]: [
      'error',
      {
        groups: [
          'static-property',
          'private-property',
          'property',
          'constructor',
          'static-method',
          'private-method',
          'method',
          'unknown',
        ],
      },
    ],
    [sortJsxPropsName]: [
      'error',
      {
        'always-on-top': [],
        shorthand: 'ignore',
        multiline: 'first',
        callback: 'ignore',
      },
    ],
    [sortObjectsName]: [
      'error',
      {
        'partition-by-comment': false,
        'always-on-top': [],
      },
    ],
    [sortArrayIncludesName]: [
      'error',
      {
        'spread-last': true,
      },
    ],
    [sortSvelteAttributesName]: ['error'],
    [sortNamedExportsName]: ['error'],
    [sortNamedImportsName]: ['error'],
    [sortObjectTypesName]: ['error'],
    [sortUnionTypesName]: ['error'],
    [sortInterfacesName]: ['error'],
    [sortExportsName]: ['error'],
    [sortEnumsName]: ['error'],
    [sortMapsName]: ['error'],
  }
  return {
    rules: Object.fromEntries(
      Object.entries(recommendedRules).map(([key, [message, baseOptions = {}]]) => [
        `perfectionist/${key}`,
        [message, Object.assign(baseOptions, options)],
      ]),
    ),
    plugins: ['perfectionist'],
  }
}

/* eslint-disable perfectionist/sort-objects */
export default {
  rules: {
    [sortArrayIncludesName]: sortArrayIncludes,
    [sortClassesName]: sortClasses,
    [sortEnumsName]: sortEnums,
    [sortExportsName]: sortExports,
    [sortImportsName]: sortImports,
    [sortInterfacesName]: sortInterfaces,
    [sortJsxPropsName]: sortJsxProps,
    [sortMapsName]: sortMaps,
    [sortNamedExportsName]: sortNamedExports,
    [sortNamedImportsName]: sortNamedImports,
    [sortObjectTypesName]: sortObjectTypes,
    [sortObjectsName]: sortObjects,
    [sortSvelteAttributesName]: sortSvelteAttributes,
    [sortUnionTypesName]: sortUnionTypes,
  },
  configs: {
    'recommended-alphabetical': createConfigWithOptions({
      type: SortType.alphabetical,
      order: SortOrder.asc,
      'ignore-case': false,
    }),
    'recommended-natural': createConfigWithOptions({
      type: SortType.natural,
      order: SortOrder.asc,
      'ignore-case': false,
    }),
    'recommended-line-length': createConfigWithOptions({
      type: SortType['line-length'],
      order: SortOrder.desc,
    }),
  },
  name,
}
