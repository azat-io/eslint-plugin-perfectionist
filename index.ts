import sortInterfaces, { RULE_NAME as sortInterfacesName } from '~/rules/sort-interfaces'
import sortJsxProps, { RULE_NAME as sortJsxPropsName } from '~/rules/sort-jsx-props'
import sortNamedImports, { RULE_NAME as sortNamedImportsName } from '~/rules/sort-named-imports'
import { name } from '~/package.json'

let getRulesWithOptions = (options: {
  [key: string]: unknown
}): {
  [key: string]: [string, { [key: string]: unknown }]
} => {
  let recommendedRules: {
    [key: string]: [string, { [key: string]: unknown }?]
  } = {
    [sortInterfacesName]: ['error'],
    [sortJsxPropsName]: ['error'],
    [sortNamedImportsName]: ['error'],
  }
  return Object.fromEntries(
    Object.entries(recommendedRules).map(([key, [message, baseOptions = {}]]) => [
      key,
      [message, Object.assign(baseOptions, options)],
    ]),
  )
}

export default {
  name,
  rules: {
    [sortInterfacesName]: sortInterfaces,
    [sortJsxPropsName]: sortJsxProps,
    [sortNamedImportsName]: sortNamedImports,
  },
  configs: {
    'recommended-natural': getRulesWithOptions({ type: 'natural', order: 'asc' }),
    'recommended-line-length': getRulesWithOptions({ type: 'line-length', order: 'desc' }),
  },
}
