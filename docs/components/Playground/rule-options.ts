/**
 * Options a rule cannot run without. `sort-arrays` sorts nothing by default and
 * fails schema validation without `useConfigurationIf`, so it gets the `as
 * const` selector from its documentation.
 *
 * The page imports this module for the config hint, so it must not import the
 * plugin.
 */
const REQUIRED_OPTIONS: Partial<Record<string, Record<string, unknown>>> = {
  'sort-arrays': {
    useConfigurationIf: {
      matchesAstSelector:
        'TSAsExpression[typeAnnotation.typeName.name=const] > ArrayExpression',
    },
  },
}

/**
 * Returns the options a rule runs with when the Options field is empty.
 *
 * @param rule - Rule name without the plugin prefix.
 * @returns Options after the severity.
 */
export function getDefaultOptions(rule: string): unknown[] {
  let requiredOptions = REQUIRED_OPTIONS[rule]
  return requiredOptions ? [requiredOptions] : []
}
