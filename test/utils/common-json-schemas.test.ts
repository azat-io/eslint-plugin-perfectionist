import { describe, expect, it } from 'vitest'
import Ajv from 'ajv-draft-04'

import {
  buildCustomGroupsArrayJsonSchema,
  partitionByCommentJsonSchema,
  newlinesBetweenJsonSchema,
  commonJsonSchemas,
  groupsJsonSchema,
  regexJsonSchema,
} from '../../utils/common-json-schemas'

describe('common-json-schemas', () => {
  describe('commonJsonSchemas', () => {
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
        it.each([
          'alphabetical',
          'natural',
          'line-length',
          'custom',
          'unsorted',
        ])("should allow' %s'", type => {
          expect(
            commonJsonSchemaValidator({
              fallbackSort: {
                type,
              },
            }),
          ).toBeTruthy()
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

        it('should not allow the empty object', () => {
          expect(
            commonJsonSchemaValidator({
              fallbackSort: {},
            }),
          ).toBeFalsy()
        })
      })

      describe('order', () => {
        it.each(['asc', 'desc'])("should allow' %s'", order => {
          expect(
            commonJsonSchemaValidator({
              fallbackSort: {
                order,
              },
            }),
          ).toBeTruthy()
        })

        it('should not allow invalid values', () => {
          expect(
            commonJsonSchemaValidator({
              fallbackSort: {
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
            },
          }),
        ).toBeFalsy()
      })
    })
  })

  describe('newlinesBetween', () => {
    let newlinesBetweenJsonSchemaValidator = new Ajv().compile(
      newlinesBetweenJsonSchema,
    )

    it.each(['ignore', 1, 0])("should allow '%s'", newlinesBetween => {
      expect(newlinesBetweenJsonSchemaValidator(newlinesBetween)).toBeTruthy()
    })

    it('should not allow invalid values', () => {
      expect(newlinesBetweenJsonSchemaValidator('invalid')).toBeFalsy()
    })
  })

  describe('groups', () => {
    let groupsJsonSchemaValidator = new Ajv().compile(groupsJsonSchema)

    it('should allow an array of strings', () => {
      expect(groupsJsonSchemaValidator(['group1', 'group2'])).toBeTruthy()
    })

    it('should allow an array of non-empty arrays of strings', () => {
      expect(groupsJsonSchemaValidator([['group1'], ['group3']])).toBeTruthy()
    })

    it('should not allow empty sub-arrays', () => {
      expect(groupsJsonSchemaValidator([[], ['group3']])).toBeFalsy()
    })

    describe('newlinesBetween', () => {
      it.each(['ignore', 1, 0])("should allow' %s'", newlinesBetween => {
        expect(
          groupsJsonSchemaValidator(['group1', { newlinesBetween }, 'group2']),
        ).toBeTruthy()
      })

      it('should not allow invalid values', () => {
        expect(
          groupsJsonSchemaValidator([
            'group1',
            { newlinesBetween: 'invalid' },
            'group2',
          ]),
        ).toBeFalsy()
      })

      it('should not allow additional properties', () => {
        expect(
          groupsJsonSchemaValidator([
            'group1',
            { something: 'something', newlinesBetween: 1 },
            'group2',
          ]),
        ).toBeFalsy()
      })
    })

    describe('commentAbove', () => {
      it("should allow 'commentAbove' with string group", () => {
        expect(
          groupsJsonSchemaValidator([
            'group1',
            { commentAbove: 'foo', group: 'group' },
            'group2',
          ]),
        ).toBeTruthy()
      })

      it("should allow 'commentAbove' with non-empty string array groups", () => {
        expect(
          groupsJsonSchemaValidator([
            'group1',
            { commentAbove: 'foo', group: ['group'] },
            'group2',
          ]),
        ).toBeTruthy()
      })

      it("should not allow 'commentAbove' with empty sub-arrays", () => {
        expect(
          groupsJsonSchemaValidator([
            'group1',
            { commentAbove: 'foo', group: [] },
            'group2',
          ]),
        ).toBeFalsy()
      })

      it('should not allow additional properties', () => {
        expect(
          groupsJsonSchemaValidator([
            'group1',
            { something: 'something', commentAbove: 'foo' },
            'group2',
          ]),
        ).toBeFalsy()
      })
    })

    it("should not allow 'newlinesBetween' and 'commentAbove' in the same object", () => {
      expect(
        groupsJsonSchemaValidator([
          'group1',
          { commentAbove: 'foo', newlinesBetween: 1 },
          'group2',
        ]),
      ).toBeFalsy()
    })

    it('should not allow the empty object', () => {
      expect(groupsJsonSchemaValidator(['group1', {}, 'group2'])).toBeFalsy()
    })
  })

  describe('customGroups', () => {
    let customGroupsJsonSchema = new Ajv().compile(
      buildCustomGroupsArrayJsonSchema({
        singleCustomGroupJsonSchema: {
          customGroupProperty: { type: 'string' },
        },
      }),
    )

    it('should allow arrays of custom groups', () => {
      expect(
        customGroupsJsonSchema([
          {
            customGroupProperty: 'value',
            groupName: 'group',
          },
        ]),
      ).toBeTruthy()
    })

    it("should allow arrays of 'anyOf' custom groups", () => {
      expect(
        customGroupsJsonSchema([
          {
            anyOf: [
              {
                customGroupProperty: 'ss',
              },
            ],
            groupName: 'group',
          },
        ]),
      ).toBeTruthy()
    })

    it("should enforce 'groupName'", () => {
      expect(
        customGroupsJsonSchema([
          {
            customGroupProperty: 'value',
          },
        ]),
      ).toBeFalsy()
    })
  })

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
