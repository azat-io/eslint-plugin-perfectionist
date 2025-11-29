import { describe, expect, it } from 'vitest'
import Ajv from 'ajv-draft-04'

import {
  commonJsonSchemas,
  regexJsonSchema,
} from '../../../utils/json-schemas/common-json-schemas'

describe('common-json-schemas', () => {
  let commonJsonSchemaValidator = new Ajv().compile({
    properties: commonJsonSchemas,
    additionalProperties: false,
    type: 'object',
  })

  describe('type', () => {
    it.each(['alphabetical', 'natural', 'line-length', 'custom', 'unsorted'])(
      "should allow' %s'",
      type => {
        expect(
          commonJsonSchemaValidator({
            type,
          }),
        ).toBeTruthy()
      },
    )

    it('should not allow invalid values', () => {
      expect(
        commonJsonSchemaValidator({
          type: 'invalid',
        }),
      ).toBeFalsy()
    })
  })

  describe('order', () => {
    it.each(['asc', 'desc'])("should allow' %s'", order => {
      expect(
        commonJsonSchemaValidator({
          order,
        }),
      ).toBeTruthy()
    })

    it('should not allow invalid values', () => {
      expect(
        commonJsonSchemaValidator({
          order: 'invalid',
        }),
      ).toBeFalsy()
    })
  })

  describe('specialCharacters', () => {
    it.each(['remove', 'trim', 'keep'])(
      "should allow' %s'",
      specialCharacters => {
        expect(
          commonJsonSchemaValidator({
            specialCharacters,
          }),
        ).toBeTruthy()
      },
    )

    it('should not allow invalid values', () => {
      expect(
        commonJsonSchemaValidator({
          specialCharacters: 'invalid',
        }),
      ).toBeFalsy()
    })
  })

  describe('fallbackSort', () => {
    describe('type', () => {
      it.each(['alphabetical', 'natural', 'line-length', 'custom', 'unsorted'])(
        "should allow' %s'",
        type => {
          expect(
            commonJsonSchemaValidator({
              fallbackSort: {
                type,
              },
            }),
          ).toBeTruthy()
        },
      )

      it('should not allow undefined type', () => {
        expect(
          commonJsonSchemaValidator({
            fallbackSort: {
              order: 'asc',
            },
          }),
        ).toBeFalsy()
      })

      it('should not allow invalid values', () => {
        expect(
          commonJsonSchemaValidator({
            fallbackSort: {
              type: 'invalid',
            },
          }),
        ).toBeFalsy()
      })
    })

    describe('order', () => {
      it.each(['asc', 'desc'])("should allow' %s'", order => {
        expect(
          commonJsonSchemaValidator({
            fallbackSort: {
              type: 'alphabetical',
              order,
            },
          }),
        ).toBeTruthy()
      })

      it('should not allow invalid values', () => {
        expect(
          commonJsonSchemaValidator({
            fallbackSort: {
              type: 'alphabetical',
              order: 'invalid',
            },
          }),
        ).toBeFalsy()
      })
    })

    it('should not allow additional properties', () => {
      expect(
        commonJsonSchemaValidator({
          fallbackSort: {
            somethingElse: 'something',
            type: 'alphabetical',
          },
        }),
      ).toBeFalsy()
    })
  })

  describe('regex', () => {
    let regexJsonSchemaValidator = new Ajv().compile(regexJsonSchema)

    it('should allow string values', () => {
      expect(regexJsonSchemaValidator('some string')).toBeTruthy()
    })

    it.each([{ pattern: 'pattern' }, { pattern: 'pattern', flags: 'flags' }])(
      "should allow '%s'",
      regex => {
        expect(regexJsonSchemaValidator(regex)).toBeTruthy()
      },
    )

    it("should enforce 'pattern'", () => {
      expect(
        regexJsonSchemaValidator({
          something: 'something',
          pattern: 'pattern',
        }),
      ).toBeFalsy()
    })

    it('should not allow additional properties', () => {
      expect(
        regexJsonSchemaValidator({
          something: 'something',
          pattern: 'pattern',
        }),
      ).toBeFalsy()
    })

    it('should not allow the empty object', () => {
      expect(regexJsonSchemaValidator({})).toBeFalsy()
    })
  })
})
