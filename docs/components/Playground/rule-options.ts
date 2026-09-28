/**
 * Options a rule cannot run without. `sort-arrays` sorts nothing by default and
 * fails schema validation without `useConfigurationIf`, so it gets the `as
 * const` selector from its documentation.
 *
 * The page imports this module for the config hint, so it must not import the
 * plugin.
 */
export const REQUIRED_OPTIONS: Partial<
  Record<string, Record<string, unknown>>
> = {
  'sort-arrays': {
    useConfigurationIf: {
      matchesAstSelector:
        'TSAsExpression[typeAnnotation.typeName.name=const] > ArrayExpression',
    },
  },
}
