import { describe, expect, it } from 'vitest'
import Ajv from 'ajv-draft-04'

import {
  buildCommonJsonSchemas,
  buildRegexJsonSchema,
} from '../../../utils/json-schemas/common-json-schemas'

let ajv = new Ajv()

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
    ).toBe(true)
  })

  describe('type', () => {
    it.each([
      'alphabetical',
      'natural',
      'line-length',
      'custom',
      'unsorted',
      'subgroup-order',
    ])("should allow '%s'", type => {
      expect(
        commonJsonSchemaValidator({
          type,
        }),
      ).toBe(true)
    })

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
      ).toBe(true)
    })

    it('should not allow invalid values', () => {
      expect(
        commonJsonSchemaValidator({
          type: 'invalid',
        }),
      ).toBe(false)
    })
  })

  describe('order', () => {
    it.each(['asc', 'desc'])("should allow '%s'", order => {
      expect(
        commonJsonSchemaValidator({
          order,
        }),
      ).toBe(true)
    })

    it('should not allow invalid values', () => {
      expect(
        commonJsonSchemaValidator({
          order: 'invalid',
        }),
      ).toBe(false)
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
        ).toBe(true)
      },
    )

    it('should not allow invalid values', () => {
      expect(
        commonJsonSchemaValidator({
          specialCharacters: 'invalid',
        }),
      ).toBe(false)
    })
  })

  describe('fallbackSort', () => {
    describe('type', () => {
      it.each([
        'alphabetical',
        'natural',
        'line-length',
        'custom',
        'unsorted',
        'subgroup-order',
      ])("should allow '%s'", type => {
        expect(
          commonJsonSchemaValidator({
            fallbackSort: {
              type,
            },
          }),
        ).toBe(true)
      })

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
        ).toBe(true)
      })

      it('should not allow undefined type', () => {
        expect(
          commonJsonSchemaValidator({
            fallbackSort: {
              order: 'asc',
            },
          }),
        ).toBe(false)
      })

      it('should not allow invalid values', () => {
        expect(
          commonJsonSchemaValidator({
            fallbackSort: {
              type: 'invalid',
            },
          }),
        ).toBe(false)
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
        ).toBe(true)
      })

      it('should not allow invalid values', () => {
        expect(
          commonJsonSchemaValidator({
            fallbackSort: {
              type: 'alphabetical',
              order: 'invalid',
            },
          }),
        ).toBe(false)
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
      ).toBe(true)
    })

    it('should not allow additional properties', () => {
      expect(
        commonJsonSchemaValidator({
          fallbackSort: {
            somethingElse: 'something',
            type: 'alphabetical',
          },
        }),
      ).toBe(false)
    })
  })

  describe('regex', () => {
    let regexJsonSchemaValidator = ajv.compile(buildRegexJsonSchema())

    it('should allow string values', () => {
      expect(regexJsonSchemaValidator('some string')).toBe(true)
    })

    it.each([{ pattern: 'pattern' }, { pattern: 'pattern', flags: 'flags' }])(
      "should allow '%s'",
      regex => {
        expect(regexJsonSchemaValidator(regex)).toBe(true)
      },
    )

    it("should enforce 'pattern'", () => {
      expect(
        regexJsonSchemaValidator({
          something: 'something',
          pattern: 'pattern',
        }),
      ).toBe(false)
    })

    it('should not allow additional properties', () => {
      expect(
        regexJsonSchemaValidator({
          something: 'something',
          pattern: 'pattern',
        }),
      ).toBe(false)
    })

    it('should not allow the empty object', () => {
      expect(regexJsonSchemaValidator({})).toBe(false)
    })
  })

  function compileObjectSchema(schema: object): (data: unknown) => boolean {
    return ajv.compile({
      additionalProperties: false,
      properties: schema,
      type: 'object',
    })
  }
})
