import type { JSONSchema4 } from '@typescript-eslint/utils/json-schema'
import type { RuleModule } from '@typescript-eslint/utils/ts-eslint'

import * as jsonSpecv4 from 'ajv/lib/refs/json-schema-draft-04.json'
import { TSUtils } from '@typescript-eslint/utils'
import Ajv from 'ajv'

// Lovingly borrowed from: https://github.com/typescript-eslint/typescript-eslint/pull/6947/files
// TODO: It would be nicer to have https://github.com/eslint/eslint/pull/16823, but it's back in draft.
const ajv = new Ajv({
  schemaId: 'auto',
  async: false,
  meta: false,
})
ajv.addMetaSchema(jsonSpecv4)
// @ts-ignore
ajv._opts.defaultMeta = jsonSpecv4.id
// @ts-ignore
ajv._refs['http://json-schema.org/schema'] =
  'http://json-schema.org/draft-04/schema'

export let areOptionsValid = (
  rule: RuleModule<string, readonly unknown[]>,
  options: unknown,
): boolean | string => {
  let normalizedSchema = normalizeSchema(rule.meta.schema)

  let validate = ajv.compile(normalizedSchema)

  let valid = validate([options])
  if (typeof valid !== 'boolean') {
    // Schema could not validate options synchronously. This is not allowed for ESLint rules.
    return false
  }

  return valid || ajv.errorsText(validate.errors)
}

let normalizeSchema = (
  schema: readonly JSONSchema4[] | JSONSchema4,
): JSONSchema4 => {
  if (!TSUtils.isArray(schema)) {
    return schema
  }

  if (schema.length === 0) {
    return {
      type: 'array',
      minItems: 0,
      maxItems: 0,
    }
  }

  return {
    items: schema as JSONSchema4[],
    maxItems: schema.length,
    type: 'array',
    minItems: 0,
  }
}
