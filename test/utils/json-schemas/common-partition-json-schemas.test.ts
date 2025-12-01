import { describe, expect, it } from 'vitest'
import Ajv from 'ajv-draft-04'

import { partitionByCommentJsonSchema } from '../../../utils/json-schemas/common-partition-json-schemas'

describe('common-partition-json-schemas', () => {
  describe('partitionByComment', () => {
    let partitionByCommentJsonSchemaValidator = new Ajv().compile(
      partitionByCommentJsonSchema,
    )

    it('should allow boolean values', () => {
      expect(partitionByCommentJsonSchemaValidator(true)).toBeTruthy()
    })

    it.each([{ block: true }, { line: true }, { block: true, line: true }])(
      "should allow '%s'",
      partitionByComment => {
        expect(
          partitionByCommentJsonSchemaValidator(partitionByComment),
        ).toBeTruthy()
      },
    )

    it('should not allow the empty object', () => {
      expect(partitionByCommentJsonSchemaValidator({})).toBeFalsy()
    })
  })
})
