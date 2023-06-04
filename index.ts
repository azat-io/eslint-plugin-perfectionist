import sortArrayIncludes, { RULE_NAME as sortArrayIncludesName } from './rules/sort-array-includes'
import sortClasses, { RULE_NAME as sortClassesName } from './rules/sort-classes'
import sortEnums, { RULE_NAME as sortEnumsName } from './rules/sort-enums'
import sortImports, { RULE_NAME as sortImportsName } from './rules/sort-imports'
import sortInterfaces, { RULE_NAME as sortInterfacesName } from './rules/sort-interfaces'
import sortJsxProps, { RULE_NAME as sortJsxPropsName } from './rules/sort-jsx-props'
import sortMapElements, { RULE_NAME as sortMapElementsName } from './rules/sort-map-elements'
import sortNamedExports, { RULE_NAME as sortNamedExportsName } from './rules/sort-named-exports'
import sortNamedImports, { RULE_NAME as sortNamedImportsName } from './rules/sort-named-imports'
import sortObjectTypes, { RULE_NAME as sortObjectTypesName } from './rules/sort-object-types'
import sortObjects, { RULE_NAME as sortObjectsName } from './rules/sort-objects'
import sortUnionTypes, { RULE_NAME as sortUnionTypesName } from './rules/sort-union-types'
import { SortType, SortOrder } from './typings'
import { name } from './package.json'

type RuleSeverity = 'off' | 'warn' | 'error'

type RuleDeclaration = [RuleSeverity, { [key: string]: unknown }?]

let createConfigWithOptions = (options: {
  type: SortType
  order: SortOrder
  'ignore-case'?: boolean
}): {
  plugins: ['perfectionist']
  rules: {
    [key: string]: RuleDeclaration
  }
} => {
  let recommendedRules: {
    [key: string]: RuleDeclaration
  } = {
    [sortArrayIncludesName]: [
      'error',
      {
        'spread-last': true,
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
    [sortEnumsName]: ['error'],
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
        'newlines-between': 'always',
        'internal-pattern': ['~/**'],
        'read-tsconfig': false,
      },
    ],
    [sortInterfacesName]: ['error'],
    [sortJsxPropsName]: [
      'error',
      {
        'always-on-top': [],
        shorthand: 'ignore',
        multiline: 'first',
        callback: 'ignore',
      },
    ],
    [sortMapElementsName]: ['error'],
    [sortNamedExportsName]: ['error'],
    [sortNamedImportsName]: ['error'],
    [sortObjectTypesName]: ['error'],
    [sortObjectsName]: [
      'error',
      {
        'always-on-top': [],
      },
    ],
    [sortUnionTypesName]: ['error'],
  }
  return {
    plugins: ['perfectionist'],
    rules: Object.fromEntries(
      Object.entries(recommendedRules).map(([key, [message, baseOptions = {}]]) => [
        `perfectionist/${key}`,
        [message, Object.assign(baseOptions, options)],
      ]),
    ),
  }
}

export default {
  name,
  rules: {
    [sortArrayIncludesName]: sortArrayIncludes,
    [sortClassesName]: sortClasses,
    [sortEnumsName]: sortEnums,
    [sortImportsName]: sortImports,
    [sortInterfacesName]: sortInterfaces,
    [sortJsxPropsName]: sortJsxProps,
    [sortMapElementsName]: sortMapElements,
    [sortNamedExportsName]: sortNamedExports,
    [sortNamedImportsName]: sortNamedImports,
    [sortObjectTypesName]: sortObjectTypes,
    [sortObjectsName]: sortObjects,
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
}
