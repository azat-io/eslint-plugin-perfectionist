import { describe, expect, it } from 'vitest'
import Ajv from 'ajv-draft-04'

import {
  buildCustomGroupsArrayJsonSchema,
  newlinesBetweenJsonSchema,
  newlinesInsideJsonSchema,
  buildGroupsJsonSchema,
} from '../../../utils/json-schemas/common-groups-json-schemas'

let ajv = new Ajv()

describe('common-groups-json-schemas', () => {
  describe('newlinesBetween', () => {
    let newlinesBetweenJsonSchemaValidator = ajv.compile(
      newlinesBetweenJsonSchema,
    )

    it.each(['ignore', 1, 0])("should allow '%s'", newlinesBetween => {
      expect(newlinesBetweenJsonSchemaValidator(newlinesBetween)).toBe(true)
    })

    it('should not allow invalid values', () => {
      expect(newlinesBetweenJsonSchemaValidator('invalid')).toBe(false)
    })
  })

  describe('newlinesInside', () => {
    let newlinesInsideJsonSchemaValidator = ajv.compile(
      newlinesInsideJsonSchema,
    )

    it.each(['ignore', 1, 0])("should allow '%s'", newlinesInside => {
      expect(newlinesInsideJsonSchemaValidator(newlinesInside)).toBe(true)
    })

    it('should not allow invalid values', () => {
      expect(newlinesInsideJsonSchemaValidator('invalid')).toBe(false)
    })
  })

  describe('groups', () => {
    let groupsJsonSchemaValidator = ajv.compile(
      buildGroupsJsonSchema({
        additionalSortProperties: {
          sortField: { type: 'string' },
        },
        allowedAdditionalTypeValues: [],
      }),
    )

    it('should allow an array of strings', () => {
      expect(groupsJsonSchemaValidator(['group1', 'group2'])).toBe(true)
    })

    it('should allow an array of non-empty arrays of strings', () => {
      expect(groupsJsonSchemaValidator([['group1'], ['group3']])).toBe(true)
    })

    it('should not allow empty sub-arrays', () => {
      expect(groupsJsonSchemaValidator([[], ['group3']])).toBe(false)
    })

    describe('newlinesBetween', () => {
      it.each(['ignore', 1, 0])("should allow '%s'", newlinesBetween => {
        expect(
          groupsJsonSchemaValidator(['group1', { newlinesBetween }, 'group2']),
        ).toBe(true)
      })

      it('should not allow invalid values', () => {
        expect(
          groupsJsonSchemaValidator([
            'group1',
            { newlinesBetween: 'invalid' },
            'group2',
          ]),
        ).toBe(false)
      })

      it('should not allow additional properties', () => {
        expect(
          groupsJsonSchemaValidator([
            'group1',
            { something: 'something', newlinesBetween: 1 },
            'group2',
          ]),
        ).toBe(false)
      })
    })

    describe('group with overrides option', () => {
      it('should not allow less than 2 properties set', () => {
        expect(groupsJsonSchemaValidator([{ group: 'group' }])).toBe(false)
      })

      it('should not allow group to be undefined', () => {
        expect(
          groupsJsonSchemaValidator([
            { commentAbove: 'foo', type: 'unsorted' },
          ]),
        ).toBe(false)
      })

      it('should allow overriding options', () => {
        expect(
          groupsJsonSchemaValidator([
            {
              fallbackSort: {
                type: 'alphabetical',
                order: 'asc',
              },
              newlinesInside: 1,
              group: 'group',
              order: 'asc',
            },
          ]),
        ).toBe(true)
      })

      it('should allow additional sort properties', () => {
        expect(
          groupsJsonSchemaValidator([
            {
              fallbackSort: {
                sortField: 'my-field',
                type: 'alphabetical',
              },
              sortField: 'my-field',
              group: 'group',
            },
          ]),
        ).toBe(true)
      })

      describe('type', () => {
        it('should allow additional values', () => {
          groupsJsonSchemaValidator = ajv.compile(
            buildGroupsJsonSchema({
              allowedAdditionalTypeValues: ['my-type'],
              additionalSortProperties: {},
            }),
          )

          expect(
            groupsJsonSchemaValidator([
              {
                type: 'my-type',
                group: 'group',
              },
            ]),
          ).toBe(true)
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
          ).toBe(true)
        })

        it("should allow 'commentAbove' with non-empty string array groups", () => {
          expect(
            groupsJsonSchemaValidator([
              'group1',
              { commentAbove: 'foo', group: ['group'] },
              'group2',
            ]),
          ).toBe(true)
        })

        it("should not allow 'commentAbove' with empty sub-arrays", () => {
          expect(
            groupsJsonSchemaValidator([
              'group1',
              { commentAbove: 'foo', group: [] },
              'group2',
            ]),
          ).toBe(false)
        })

        it('should not allow additional properties', () => {
          expect(
            groupsJsonSchemaValidator([
              'group1',
              { something: 'something', commentAbove: 'foo' },
              'group2',
            ]),
          ).toBe(false)
        })
      })
    })

    it("should not allow 'newlinesBetween' and 'commentAbove' in the same object", () => {
      expect(
        groupsJsonSchemaValidator([
          'group1',
          { commentAbove: 'foo', newlinesBetween: 1 },
          'group2',
        ]),
      ).toBe(false)
    })

    it('should not allow the empty object', () => {
      expect(groupsJsonSchemaValidator(['group1', {}, 'group2'])).toBe(false)
    })
  })

  describe('customGroups', () => {
    let customGroupsJsonSchema = ajv.compile(
      buildCustomGroupsArrayJsonSchema({
        additionalCustomGroupMatchProperties: {
          customGroupProperty2: { type: 'string' },
          customGroupProperty: { type: 'string' },
        },
        additionalSortProperties: {
          sortField: { type: 'string' },
        },
        allowedAdditionalTypeValues: [],
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
      ).toBe(true)
    })

    it('should allow additional sort fields', () => {
      expect(
        customGroupsJsonSchema([
          {
            sortField: 'my-field',
            groupName: 'group',
          },
        ]),
      ).toBe(true)

      expect(
        customGroupsJsonSchema([
          {
            anyOf: [{ sortField: 'my-field' }],
            groupName: 'group',
          },
        ]),
      ).toBe(false)
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
      ).toBe(true)
    })

    it("should enforce at least 1 element in 'anyOf'", () => {
      expect(
        customGroupsJsonSchema([
          {
            groupName: 'group',
            anyOf: [],
          },
        ]),
      ).toBe(false)
    })

    it('should enforce at least 2 properties if no `anyOf`', () => {
      expect(
        customGroupsJsonSchema([
          {
            groupName: 'group',
          },
        ]),
      ).toBe(false)
    })

    it("should enforce 'groupName'", () => {
      expect(
        customGroupsJsonSchema([
          {
            customGroupProperty2: 'value',
            customGroupProperty: 'value',
          },
        ]),
      ).toBe(false)
    })

    describe('type', () => {
      it('should allow additional values', () => {
        customGroupsJsonSchema = ajv.compile(
          buildCustomGroupsArrayJsonSchema({
            allowedAdditionalTypeValues: ['my-type'],
            additionalCustomGroupMatchProperties: {},
            additionalSortProperties: {},
          }),
        )

        expect(
          customGroupsJsonSchema([
            {
              groupName: 'group',
              type: 'my-type',
            },
          ]),
        ).toBe(true)
      })
    })

    describe('fallbackSort', () => {
      it('should allow additional type values', () => {
        customGroupsJsonSchema = ajv.compile(
          buildCustomGroupsArrayJsonSchema({
            allowedAdditionalTypeValues: ['my-type'],
            additionalCustomGroupMatchProperties: {},
            additionalSortProperties: {},
          }),
        )

        expect(
          customGroupsJsonSchema([
            {
              fallbackSort: {
                type: 'my-type',
              },
              groupName: 'group',
            },
          ]),
        ).toBe(true)
      })
    })
  })
})
