import sortInterfaces, {
  RULE_NAME as sortInterfacesName,
} from '~/rules/sort-interfaces'
import { name } from '~/package.json'

export default {
  name,
  rules: {
    [sortInterfacesName]: sortInterfaces,
  },
}
