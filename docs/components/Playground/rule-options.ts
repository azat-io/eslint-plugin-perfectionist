/**
 * Options a rule cannot run without. `sort-arrays` and
 * `sort-constructor-parameters` sort nothing by default and fail schema
 * validation without `useConfigurationIf`, so they get the selector from their
 * documentation: arrays with `as const` and constructors of Angular components,
 * services and pipes.
 *
 * The page imports this module for the config hint, so it must not import the
 * plugin.
 */
const REQUIRED_OPTIONS: Partial<Record<string, Record<string, unknown>>> = {
  'sort-constructor-parameters': {
    useConfigurationIf: {
      matchesAstSelector:
        'ClassDeclaration:has(Decorator[expression.callee.name=/^(Component|Injectable|Pipe)$/]) > ClassBody > MethodDefinition',
    },
  },
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
