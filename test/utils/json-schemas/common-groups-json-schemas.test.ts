import { describe, expect, it } from 'vitest'
import Ajv from 'ajv-draft-04'

import {
  buildCustomGroupsArrayJsonSchema,
  newlinesBetweenJsonSchema,
  newlinesInsideJsonSchema,
  buildGroupsJsonSchema,
} from '../../../utils/json-schemas/common-groups-json-schemas'

describe('common-groups-json-schemas', () => {
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

  describe('newlinesInside', () => {
    let newlinesInsideJsonSchemaValidator = new Ajv().compile(
      newlinesInsideJsonSchema,
    )

    it.each(['ignore', 1, 0])("should allow '%s'", newlinesInside => {
      expect(newlinesInsideJsonSchemaValidator(newlinesInside)).toBeTruthy()
    })

    it('should not allow invalid values', () => {
      expect(newlinesInsideJsonSchemaValidator('invalid')).toBeFalsy()
    })
  })

  describe('groups', () => {
    let groupsJsonSchemaValidator = new Ajv().compile(
      buildGroupsJsonSchema({
        additionalSortProperties: {
          sortField: { type: 'string' },
        },
        allowedAdditionalTypeValues: [],
      }),
    )

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
      it.each(['ignore', 1, 0])("should allow '%s'", newlinesBetween => {
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

    describe('group with overrides option', () => {
      it('should not allow less than 2 properties set', () => {
        expect(groupsJsonSchemaValidator([{ group: 'group' }])).toBeFalsy()
      })

      it('should not allow group to be undefined', () => {
        expect(
          groupsJsonSchemaValidator([
            { commentAbove: 'foo', type: 'unsorted' },
          ]),
        ).toBeFalsy()
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
        ).toBeTruthy()
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
        ).toBeTruthy()
      })

      describe('type', () => {
        it('should allow additional values', () => {
          groupsJsonSchemaValidator = new Ajv().compile(
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
          ).toBeTruthy()
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
      ).toBeTruthy()
    })

    it('should allow additional sort fields', () => {
      expect(
        customGroupsJsonSchema([
          {
            sortField: 'my-field',
            groupName: 'group',
          },
        ]),
      ).toBeTruthy()

      expect(
        customGroupsJsonSchema([
          {
            anyOf: [{ sortField: 'my-field' }],
            groupName: 'group',
          },
        ]),
      ).toBeFalsy()
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

    it("should enforce at least 1 element in 'anyOf'", () => {
      expect(
        customGroupsJsonSchema([
          {
            groupName: 'group',
            anyOf: [],
          },
        ]),
      ).toBeFalsy()
    })

    it('should enforce at least 2 properties if no `anyOf`', () => {
      expect(
        customGroupsJsonSchema([
          {
            groupName: 'group',
          },
        ]),
      ).toBeFalsy()
    })

    it("should enforce 'groupName'", () => {
      expect(
        customGroupsJsonSchema([
          {
            customGroupProperty2: 'value',
            customGroupProperty: 'value',
          },
        ]),
      ).toBeFalsy()
    })

    describe('type', () => {
      it('should allow additional values', () => {
        customGroupsJsonSchema = new Ajv().compile(
          buildCustomGroupsArrayJsonSchema({
            allowedAdditionalTypeValues: ['my-type'],
            singleCustomGroupJsonSchema: {},
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
        ).toBeTruthy()
      })
    })

    describe('fallbackSort', () => {
      it('should allow additional type values', () => {
        customGroupsJsonSchema = new Ajv().compile(
          buildCustomGroupsArrayJsonSchema({
            allowedAdditionalTypeValues: ['my-type'],
            singleCustomGroupJsonSchema: {},
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
        ).toBeTruthy()
      })
    })
  })
})
