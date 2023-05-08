import sortInterfaces, { RULE_NAME as sortInterfacesName } from '~/rules/sort-interfaces'
import sortJsxProps, { RULE_NAME as sortJsxPropsName } from '~/rules/sort-jsx-props'
import sortNamedImports, { RULE_NAME as sortNamedImportsName } from '~/rules/sort-named-imports'
import { name } from '~/package.json'

export default {
  name,
  rules: {
    [sortInterfacesName]: sortInterfaces,
    [sortJsxPropsName]: sortJsxProps,
    [sortNamedImportsName]: sortNamedImports,
  },
}
