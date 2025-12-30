import { describe, expect, it } from 'vitest'
import Ajv from 'ajv-draft-04'

import {
  buildCommonJsonSchemas,
  buildRegexJsonSchema,
} from '../../../utils/json-schemas/common-json-schemas'

describe('common-json-schemas', () => {
  let commonJsonSchemaValidator = compileObjectSchema(buildCommonJsonSchemas())

  it('should allow additional sort properties', () => {
    commonJsonSchemaValidator = compileObjectSchema(
      buildCommonJsonSchemas({
        additionalSortProperties: {
          myProperty: { type: 'string' },
        },
      }),
    )

    expect(
      commonJsonSchemaValidator({
        myProperty: 'my-property',
      }),
    ).toBeTruthy()
  })

  describe('type', () => {
    it.each(['alphabetical', 'natural', 'line-length', 'custom', 'unsorted'])(
      "should allow '%s'",
      type => {
        expect(
          commonJsonSchemaValidator({
            type,
          }),
        ).toBeTruthy()
      },
    )

    it('should allow additional values', () => {
      commonJsonSchemaValidator = compileObjectSchema(
        buildCommonJsonSchemas({
          allowedAdditionalTypeValues: ['my-type'],
        }),
      )

      expect(
        commonJsonSchemaValidator({
          type: 'my-type',
        }),
      ).toBeTruthy()
    })

    it('should not allow invalid values', () => {
      expect(
        commonJsonSchemaValidator({
          type: 'invalid',
        }),
      ).toBeFalsy()
    })
  })

  describe('order', () => {
    it.each(['asc', 'desc'])("should allow '%s'", order => {
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
      "should allow '%s'",
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
        "should allow '%s'",
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

      it('should allow additional values', () => {
        commonJsonSchemaValidator = compileObjectSchema(
          buildCommonJsonSchemas({
            allowedAdditionalTypeValues: ['my-type'],
          }),
        )

        expect(
          commonJsonSchemaValidator({
            fallbackSort: {
              type: 'my-type',
            },
          }),
        ).toBeTruthy()
      })

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
      it.each(['asc', 'desc'])("should allow '%s'", order => {
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

    it('should allow additional sort properties', () => {
      commonJsonSchemaValidator = compileObjectSchema(
        buildCommonJsonSchemas({
          additionalSortProperties: {
            myProperty: { type: 'string' },
          },
        }),
      )

      expect(
        commonJsonSchemaValidator({
          fallbackSort: {
            myProperty: 'my-property',
            type: 'alphabetical',
          },
        }),
      ).toBeTruthy()
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
    let regexJsonSchemaValidator = new Ajv().compile(buildRegexJsonSchema())

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

  function compileObjectSchema(schema: object): (data: unknown) => boolean {
    return new Ajv().compile({
      additionalProperties: false,
      properties: schema,
      type: 'object',
    })
  }
})
