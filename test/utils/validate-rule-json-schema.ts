import type { JSONSchema4 } from '@typescript-eslint/utils/json-schema'

import { compile as compileSchemaForTs } from 'json-schema-to-typescript-lite'
import Ajv from 'ajv-draft-04'

export let validateRuleJsonSchema = async (
  schemaOrSchemas: readonly JSONSchema4[] | JSONSchema4,
): Promise<void> => {
  if (Array.isArray(schemaOrSchemas)) {
    for (let schema of schemaOrSchemas) {
      // eslint-disable-next-line no-await-in-loop
      await validateJsonSchema(schema as JSONSchema4)
    }
    return
  }
  await validateJsonSchema(schemaOrSchemas as JSONSchema4)
}

let validateJsonSchema = async (schema: JSONSchema4): Promise<void> => {
  new Ajv().compile(schema)
  await compileSchemaForTs(schema, 'id')
}
