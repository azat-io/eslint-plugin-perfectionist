import { createRuleTester } from 'eslint-vitest-rule-tester'
import typescriptParser from '@typescript-eslint/parser'
import { describe, it } from 'vitest'
import dedent from 'dedent'

import rule from '../../rules/sort-object-types'
import { Alphabet } from '../../utils/alphabet'

describe('sort-object-types', () => {
  let { invalid, valid } = createRuleTester({
    name: 'sort-object-types',
    parser: typescriptParser,
    rule,
  })

  describe('alphabetical', () => {
    let options = {
      type: 'alphabetical',
      order: 'asc',
    } as const

    it('sorts type members', async () => {
      await valid({
        code: dedent`
          type Type = {
            a: 'aaa'
            b: 'bb'
            c: 'c'
          }
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            messageId: 'unexpectedObjectTypesOrder',
            data: { right: 'b', left: 'c' },
          },
        ],
        output: dedent`
          type Type = {
            a: 'aaa'
            b: 'bb'
            c: 'c'
          }
        `,
        code: dedent`
          type Type = {
            a: 'aaa'
            c: 'c'
            b: 'bb'
          }
        `,
        options: [options],
      })
    })

    it('sorts type members in function args', async () => {
      await valid({
        code: dedent`
          let Func = (arguments: {
            a: 'aaa'
            b: 'bb'
            c: 'c'
          }) => {
            // ...
          }
        `,
        options: [options],
      })

      await invalid({
        output: dedent`
          let Func = (arguments: {
            a: 'aaa'
            b: 'bb'
            c: 'c'
          }) => {
            // ...
          }
        `,
        code: dedent`
          let Func = (arguments: {
            b: 'bb'
            a: 'aaa'
            c: 'c'
          }) => {
            // ...
          }
        `,
        errors: [
          {
            messageId: 'unexpectedObjectTypesOrder',
            data: { right: 'a', left: 'b' },
          },
        ],
        options: [options],
      })
    })

    it('sorts type members with computed keys', async () => {
      await valid({
        code: dedent`
          type Type = {
            [key: string]: string
            a?: 'aaa'
            b: 'bb'
            c: 'c'
            [value]: string
          }
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            data: { right: '[key: string]', left: 'a' },
            messageId: 'unexpectedObjectTypesOrder',
          },
          {
            data: {
              left: 'value',
              right: 'c',
            },
            messageId: 'unexpectedObjectTypesOrder',
          },
        ],
        output: dedent`
          type Type = {
            [key: string]: string
            a?: 'aaa'
            b: 'bb'
            c: 'c'
            [value]: string
          }
        `,
        code: dedent`
          type Type = {
            a?: 'aaa'
            [key: string]: string
            b: 'bb'
            [value]: string
            c: 'c'
          }
        `,
        options: [options],
      })
    })

    it('sorts type members with any key types', async () => {
      await valid({
        code: dedent`
          type Type = {
            [...values]
            [[data]]: string
            [name in v]?
            [8]: Value
            arrowFunc?: () => void
            func(): void
          }
        `,
        options: [options],
      })

      await invalid({
        output: dedent`
          type Type = {
            [...values]
            [[data]]: string
            [name in v]?
            [8]: Value
            arrowFunc?: () => void
            func(): void
          }
        `,
        code: dedent`
          type Type = {
            [...values]
            [[data]]: string
            [name in v]?
            [8]: Value
            func(): void
            arrowFunc?: () => void
          }
        `,
        errors: [
          {
            data: { right: 'arrowFunc', left: 'func' },
            messageId: 'unexpectedObjectTypesOrder',
          },
        ],
        options: [options],
      })
    })

    it('sorts inline type members', async () => {
      await valid({
        code: dedent`
          func<{ a: 'aa'; b: 'b' }>(/* ... */)
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            messageId: 'unexpectedObjectTypesOrder',
            data: { right: 'a', left: 'b' },
          },
        ],
        output: dedent`
          func<{ a: 'aa'; b: 'b'; }>(/* ... */)
        `,
        code: dedent`
          func<{ b: 'b'; a: 'aa' }>(/* ... */)
        `,
        options: [options],
      })
    })

    it('sorts complex predefined groups', async () => {
      await invalid({
        errors: [
          {
            data: {
              leftGroup: 'required-property',
              rightGroup: 'index-signature',
              right: '[key: string]',
              left: 'a',
            },
            messageId: 'unexpectedObjectTypesGroupOrder',
          },
          {
            data: {
              rightGroup: 'optional-multiline-member',
              leftGroup: 'index-signature',
              left: '[key: string]',
              right: 'b',
            },
            messageId: 'unexpectedObjectTypesGroupOrder',
          },
          {
            data: {
              leftGroup: 'optional-multiline-member',
              rightGroup: 'required-method',
              right: 'c',
              left: 'b',
            },
            messageId: 'unexpectedObjectTypesGroupOrder',
          },
        ],
        options: [
          {
            ...options,
            groups: [
              'unknown',
              'required-method',
              'optional-multiline-member',
              'index-signature',
              'required-property',
            ],
          },
        ],
        output: dedent`
          type Type = {
            c(): void
            b?: {
              property: string;
            }
            [key: string]: string;
            a: string
          }
        `,
        code: dedent`
          type Type = {
            a: string
            [key: string]: string;
            b?: {
              property: string;
            }
            c(): void
          }
        `,
      })
    })

    it('prioritizes selectors over modifiers quantity', async () => {
      await invalid({
        errors: [
          {
            data: {
              leftGroup: 'required-property',
              rightGroup: 'method',
              left: 'property',
              right: 'method',
            },
            messageId: 'unexpectedObjectTypesGroupOrder',
          },
        ],
        options: [
          {
            ...options,
            groups: ['method', 'required-property'],
          },
        ],
        output: dedent`
          type Type = {
            method(): void
            property: string
          }
        `,
        code: dedent`
          type Type = {
            property: string
            method(): void
          }
        `,
      })
    })

    it('prioritizes index-signature over member', async () => {
      await invalid({
        errors: [
          {
            data: {
              rightGroup: 'index-signature',
              right: '[key: string]',
              leftGroup: 'member',
              left: 'member',
            },
            messageId: 'unexpectedObjectTypesGroupOrder',
          },
        ],
        output: dedent`
          type Type = {
            [key: string]: string;
            member: "something";
          }
        `,
        code: dedent`
          type Type = {
            member: "something";
            [key: string]: string;
          }
        `,
        options: [
          {
            ...options,
            groups: ['index-signature', 'member'],
          },
        ],
      })
    })

    it('prioritizes method over member', async () => {
      await invalid({
        errors: [
          {
            data: {
              rightGroup: 'method',
              leftGroup: 'member',
              right: 'method',
              left: 'member',
            },
            messageId: 'unexpectedObjectTypesGroupOrder',
          },
        ],
        output: dedent`
          type Type = {
            method(): string
            member: "something"
          }
        `,
        code: dedent`
          type Type = {
            member: "something"
            method(): string
          }
        `,
        options: [
          {
            ...options,
            groups: ['method', 'member'],
          },
        ],
      })
    })

    it('prioritizes property over member', async () => {
      await invalid({
        errors: [
          {
            data: {
              rightGroup: 'property',
              leftGroup: 'member',
              right: 'property',
              left: 'method',
            },
            messageId: 'unexpectedObjectTypesGroupOrder',
          },
        ],
        output: dedent`
          type Type = {
            property: string
            method(): string
          }
        `,
        code: dedent`
          type Type = {
            method(): string
            property: string
          }
        `,
        options: [
          {
            ...options,
            groups: ['property', 'member'],
          },
        ],
      })
    })

    it('prioritizes multiline over optional', async () => {
      await invalid({
        errors: [
          {
            data: {
              rightGroup: 'multiline-property',
              leftGroup: 'optional-property',
              right: 'multilineProperty',
              left: 'optionalProperty',
            },
            messageId: 'unexpectedObjectTypesGroupOrder',
          },
        ],
        output: dedent`
          type Type = {
            multilineProperty: {
              a: string
            }
            optionalProperty?: string
          }
        `,
        code: dedent`
          type Type = {
            optionalProperty?: string
            multilineProperty: {
              a: string
            }
          }
        `,
        options: [
          {
            ...options,
            groups: ['multiline-property', 'optional-property'],
          },
        ],
      })
    })

    it('prioritizes multiline over required', async () => {
      await invalid({
        errors: [
          {
            data: {
              rightGroup: 'multiline-property',
              leftGroup: 'required-property',
              right: 'multilineProperty',
              left: 'requiredProperty',
            },
            messageId: 'unexpectedObjectTypesGroupOrder',
          },
        ],
        output: dedent`
          type Type = {
            multilineProperty: {
              a: string
            }
            requiredProperty: string
          }
        `,
        code: dedent`
          type Type = {
            requiredProperty: string
            multilineProperty: {
              a: string
            }
          }
        `,
        options: [
          {
            ...options,
            groups: ['multiline-property', 'required-property'],
          },
        ],
      })
    })

    it('allows overriding options in groups', async () => {
      await invalid({
        options: [
          {
            groups: [
              {
                type: 'alphabetical',
                newlinesInside: 1,
                group: 'unknown',
                order: 'desc',
              },
            ],
            type: 'unsorted',
          },
        ],
        errors: [
          {
            messageId: 'unexpectedObjectTypesOrder',
            data: { right: 'b', left: 'a' },
          },
          {
            messageId: 'missedSpacingBetweenObjectTypeMembers',
            data: { right: 'b', left: 'a' },
          },
        ],
        output: dedent`
          type Type = {
            b: string;

            a: string;
          }
        `,
        code: dedent`
          type Type = {
            a: string;
            b: string;
          }
        `,
      })
    })

    it('filters on selector and modifiers', async () => {
      await invalid({
        options: [
          {
            customGroups: [
              {
                groupName: 'unusedCustomGroup',
                modifiers: ['optional'],
                selector: 'method',
              },
              {
                groupName: 'optionalPropertyGroup',
                modifiers: ['optional'],
                selector: 'property',
              },
              {
                groupName: 'propertyGroup',
                selector: 'property',
              },
            ],
            groups: ['propertyGroup', 'optionalPropertyGroup'],
          },
        ],
        errors: [
          {
            data: {
              leftGroup: 'optionalPropertyGroup',
              rightGroup: 'propertyGroup',
              right: 'c',
              left: 'b',
            },
            messageId: 'unexpectedObjectTypesGroupOrder',
          },
        ],
        output: dedent`
          type Type = {
            c: string
            a?: string
            b?: string
          }
        `,
        code: dedent`
          type Type = {
            a?: string
            b?: string
            c: string
          }
        `,
      })
    })

    it.each([
      ['string pattern', 'hello'],
      ['array with string pattern', ['noMatch', 'hello']],
      ['regex pattern', { pattern: 'HELLO', flags: 'i' }],
      [
        'array with regex pattern',
        ['noMatch', { pattern: 'HELLO', flags: 'i' }],
      ],
    ])(
      'filters on elementNamePattern with %s',
      async (_description, elementNamePattern) => {
        await invalid({
          options: [
            {
              customGroups: [
                {
                  groupName: 'propertiesStartingWithHello',
                  selector: 'property',
                  elementNamePattern,
                },
              ],
              groups: ['propertiesStartingWithHello', 'unknown'],
            },
          ],
          errors: [
            {
              data: {
                rightGroup: 'propertiesStartingWithHello',
                right: 'helloProperty',
                leftGroup: 'unknown',
                left: 'method',
              },
              messageId: 'unexpectedObjectTypesGroupOrder',
            },
          ],
          output: dedent`
            type Type = {
              helloProperty: string
              a: string
              b: string
              method(): void
            }
          `,
          code: dedent`
            type Type = {
              a: string
              b: string
              method(): void
              helloProperty: string
            }
          `,
        })
      },
    )

    it.each([
      ['string pattern', 'Date'],
      ['array with string pattern', ['noMatch', 'Date']],
      ['regex pattern', { pattern: 'DATE', flags: 'i' }],
      [
        'array with regex pattern',
        ['noMatch', { pattern: 'DATE', flags: 'i' }],
      ],
    ])(
      'filters on elementValuePattern with %s',
      async (_description, dateElementValuePattern) => {
        await invalid({
          options: [
            {
              customGroups: [
                {
                  elementValuePattern: dateElementValuePattern,
                  groupName: 'date',
                },
                {
                  elementValuePattern: 'number',
                  groupName: 'number',
                },
              ],
              groups: ['number', 'date', 'unknown'],
            },
          ],
          errors: [
            {
              data: {
                rightGroup: 'number',
                leftGroup: 'date',
                right: 'z',
                left: 'y',
              },
              messageId: 'unexpectedObjectTypesGroupOrder',
            },
          ],
          output: dedent`
            type Type = {
              a: number
              z: number
              b: Date
              y: Date
              c(): string
            }
          `,
          code: dedent`
            type Type = {
              a: number
              b: Date
              y: Date
              z: number
              c(): string
            }
          `,
        })
      },
    )

    it('sorts custom groups by overriding type and order', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedObjectTypesOrder',
            data: { right: 'bb', left: 'a' },
          },
          {
            messageId: 'unexpectedObjectTypesOrder',
            data: { right: 'ccc', left: 'bb' },
          },
          {
            messageId: 'unexpectedObjectTypesOrder',
            data: { right: 'dddd', left: 'ccc' },
          },
          {
            data: {
              rightGroup: 'reversedPropertiesByLineLength',
              leftGroup: 'unknown',
              left: 'method',
              right: 'eee',
            },
            messageId: 'unexpectedObjectTypesGroupOrder',
          },
        ],
        options: [
          {
            customGroups: [
              {
                groupName: 'reversedPropertiesByLineLength',
                selector: 'property',
                type: 'line-length',
                order: 'desc',
              },
            ],
            groups: ['reversedPropertiesByLineLength', 'unknown'],
            type: 'alphabetical',
            order: 'asc',
          },
        ],
        output: dedent`
          type Type = {
            dddd: string
            ccc: string
            eee: string
            bb: string
            ff: string
            a: string
            g: string
            anotherMethod(): void
            method(): void
            yetAnotherMethod(): void
          }
        `,
        code: dedent`
          type Type = {
            a: string
            bb: string
            ccc: string
            dddd: string
            method(): void
            eee: string
            ff: string
            g: string
            anotherMethod(): void
            yetAnotherMethod(): void
          }
        `,
      })
    })

    it('sorts custom groups by overriding fallbackSort', async () => {
      await invalid({
        options: [
          {
            customGroups: [
              {
                fallbackSort: {
                  type: 'alphabetical',
                  order: 'asc',
                },
                elementNamePattern: '^foo',
                type: 'line-length',
                groupName: 'foo',
                order: 'desc',
              },
            ],
            type: 'alphabetical',
            groups: ['foo'],
            order: 'asc',
          },
        ],
        errors: [
          {
            data: { right: 'fooBar', left: 'fooZar' },
            messageId: 'unexpectedObjectTypesOrder',
          },
        ],
        output: dedent`
          type Type = {
            fooBar: string
            fooZar: string
          }
        `,
        code: dedent`
          type Type = {
            fooZar: string
            fooBar: string
          }
        `,
      })

      await invalid({
        options: [
          {
            customGroups: [
              {
                fallbackSort: {
                  type: 'alphabetical',
                  sortBy: 'value',
                },
                elementValuePattern: '^foo',
                type: 'line-length',
                groupName: 'foo',
              },
            ],
            type: 'alphabetical',
            groups: ['foo'],
            order: 'asc',
          },
        ],
        errors: [
          {
            messageId: 'unexpectedObjectTypesOrder',
            data: { right: 'b', left: 'a' },
          },
        ],
        output: dedent`
          type Type = {
            b: fooBar
            a: fooZar
          }
        `,
        code: dedent`
          type Type = {
            a: fooZar
            b: fooBar
          }
        `,
      })
    })

    it('sorts custom groups by overriding sortBy', async () => {
      await invalid({
        errors: [
          {
            data: {
              rightGroup: 'fooElementsSortedByValue',
              leftGroup: 'unknown',
              right: 'fooC',
              left: 'z',
            },
            messageId: 'unexpectedObjectTypesGroupOrder',
          },
          {
            messageId: 'unexpectedObjectTypesOrder',
            data: { right: 'fooA', left: 'fooB' },
          },
          {
            data: {
              rightGroup: 'fooElementsSortedByValue',
              leftGroup: 'unknown',
              right: 'fooMethod',
              left: 'a',
            },
            messageId: 'unexpectedObjectTypesGroupOrder',
          },
        ],
        options: [
          {
            customGroups: [
              {
                groupName: 'fooElementsSortedByValue',
                elementNamePattern: '^foo',
                sortBy: 'value',
              },
            ],
            groups: ['fooElementsSortedByValue', 'unknown'],
            type: 'alphabetical',
            order: 'asc',
          },
        ],
        output: dedent`
          type Type = {
            fooA: Date
            fooC: number
            fooB: string
            fooMethod(): void
            a: string
            z: boolean
          }
        `,
        code: dedent`
          type Type = {
            z: boolean
            fooC: number
            fooB: string
            fooA: Date
            a: string
            fooMethod(): void
          }
        `,
      })
    })

    it('does not sort custom groups with unsorted type', async () => {
      await invalid({
        options: [
          {
            customGroups: [
              {
                groupName: 'unsortedProperties',
                selector: 'property',
                type: 'unsorted',
              },
            ],
            groups: ['unsortedProperties', 'unknown'],
          },
        ],
        errors: [
          {
            data: {
              rightGroup: 'unsortedProperties',
              leftGroup: 'unknown',
              left: 'method',
              right: 'c',
            },
            messageId: 'unexpectedObjectTypesGroupOrder',
          },
        ],
        output: dedent`
          type Type = {
            b
            a
            d
            e
            c
            method(): void
          }
        `,
        code: dedent`
          type Type = {
            b
            a
            d
            e
            method(): void
            c
          }
        `,
      })
    })

    it('sorts custom group blocks', async () => {
      await invalid({
        options: [
          {
            customGroups: [
              {
                anyOf: [
                  {
                    modifiers: ['required'],
                    selector: 'property',
                  },
                  {
                    modifiers: ['optional'],
                    selector: 'method',
                  },
                ],
                groupName: 'requiredPropertiesAndOptionalMethods',
              },
            ],
            groups: [
              ['requiredPropertiesAndOptionalMethods', 'index-signature'],
              'unknown',
            ],
          },
        ],
        errors: [
          {
            data: {
              rightGroup: 'requiredPropertiesAndOptionalMethods',
              leftGroup: 'unknown',
              right: 'd',
              left: 'c',
            },
            messageId: 'unexpectedObjectTypesGroupOrder',
          },
          {
            data: { right: '[key: string]', left: 'e' },
            messageId: 'unexpectedObjectTypesOrder',
          },
        ],
        output: dedent`
          type Type = {
            [key: string]: string
            a: string
            d?: () => void
            e: string
            b(): void
            c?: string
          }
        `,
        code: dedent`
          type Type = {
            a: string
            b(): void
            c?: string
            d?: () => void
            e: string
            [key: string]: string
          }
        `,
      })
    })

    it('allows to use regex for element names in custom groups', async () => {
      await valid({
        options: [
          {
            customGroups: [
              {
                elementNamePattern: '^(?!.*Foo).*$',
                groupName: 'elementsWithoutFoo',
              },
            ],
            groups: ['unknown', 'elementsWithoutFoo'],
            type: 'alphabetical',
          },
        ],
        code: dedent`
          type Type = {
            iHaveFooInMyName: string
            meTooIHaveFoo: string
            a: string
            b: string
          }
        `,
      })
    })

    it('allows to use newlinesInside: 1', async () => {
      await invalid({
        options: [
          {
            customGroups: [
              {
                selector: 'property',
                groupName: 'group1',
                newlinesInside: 1,
              },
            ],
            groups: ['group1'],
          },
        ],
        errors: [
          {
            messageId: 'missedSpacingBetweenObjectTypeMembers',
            data: { right: 'b', left: 'a' },
          },
        ],
        output: dedent`
          type type = {
            a

            b
          }
        `,
        code: dedent`
          type type = {
            a
            b
          }
        `,
      })
    })

    it('allows to use newlinesInside: 0', async () => {
      await invalid({
        options: [
          {
            customGroups: [
              {
                selector: 'property',
                groupName: 'group1',
                newlinesInside: 0,
              },
            ],
            type: 'alphabetical',
            groups: ['group1'],
          },
        ],
        errors: [
          {
            messageId: 'extraSpacingBetweenObjectTypeMembers',
            data: { right: 'b', left: 'a' },
          },
        ],
        output: dedent`
          type type = {
            a
            b
          }
        `,
        code: dedent`
          type type = {
            a

            b
          }
        `,
      })
    })

    it('allows to use regex for custom groups', async () => {
      await valid({
        options: [
          {
            ...options,
            customGroups: [
              {
                elementNamePattern: '^(?!.*Foo).*$',
                groupName: 'elementsWithoutFoo',
              },
            ],
            groups: ['unknown', 'elementsWithoutFoo'],
          },
        ],
        code: dedent`
          type T = {
            iHaveFooInMyName: string
            meTooIHaveFoo: string
            a: string
            b: string
          }
        `,
      })
    })

    it('allows to use in class methods', async () => {
      await invalid({
        output: dedent`
          class Class {
            async method (data: {
              a: 'aaa'
              b: 'bb'
              c: 'c'
            }) {}
          }
        `,
        code: dedent`
          class Class {
            async method (data: {
              b: 'bb'
              a: 'aaa'
              c: 'c'
            }) {}
          }
        `,
        errors: [
          {
            messageId: 'unexpectedObjectTypesOrder',
            data: { right: 'a', left: 'b' },
          },
        ],
        options: [options],
      })
    })

    it('allows to use new line as partition', async () => {
      await valid({
        code: dedent`
          type Type = {
            d: 'dd'
            e: 'e'

            c: 'ccc'

            a: 'aaaaa'
            b: 'bbbb'
          }
        `,
        options: [
          {
            ...options,
            partitionByNewLine: true,
          },
        ],
      })

      await invalid({
        errors: [
          {
            messageId: 'unexpectedObjectTypesOrder',
            data: { right: 'd', left: 'e' },
          },
          {
            messageId: 'unexpectedObjectTypesOrder',
            data: { right: 'a', left: 'b' },
          },
        ],
        output: dedent`
          type Type = {
            d: 'dd'
            e: 'e'

            c: 'ccc'

            a: 'aaaaa'
            b: 'bbbb'
          }
        `,
        code: dedent`
          type Type = {
            e: 'e'
            d: 'dd'

            c: 'ccc'

            b: 'bbbb'
            a: 'aaaaa'
          }
        `,
        options: [
          {
            ...options,
            partitionByNewLine: true,
          },
        ],
      })
    })

    it('allows to use partition comments', async () => {
      await invalid({
        output: dedent`
          type Type = {
            // Part: A
            // Not partition comment
            bbb: string
            cc: string
            d: string
            // Part: B
            aaaa: string
            e: string
            // Part: C
            // Not partition comment
            fff: string
            'gg': string
          }
        `,
        code: dedent`
          type Type = {
            // Part: A
            cc: string
            d: string
            // Not partition comment
            bbb: string
            // Part: B
            aaaa: string
            e: string
            // Part: C
            'gg': string
            // Not partition comment
            fff: string
          }
        `,
        errors: [
          {
            messageId: 'unexpectedObjectTypesOrder',
            data: { right: 'bbb', left: 'd' },
          },
          {
            messageId: 'unexpectedObjectTypesOrder',
            data: { right: 'fff', left: 'gg' },
          },
        ],
        options: [
          {
            ...options,
            partitionByComment: '^Part',
          },
        ],
      })
    })

    it('allows to use all comments as parts', async () => {
      await valid({
        code: dedent`
          type Type = {
            // Comment
            bb: string
            // Other comment
            a: string
          }
        `,
        options: [
          {
            ...options,
            partitionByComment: true,
          },
        ],
      })
    })

    it('allows to use multiple partition comments', async () => {
      await invalid({
        output: dedent`
          type Type = {
            /* Partition Comment */
            // Part: A
            d: string
            // Part: B
            aaa: string
            bb: string
            c: string
            /* Other */
            e: string
          }
        `,
        code: dedent`
          type Type = {
            /* Partition Comment */
            // Part: A
            d: string
            // Part: B
            aaa: string
            c: string
            bb: string
            /* Other */
            e: string
          }
        `,
        errors: [
          {
            messageId: 'unexpectedObjectTypesOrder',
            data: { right: 'bb', left: 'c' },
          },
        ],
        options: [
          {
            ...options,
            partitionByComment: ['Partition Comment', 'Part:', 'Other'],
          },
        ],
      })
    })

    it('allows to use regex for partition comments', async () => {
      await valid({
        code: dedent`
          type Type = {
            e: string
            f: string
            // I am a partition comment because I don't have f o o
            a: string
            b: string
          }
        `,
        options: [
          {
            ...options,
            partitionByComment: ['^(?!.*foo).*$'],
          },
        ],
      })
    })

    it('ignores block comments', async () => {
      await invalid({
        options: [
          {
            ...options,
            partitionByComment: {
              line: true,
            },
          },
        ],
        errors: [
          {
            messageId: 'unexpectedObjectTypesOrder',
            data: { right: 'a', left: 'b' },
          },
        ],
        output: dedent`
          type Type = {
            /* Comment */
            a: string
            b: string
          }
        `,
        code: dedent`
          type Type = {
            b: string
            /* Comment */
            a: string
          }
        `,
      })
    })

    it('allows to use all line comments as parts', async () => {
      await valid({
        options: [
          {
            ...options,
            partitionByComment: {
              line: true,
            },
          },
        ],
        code: dedent`
          type Type = {
            b: string
            // Comment
            a: string
          }
        `,
      })
    })

    it('allows to use multiple partition line comments', async () => {
      await valid({
        code: dedent`
          type Type = {
            c: string
            // b
            b: string
            // a
            a: string
          }
        `,
        options: [
          {
            ...options,
            partitionByComment: {
              line: ['a', 'b'],
            },
          },
        ],
      })
    })

    it('allows to use regex for partition line comments', async () => {
      await valid({
        code: dedent`
          type Type = {
            b: string
            // I am a partition comment because I don't have f o o
            a: string
          }
        `,
        options: [
          {
            ...options,
            partitionByComment: {
              line: ['^(?!.*foo).*$'],
            },
          },
        ],
      })
    })

    it('ignores line comments', async () => {
      await invalid({
        options: [
          {
            ...options,
            partitionByComment: {
              block: true,
            },
          },
        ],
        errors: [
          {
            messageId: 'unexpectedObjectTypesOrder',
            data: { right: 'a', left: 'b' },
          },
        ],
        output: dedent`
          type Type = {
            // Comment
            a: string
            b: string
          }
        `,
        code: dedent`
          type Type = {
            b: string
            // Comment
            a: string
          }
        `,
      })
    })

    it('allows to use all block comments as parts', async () => {
      await valid({
        options: [
          {
            ...options,
            partitionByComment: {
              block: true,
            },
          },
        ],
        code: dedent`
          type Type = {
            b: string
            /* Comment */
            a: string
          }
        `,
      })
    })

    it('allows to use multiple partition block comments', async () => {
      await valid({
        code: dedent`
          type Type = {
            c: string
            /* b */
            b: string
            /* a */
            a: string
          }
        `,
        options: [
          {
            ...options,
            partitionByComment: {
              block: ['a', 'b'],
            },
          },
        ],
      })
    })

    it('allows to use regex for partition block comments', async () => {
      await valid({
        code: dedent`
          type Type = {
            b: string
            /* I am a partition comment because I don't have f o o */
            a: string
          }
        `,
        options: [
          {
            ...options,
            partitionByComment: {
              block: ['^(?!.*foo).*$'],
            },
          },
        ],
      })
    })

    it('allows to trim special characters', async () => {
      await valid({
        code: dedent`
          type Type = {
            _a: string
            b: string
            _c: string
          }
        `,
        options: [
          {
            ...options,
            specialCharacters: 'trim',
          },
        ],
      })
    })

    it('allows to remove special characters', async () => {
      await valid({
        options: [
          {
            ...options,
            specialCharacters: 'remove',
          },
        ],
        code: dedent`
          type Type = {
            ab: string
            a_c: string
          }
        `,
      })
    })

    it('allows to use locale', async () => {
      await valid({
        code: dedent`
          type Type = {
            你好: string
            世界: string
            a: string
            A: string
            b: string
            B: string
          }
        `,
        options: [{ ...options, locales: 'zh-CN' }],
      })
    })

    it('allows to use method group', async () => {
      await valid({
        code: dedent`
          type Type = {
            b(): void
            c: (((v: false) => 'false') | ((v: true) => 'true')) & ((v: any) => any)
            a: string
            d: string
          }
        `,
        options: [
          {
            ...options,
            groups: ['method', 'unknown'],
          },
        ],
      })
    })

    it('removes newlines when newlinesBetween is 0', async () => {
      await invalid({
        errors: [
          {
            messageId: 'extraSpacingBetweenObjectTypeMembers',
            data: { right: 'y', left: 'a' },
          },
          {
            messageId: 'unexpectedObjectTypesOrder',
            data: { right: 'b', left: 'z' },
          },
          {
            messageId: 'extraSpacingBetweenObjectTypeMembers',
            data: { right: 'b', left: 'z' },
          },
        ],
        code: dedent`
          type Type = {
            a: () => null,


           y: "y",
          z: "z",

              b: "b",
          }
        `,
        output: dedent`
          type Type = {
            a: () => null,
           b: "b",
          y: "y",
              z: "z",
          }
        `,
        options: [
          {
            ...options,
            groups: ['method', 'unknown'],
            newlinesBetween: 0,
          },
        ],
      })
    })

    it('handles newlinesBetween between consecutive groups', async () => {
      await invalid({
        options: [
          {
            ...options,
            customGroups: [
              { elementNamePattern: 'a', groupName: 'a' },
              { elementNamePattern: 'b', groupName: 'b' },
              { elementNamePattern: 'c', groupName: 'c' },
              { elementNamePattern: 'd', groupName: 'd' },
              { elementNamePattern: 'e', groupName: 'e' },
            ],
            groups: [
              'a',
              { newlinesBetween: 1 },
              'b',
              { newlinesBetween: 1 },
              'c',
              { newlinesBetween: 0 },
              'd',
              { newlinesBetween: 'ignore' },
              'e',
            ],
            newlinesBetween: 1,
          },
        ],
        errors: [
          {
            messageId: 'missedSpacingBetweenObjectTypeMembers',
            data: { right: 'b', left: 'a' },
          },
          {
            messageId: 'extraSpacingBetweenObjectTypeMembers',
            data: { right: 'c', left: 'b' },
          },
          {
            messageId: 'extraSpacingBetweenObjectTypeMembers',
            data: { right: 'd', left: 'c' },
          },
        ],
        output: dedent`
          type Type = {
            a: string

            b: string

            c: string
            d: string


            e: string
          }
        `,
        code: dedent`
          type Type = {
            a: string
            b: string


            c: string

            d: string


            e: string
          }
        `,
      })
    })

    it.each([
      ['2 and 0', 2, 0],
      ['2 and ignore', 2, 'ignore'],
      ['0 and 2', 0, 2],
      ['ignore and 2', 'ignore', 2],
    ])(
      'enforces newlines when global option is %s',
      async (_description, globalNewlinesBetween, groupNewlinesBetween) => {
        await invalid({
          options: [
            {
              ...options,
              customGroups: [
                { elementNamePattern: 'a', groupName: 'a' },
                { elementNamePattern: 'b', groupName: 'b' },
                { groupName: 'unusedGroup', elementNamePattern: 'X' },
              ],
              groups: [
                'a',
                'unusedGroup',
                { newlinesBetween: groupNewlinesBetween },
                'b',
              ],
              newlinesBetween: globalNewlinesBetween,
            },
          ],
          errors: [
            {
              messageId: 'missedSpacingBetweenObjectTypeMembers',
              data: { right: 'b', left: 'a' },
            },
          ],
          output: dedent`
            type Type = {
              a: string


              b: string
            }
          `,
          code: dedent`
            type Type = {
              a: string
              b: string
            }
          `,
        })
      },
    )

    it.each([
      ['1', 1],
      ['2', 2],
      ['ignore', 'ignore'],
      ['0', 0],
    ])(
      'enforces no newline when global option is %s and newlinesBetween: 0 exists between all groups',
      async (_description, globalNewlinesBetween) => {
        await invalid({
          options: [
            {
              ...options,
              customGroups: [
                { elementNamePattern: 'a', groupName: 'a' },
                { elementNamePattern: 'b', groupName: 'b' },
                { elementNamePattern: 'c', groupName: 'c' },
                { groupName: 'unusedGroup', elementNamePattern: 'X' },
              ],
              groups: [
                'a',
                { newlinesBetween: 0 },
                'unusedGroup',
                { newlinesBetween: 0 },
                'b',
                { newlinesBetween: 1 },
                'c',
              ],
              newlinesBetween: globalNewlinesBetween,
            },
          ],
          errors: [
            {
              messageId: 'extraSpacingBetweenObjectTypeMembers',
              data: { right: 'b', left: 'a' },
            },
          ],
          output: dedent`
            type T = {
              a: string
              b: string
            }
          `,
          code: dedent`
            type T = {
              a: string

              b: string
            }
          `,
        })
      },
    )

    it.each([
      ['ignore and 0', 'ignore', 0],
      ['0 and ignore', 0, 'ignore'],
    ])(
      'does not enforce a newline when global option is %s',
      async (_description, globalNewlinesBetween, groupNewlinesBetween) => {
        await valid({
          options: [
            {
              ...options,
              customGroups: [
                { elementNamePattern: 'a', groupName: 'a' },
                { elementNamePattern: 'b', groupName: 'b' },
                { groupName: 'unusedGroup', elementNamePattern: 'X' },
              ],
              groups: [
                'a',
                'unusedGroup',
                { newlinesBetween: groupNewlinesBetween },
                'b',
              ],
              newlinesBetween: globalNewlinesBetween,
            },
          ],
          code: dedent`
            type Type = {
              a: string

              b: string
            }
          `,
        })

        await valid({
          options: [
            {
              ...options,
              customGroups: [
                { elementNamePattern: 'a', groupName: 'a' },
                { elementNamePattern: 'b', groupName: 'b' },
                { groupName: 'unusedGroup', elementNamePattern: 'X' },
              ],
              groups: [
                'a',
                'unusedGroup',
                { newlinesBetween: groupNewlinesBetween },
                'b',
              ],
              newlinesBetween: globalNewlinesBetween,
            },
          ],
          code: dedent`
            type Type = {
              a: string
              b: string
            }
          `,
        })
      },
    )

    it('handles newlines and comment after fixes', async () => {
      await invalid({
        errors: [
          {
            data: {
              rightGroup: 'property',
              leftGroup: 'method',
              right: 'a',
              left: 'b',
            },
            messageId: 'unexpectedObjectTypesGroupOrder',
          },
        ],
        output: dedent`
          type Test = {
            a: string // Comment after

            b: () => void
            c: () => void
          };
        `,
        code: dedent`
          type Test = {
            b: () => void
            a: string // Comment after

            c: () => void
          };
        `,
        options: [
          {
            groups: ['property', 'method'],
            newlinesBetween: 1,
          },
        ],
      })
    })

    it('ignores newline fixes between different partitions with newlinesBetween: 0', async () => {
      await invalid({
        options: [
          {
            ...options,
            customGroups: [
              {
                elementNamePattern: 'a',
                groupName: 'a',
              },
            ],
            groups: ['a', 'unknown'],
            partitionByComment: true,
            newlinesBetween: 0,
          },
        ],
        output: dedent`
          type Type = {
            a: string

            // Partition comment

            b: string
            c: string
          }
        `,
        code: dedent`
          type Type = {
            a: string

            // Partition comment

            c: string
            b: string
          }
        `,
        errors: [
          {
            messageId: 'unexpectedObjectTypesOrder',
            data: { right: 'b', left: 'c' },
          },
        ],
      })
    })

    it('sorts inline elements correctly', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedObjectTypesOrder',
            data: { right: 'a', left: 'b' },
          },
        ],
        output: dedent`
          type Type = {
            a: string; b: string,
          }
        `,
        code: dedent`
          type Type = {
            b: string, a: string
          }
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            messageId: 'unexpectedObjectTypesOrder',
            data: { right: 'a', left: 'b' },
          },
        ],
        output: dedent`
          type Type = {
            a: string; b: string,
          }
        `,
        code: dedent`
          type Type = {
            b: string, a: string;
          }
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            messageId: 'unexpectedObjectTypesOrder',
            data: { right: 'a', left: 'b' },
          },
        ],
        output: dedent`
          type Type = {
            a: string, b: string,
          }
        `,
        code: dedent`
          type Type = {
            b: string, a: string,
          }
        `,
        options: [options],
      })
    })

    it('does not sort call signature declarations', async () => {
      await valid({
        code: dedent`
          type Type = {
            <Parameters extends Record<string, number | string>>(
              input: AFunction<[Parameters], string>
            ): Alternatives<Parameters>
            <A extends CountA>(input: Input): AFunction<
              [number],
              A[keyof A]
            >
          }
        `,
        options: [options],
      })
    })

    it('does not sort constructor declarations', async () => {
      await valid({
        code: dedent`
          type Type = {
            new (value: number | string): number;
            new (value: number): unknown;
          }
        `,
        options: [options],
      })

      await valid({
        code: dedent`
          type Type = {
            new (value: number): unknown;
            new (value: number | string): number;
          }
        `,
        options: [options],
      })
    })

    it.each([
      ['string pattern', '^r|g|b$'],
      ['array with string pattern', ['noMatch', '^r|g|b$']],
      ['regex pattern', { pattern: '^R|G|B$', flags: 'i' }],
      [
        'array with regex pattern',
        ['noMatch', { pattern: '^R|G|B$', flags: 'i' }],
      ],
    ])(
      'allows to use allNamesMatchPattern with %s',
      async (_description, rgbAllNamesMatchPattern) => {
        await invalid({
          options: [
            {
              ...options,
              useConfigurationIf: {
                allNamesMatchPattern: 'foo',
              },
            },
            {
              ...options,
              customGroups: [
                {
                  elementNamePattern: 'r',
                  groupName: 'r',
                },
                {
                  elementNamePattern: 'g',
                  groupName: 'g',
                },
                {
                  elementNamePattern: 'b',
                  groupName: 'b',
                },
              ],
              useConfigurationIf: {
                allNamesMatchPattern: rgbAllNamesMatchPattern,
              },
              groups: ['r', 'g', 'b'],
            },
          ],
          errors: [
            {
              data: {
                rightGroup: 'g',
                leftGroup: 'b',
                right: 'g',
                left: 'b',
              },
              messageId: 'unexpectedObjectTypesGroupOrder',
            },
            {
              data: {
                rightGroup: 'r',
                leftGroup: 'g',
                right: 'r',
                left: 'g',
              },
              messageId: 'unexpectedObjectTypesGroupOrder',
            },
          ],
          output: dedent`
            type Type = {
              r: string
              g: string
              b: string
            }
          `,
          code: dedent`
            type Type = {
              b: string
              g: string
              r: string
            }
          `,
        })
      },
    )

    it('detects declaration name by pattern', async () => {
      await valid({
        options: [
          {
            useConfigurationIf: {
              declarationMatchesPattern: '^Type$',
            },
            type: 'unsorted',
          },
          options,
        ],
        code: dedent`
          type Type = {
            b: string
            c: string
            a: string
          }
        `,
      })

      await invalid({
        options: [
          {
            useConfigurationIf: {
              declarationMatchesPattern: '^Type$',
            },
            type: 'unsorted',
          },
          options,
        ],
        errors: [
          {
            messageId: 'unexpectedObjectTypesOrder',
            data: { right: 'a', left: 'b' },
          },
        ],
        output: dedent`
          type OtherType = {
            a: string
            b: string
          }
        `,
        code: dedent`
          type OtherType = {
            b: string
            a: string
          }
        `,
      })
    })

    it('does not match configuration if no declaration name', async () => {
      await invalid({
        options: [
          {
            useConfigurationIf: {
              declarationMatchesPattern: '^Type$',
            },
            type: 'unsorted',
          },
          options,
        ],
        errors: [
          {
            messageId: 'unexpectedObjectTypesOrder',
            data: { right: 'b', left: 'c' },
          },
        ],
        output: dedent`
          type Type = {
            a: {
              b: string
              c: string
            }
          }
        `,
        code: dedent`
          type Type = {
            a: {
              c: string
              b: string
            }
          }
        `,
      })
    })

    it('applies configuration when object only has numeric keys', async () => {
      await valid({
        options: [
          {
            useConfigurationIf: {
              hasNumericKeysOnly: true,
            },
            type: 'unsorted',
          },
        ],
        code: dedent`
          type Type = {
            5: number
            2: SomeObject
            3: number
            8: number
          }
        `,
      })

      await invalid({
        options: [
          {
            useConfigurationIf: {
              hasNumericKeysOnly: true,
            },
            type: 'unsorted',
          },
          options,
        ],
        errors: [
          {
            messageId: 'unexpectedObjectTypesOrder',
            data: { right: '1', left: '2' },
          },
        ],
        output: dedent`
          type Type = {
            '1': number
            2: number
          }
        `,
        code: dedent`
          type Type = {
            2: number
            '1': number
          }
        `,
      })
    })

    it('detects declaration comment by pattern', async () => {
      await valid({
        options: [
          {
            useConfigurationIf: {
              declarationCommentMatchesPattern: '^Ignore me$',
            },
            type: 'unsorted',
          },
          options,
        ],
        code: dedent`
          // Ignore me
          type Type = {
            b: string
            c: string
            a: string
          }
        `,
      })

      await invalid({
        options: [
          {
            useConfigurationIf: {
              declarationCommentMatchesPattern: '^Ignore me$',
            },
            type: 'unsorted',
          },
          options,
        ],
        errors: [
          {
            messageId: 'unexpectedObjectTypesOrder',
            data: { right: 'a', left: 'b' },
          },
        ],
        output: dedent`
          // Do NOT ignore me
          type Type = {
            a: string
            b: string
          }
        `,
        code: dedent`
          // Do NOT ignore me
          type Type = {
            b: string
            a: string
          }
        `,
      })
    })

    it('allows sorting by value', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedObjectTypesOrder',
            data: { right: 'b', left: 'a' },
          },
        ],
        output: dedent`
          type Type = {
            b: 'a'
            a: 'b'
          }
        `,
        options: [
          {
            sortBy: 'value',
            ...options,
          },
        ],
        code: dedent`
          type Type = {
            a: 'b'
            b: 'a'
          }
        `,
      })
    })

    it('does not enforce sorting of non-properties in the same group', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedObjectTypesOrder',
            data: { right: 'a', left: 'z' },
          },
          {
            messageId: 'unexpectedObjectTypesOrder',
            data: { right: 'y', left: 'a' },
          },
        ],
        output: dedent`
          type Type = {
            y: 'y'
            a(): void
            z: 'z'
          }
        `,
        code: dedent`
          type Type = {
            z: 'z'
            a(): void
            y: 'y'
          }
        `,
        options: [
          {
            sortBy: 'value',
            ...options,
          },
        ],
      })

      await invalid({
        errors: [
          {
            data: { right: '[key: string]', left: 'z' },
            messageId: 'unexpectedObjectTypesOrder',
          },
          {
            data: {
              left: '[key: string]',
              right: 'y',
            },
            messageId: 'unexpectedObjectTypesOrder',
          },
        ],
        output: dedent`
          type Type = {
            y: 'y'
            [key: string]
            z: 'z'
          }
        `,
        code: dedent`
          type Type = {
            z: 'z'
            [key: string]
            y: 'y'
          }
        `,
        options: [
          {
            sortBy: 'value',
            ...options,
          },
        ],
      })
    })

    it('enforces grouping but does not enforce sorting of non-properties', async () => {
      await invalid({
        errors: [
          {
            data: {
              leftGroup: 'unknown',
              rightGroup: 'method',
              right: 'a',
              left: 'z',
            },
            messageId: 'unexpectedObjectTypesGroupOrder',
          },
        ],
        options: [
          {
            sortBy: 'value',
            ...options,
            groups: ['method', 'unknown'],
          },
        ],
        output: dedent`
          type Type = {
            b(): void
            a(): void
            z: 'z'
          }
        `,
        code: dedent`
          type Type = {
            b(): void
            z: 'z'
            a(): void
          }
        `,
      })
    })
  })

  describe('natural', () => {
    let options = {
      type: 'natural',
      order: 'asc',
    } as const

    it('sorts type members', async () => {
      await valid({
        code: dedent`
          type Type = {
            a: 'aaa'
            b: 'bb'
            c: 'c'
          }
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            messageId: 'unexpectedObjectTypesOrder',
            data: { right: 'b', left: 'c' },
          },
        ],
        output: dedent`
          type Type = {
            a: 'aaa'
            b: 'bb'
            c: 'c'
          }
        `,
        code: dedent`
          type Type = {
            a: 'aaa'
            c: 'c'
            b: 'bb'
          }
        `,
        options: [options],
      })
    })

    it('sorts type members in function args', async () => {
      await valid({
        code: dedent`
          let Func = (arguments: {
            a: 'aaa'
            b: 'bb'
            c: 'c'
          }) => {
            // ...
          }
        `,
        options: [options],
      })

      await invalid({
        output: dedent`
          let Func = (arguments: {
            a: 'aaa'
            b: 'bb'
            c: 'c'
          }) => {
            // ...
          }
        `,
        code: dedent`
          let Func = (arguments: {
            b: 'bb'
            a: 'aaa'
            c: 'c'
          }) => {
            // ...
          }
        `,
        errors: [
          {
            messageId: 'unexpectedObjectTypesOrder',
            data: { right: 'a', left: 'b' },
          },
        ],
        options: [options],
      })
    })

    it('sorts type members with computed keys', async () => {
      await valid({
        code: dedent`
          type Type = {
            [key: string]: string
            a?: 'aaa'
            b: 'bb'
            c: 'c'
            [value]: string
          }
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            data: { right: '[key: string]', left: 'a' },
            messageId: 'unexpectedObjectTypesOrder',
          },
          {
            data: {
              left: 'value',
              right: 'c',
            },
            messageId: 'unexpectedObjectTypesOrder',
          },
        ],
        output: dedent`
          type Type = {
            [key: string]: string
            a?: 'aaa'
            b: 'bb'
            c: 'c'
            [value]: string
          }
        `,
        code: dedent`
          type Type = {
            a?: 'aaa'
            [key: string]: string
            b: 'bb'
            [value]: string
            c: 'c'
          }
        `,
        options: [options],
      })
    })

    it('sorts type members with any key types', async () => {
      await valid({
        code: dedent`
          type Type = {
            [8]: Value
            [...values]
            [[data]]: string
            [name in v]?
            arrowFunc?: () => void
            func(): void
          }
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            data: {
              left: '[name in v]',
              right: '8',
            },
            messageId: 'unexpectedObjectTypesOrder',
          },
          {
            data: { right: 'arrowFunc', left: 'func' },
            messageId: 'unexpectedObjectTypesOrder',
          },
        ],
        output: dedent`
          type Type = {
            [8]: Value
            [...values]
            [[data]]: string
            [name in v]?
            arrowFunc?: () => void
            func(): void
          }
        `,
        code: dedent`
          type Type = {
            [...values]
            [[data]]: string
            [name in v]?
            [8]: Value
            func(): void
            arrowFunc?: () => void
          }
        `,
        options: [options],
      })
    })

    it('sorts inline type members', async () => {
      await valid({
        code: dedent`
          func<{ a: 'aa'; b: 'b' }>(/* ... */)
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            messageId: 'unexpectedObjectTypesOrder',
            data: { right: 'a', left: 'b' },
          },
        ],
        output: dedent`
          func<{ a: 'aa'; b: 'b'; }>(/* ... */)
        `,
        code: dedent`
          func<{ b: 'b'; a: 'aa' }>(/* ... */)
        `,
        options: [options],
      })
    })

    it('sorts complex predefined groups', async () => {
      await invalid({
        errors: [
          {
            data: {
              leftGroup: 'required-property',
              rightGroup: 'index-signature',
              right: '[key: string]',
              left: 'a',
            },
            messageId: 'unexpectedObjectTypesGroupOrder',
          },
          {
            data: {
              rightGroup: 'optional-multiline-member',
              leftGroup: 'index-signature',
              left: '[key: string]',
              right: 'b',
            },
            messageId: 'unexpectedObjectTypesGroupOrder',
          },
          {
            data: {
              leftGroup: 'optional-multiline-member',
              rightGroup: 'required-method',
              right: 'c',
              left: 'b',
            },
            messageId: 'unexpectedObjectTypesGroupOrder',
          },
        ],
        options: [
          {
            ...options,
            groups: [
              'unknown',
              'required-method',
              'optional-multiline-member',
              'index-signature',
              'required-property',
            ],
          },
        ],
        output: dedent`
          type Type = {
            c(): void
            b?: {
              property: string;
            }
            [key: string]: string;
            a: string
          }
        `,
        code: dedent`
          type Type = {
            a: string
            [key: string]: string;
            b?: {
              property: string;
            }
            c(): void
          }
        `,
      })
    })

    it('prioritizes selectors over modifiers quantity', async () => {
      await invalid({
        errors: [
          {
            data: {
              leftGroup: 'required-property',
              rightGroup: 'method',
              left: 'property',
              right: 'method',
            },
            messageId: 'unexpectedObjectTypesGroupOrder',
          },
        ],
        options: [
          {
            ...options,
            groups: ['method', 'required-property'],
          },
        ],
        output: dedent`
          type Type = {
            method(): void
            property: string
          }
        `,
        code: dedent`
          type Type = {
            property: string
            method(): void
          }
        `,
      })
    })

    it('prioritizes index-signature over member', async () => {
      await invalid({
        errors: [
          {
            data: {
              rightGroup: 'index-signature',
              right: '[key: string]',
              leftGroup: 'member',
              left: 'member',
            },
            messageId: 'unexpectedObjectTypesGroupOrder',
          },
        ],
        output: dedent`
          type Type = {
            [key: string]: string;
            member: "something";
          }
        `,
        code: dedent`
          type Type = {
            member: "something";
            [key: string]: string;
          }
        `,
        options: [
          {
            ...options,
            groups: ['index-signature', 'member'],
          },
        ],
      })
    })

    it('prioritizes method over member', async () => {
      await invalid({
        errors: [
          {
            data: {
              rightGroup: 'method',
              leftGroup: 'member',
              right: 'method',
              left: 'member',
            },
            messageId: 'unexpectedObjectTypesGroupOrder',
          },
        ],
        output: dedent`
          type Type = {
            method(): string
            member: "something"
          }
        `,
        code: dedent`
          type Type = {
            member: "something"
            method(): string
          }
        `,
        options: [
          {
            ...options,
            groups: ['method', 'member'],
          },
        ],
      })
    })

    it('prioritizes property over member', async () => {
      await invalid({
        errors: [
          {
            data: {
              rightGroup: 'property',
              leftGroup: 'member',
              right: 'property',
              left: 'method',
            },
            messageId: 'unexpectedObjectTypesGroupOrder',
          },
        ],
        output: dedent`
          type Type = {
            property: string
            method(): string
          }
        `,
        code: dedent`
          type Type = {
            method(): string
            property: string
          }
        `,
        options: [
          {
            ...options,
            groups: ['property', 'member'],
          },
        ],
      })
    })

    it('prioritizes multiline over optional', async () => {
      await invalid({
        errors: [
          {
            data: {
              rightGroup: 'multiline-property',
              leftGroup: 'optional-property',
              right: 'multilineProperty',
              left: 'optionalProperty',
            },
            messageId: 'unexpectedObjectTypesGroupOrder',
          },
        ],
        output: dedent`
          type Type = {
            multilineProperty: {
              a: string
            }
            optionalProperty?: string
          }
        `,
        code: dedent`
          type Type = {
            optionalProperty?: string
            multilineProperty: {
              a: string
            }
          }
        `,
        options: [
          {
            ...options,
            groups: ['multiline-property', 'optional-property'],
          },
        ],
      })
    })

    it('prioritizes multiline over required', async () => {
      await invalid({
        errors: [
          {
            data: {
              rightGroup: 'multiline-property',
              leftGroup: 'required-property',
              right: 'multilineProperty',
              left: 'requiredProperty',
            },
            messageId: 'unexpectedObjectTypesGroupOrder',
          },
        ],
        output: dedent`
          type Type = {
            multilineProperty: {
              a: string
            }
            requiredProperty: string
          }
        `,
        code: dedent`
          type Type = {
            requiredProperty: string
            multilineProperty: {
              a: string
            }
          }
        `,
        options: [
          {
            ...options,
            groups: ['multiline-property', 'required-property'],
          },
        ],
      })
    })

    it('filters on selector and modifiers', async () => {
      await invalid({
        options: [
          {
            customGroups: [
              {
                groupName: 'unusedCustomGroup',
                modifiers: ['optional'],
                selector: 'method',
              },
              {
                groupName: 'optionalPropertyGroup',
                modifiers: ['optional'],
                selector: 'property',
              },
              {
                groupName: 'propertyGroup',
                selector: 'property',
              },
            ],
            groups: ['propertyGroup', 'optionalPropertyGroup'],
          },
        ],
        errors: [
          {
            data: {
              leftGroup: 'optionalPropertyGroup',
              rightGroup: 'propertyGroup',
              right: 'c',
              left: 'b',
            },
            messageId: 'unexpectedObjectTypesGroupOrder',
          },
        ],
        output: dedent`
          type Type = {
            c: string
            a?: string
            b?: string
          }
        `,
        code: dedent`
          type Type = {
            a?: string
            b?: string
            c: string
          }
        `,
      })
    })

    it.each([
      ['string pattern', 'hello'],
      ['array with string pattern', ['noMatch', 'hello']],
      ['regex pattern', { pattern: 'HELLO', flags: 'i' }],
      [
        'array with regex pattern',
        ['noMatch', { pattern: 'HELLO', flags: 'i' }],
      ],
    ])(
      'filters on elementNamePattern with %s',
      async (_description, elementNamePattern) => {
        await invalid({
          options: [
            {
              customGroups: [
                {
                  groupName: 'propertiesStartingWithHello',
                  selector: 'property',
                  elementNamePattern,
                },
              ],
              groups: ['propertiesStartingWithHello', 'unknown'],
            },
          ],
          errors: [
            {
              data: {
                rightGroup: 'propertiesStartingWithHello',
                right: 'helloProperty',
                leftGroup: 'unknown',
                left: 'method',
              },
              messageId: 'unexpectedObjectTypesGroupOrder',
            },
          ],
          output: dedent`
            type Type = {
              helloProperty: string
              a: string
              b: string
              method(): void
            }
          `,
          code: dedent`
            type Type = {
              a: string
              b: string
              method(): void
              helloProperty: string
            }
          `,
        })
      },
    )

    it.each([
      ['string pattern', 'Date'],
      ['array with string pattern', ['noMatch', 'Date']],
      ['regex pattern', { pattern: 'DATE', flags: 'i' }],
      [
        'array with regex pattern',
        ['noMatch', { pattern: 'DATE', flags: 'i' }],
      ],
    ])(
      'filters on elementValuePattern with %s',
      async (_description, dateElementValuePattern) => {
        await invalid({
          options: [
            {
              customGroups: [
                {
                  elementValuePattern: dateElementValuePattern,
                  groupName: 'date',
                },
                {
                  elementValuePattern: 'number',
                  groupName: 'number',
                },
              ],
              groups: ['number', 'date', 'unknown'],
            },
          ],
          errors: [
            {
              data: {
                rightGroup: 'number',
                leftGroup: 'date',
                right: 'z',
                left: 'y',
              },
              messageId: 'unexpectedObjectTypesGroupOrder',
            },
          ],
          output: dedent`
            type Type = {
              a: number
              z: number
              b: Date
              y: Date
              c(): string
            }
          `,
          code: dedent`
            type Type = {
              a: number
              b: Date
              y: Date
              z: number
              c(): string
            }
          `,
        })
      },
    )

    it('sorts custom groups by overriding type and order', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedObjectTypesOrder',
            data: { right: 'bb', left: 'a' },
          },
          {
            messageId: 'unexpectedObjectTypesOrder',
            data: { right: 'ccc', left: 'bb' },
          },
          {
            messageId: 'unexpectedObjectTypesOrder',
            data: { right: 'dddd', left: 'ccc' },
          },
          {
            data: {
              rightGroup: 'reversedPropertiesByLineLength',
              leftGroup: 'unknown',
              left: 'method',
              right: 'eee',
            },
            messageId: 'unexpectedObjectTypesGroupOrder',
          },
        ],
        options: [
          {
            customGroups: [
              {
                groupName: 'reversedPropertiesByLineLength',
                selector: 'property',
                type: 'line-length',
                order: 'desc',
              },
            ],
            groups: ['reversedPropertiesByLineLength', 'unknown'],
            type: 'alphabetical',
            order: 'asc',
          },
        ],
        output: dedent`
          type Type = {
            dddd: string
            ccc: string
            eee: string
            bb: string
            ff: string
            a: string
            g: string
            anotherMethod(): void
            method(): void
            yetAnotherMethod(): void
          }
        `,
        code: dedent`
          type Type = {
            a: string
            bb: string
            ccc: string
            dddd: string
            method(): void
            eee: string
            ff: string
            g: string
            anotherMethod(): void
            yetAnotherMethod(): void
          }
        `,
      })
    })

    it('sorts custom groups by overriding fallbackSort', async () => {
      await invalid({
        options: [
          {
            customGroups: [
              {
                fallbackSort: {
                  type: 'alphabetical',
                  order: 'asc',
                },
                elementNamePattern: '^foo',
                type: 'line-length',
                groupName: 'foo',
                order: 'desc',
              },
            ],
            type: 'alphabetical',
            groups: ['foo'],
            order: 'asc',
          },
        ],
        errors: [
          {
            data: { right: 'fooBar', left: 'fooZar' },
            messageId: 'unexpectedObjectTypesOrder',
          },
        ],
        output: dedent`
          type Type = {
            fooBar: string
            fooZar: string
          }
        `,
        code: dedent`
          type Type = {
            fooZar: string
            fooBar: string
          }
        `,
      })

      await invalid({
        options: [
          {
            customGroups: [
              {
                fallbackSort: {
                  type: 'alphabetical',
                  sortBy: 'value',
                },
                elementValuePattern: '^foo',
                type: 'line-length',
                groupName: 'foo',
              },
            ],
            type: 'alphabetical',
            groups: ['foo'],
            order: 'asc',
          },
        ],
        errors: [
          {
            messageId: 'unexpectedObjectTypesOrder',
            data: { right: 'b', left: 'a' },
          },
        ],
        output: dedent`
          type Type = {
            b: fooBar
            a: fooZar
          }
        `,
        code: dedent`
          type Type = {
            a: fooZar
            b: fooBar
          }
        `,
      })
    })

    it('sorts custom groups by overriding sortBy', async () => {
      await invalid({
        errors: [
          {
            data: {
              rightGroup: 'fooElementsSortedByValue',
              leftGroup: 'unknown',
              right: 'fooC',
              left: 'z',
            },
            messageId: 'unexpectedObjectTypesGroupOrder',
          },
          {
            messageId: 'unexpectedObjectTypesOrder',
            data: { right: 'fooA', left: 'fooB' },
          },
          {
            data: {
              rightGroup: 'fooElementsSortedByValue',
              leftGroup: 'unknown',
              right: 'fooMethod',
              left: 'a',
            },
            messageId: 'unexpectedObjectTypesGroupOrder',
          },
        ],
        options: [
          {
            customGroups: [
              {
                groupName: 'fooElementsSortedByValue',
                elementNamePattern: '^foo',
                sortBy: 'value',
              },
            ],
            groups: ['fooElementsSortedByValue', 'unknown'],
            type: 'alphabetical',
            order: 'asc',
          },
        ],
        output: dedent`
          type Type = {
            fooA: Date
            fooC: number
            fooB: string
            fooMethod(): void
            a: string
            z: boolean
          }
        `,
        code: dedent`
          type Type = {
            z: boolean
            fooC: number
            fooB: string
            fooA: Date
            a: string
            fooMethod(): void
          }
        `,
      })
    })

    it('does not sort custom groups with unsorted type', async () => {
      await invalid({
        options: [
          {
            customGroups: [
              {
                groupName: 'unsortedProperties',
                selector: 'property',
                type: 'unsorted',
              },
            ],
            groups: ['unsortedProperties', 'unknown'],
          },
        ],
        errors: [
          {
            data: {
              rightGroup: 'unsortedProperties',
              leftGroup: 'unknown',
              left: 'method',
              right: 'c',
            },
            messageId: 'unexpectedObjectTypesGroupOrder',
          },
        ],
        output: dedent`
          type Type = {
            b
            a
            d
            e
            c
            method(): void
          }
        `,
        code: dedent`
          type Type = {
            b
            a
            d
            e
            method(): void
            c
          }
        `,
      })
    })

    it('sorts custom group blocks', async () => {
      await invalid({
        options: [
          {
            customGroups: [
              {
                anyOf: [
                  {
                    modifiers: ['required'],
                    selector: 'property',
                  },
                  {
                    modifiers: ['optional'],
                    selector: 'method',
                  },
                ],
                groupName: 'requiredPropertiesAndOptionalMethods',
              },
            ],
            groups: [
              ['requiredPropertiesAndOptionalMethods', 'index-signature'],
              'unknown',
            ],
          },
        ],
        errors: [
          {
            data: {
              rightGroup: 'requiredPropertiesAndOptionalMethods',
              leftGroup: 'unknown',
              right: 'd',
              left: 'c',
            },
            messageId: 'unexpectedObjectTypesGroupOrder',
          },
          {
            data: { right: '[key: string]', left: 'e' },
            messageId: 'unexpectedObjectTypesOrder',
          },
        ],
        output: dedent`
          type Type = {
            [key: string]: string
            a: string
            d?: () => void
            e: string
            b(): void
            c?: string
          }
        `,
        code: dedent`
          type Type = {
            a: string
            b(): void
            c?: string
            d?: () => void
            e: string
            [key: string]: string
          }
        `,
      })
    })

    it('allows to use regex for element names in custom groups', async () => {
      await valid({
        options: [
          {
            customGroups: [
              {
                elementNamePattern: '^(?!.*Foo).*$',
                groupName: 'elementsWithoutFoo',
              },
            ],
            groups: ['unknown', 'elementsWithoutFoo'],
            type: 'alphabetical',
          },
        ],
        code: dedent`
          type Type = {
            iHaveFooInMyName: string
            meTooIHaveFoo: string
            a: string
            b: string
          }
        `,
      })
    })

    it('allows to use newlinesInside: 1', async () => {
      await invalid({
        options: [
          {
            customGroups: [
              {
                selector: 'property',
                groupName: 'group1',
                newlinesInside: 1,
              },
            ],
            groups: ['group1'],
          },
        ],
        errors: [
          {
            messageId: 'missedSpacingBetweenObjectTypeMembers',
            data: { right: 'b', left: 'a' },
          },
        ],
        output: dedent`
          type type = {
            a

            b
          }
        `,
        code: dedent`
          type type = {
            a
            b
          }
        `,
      })
    })

    it('allows to use newlinesInside: 0', async () => {
      await invalid({
        options: [
          {
            customGroups: [
              {
                selector: 'property',
                groupName: 'group1',
                newlinesInside: 0,
              },
            ],
            type: 'alphabetical',
            groups: ['group1'],
          },
        ],
        errors: [
          {
            messageId: 'extraSpacingBetweenObjectTypeMembers',
            data: { right: 'b', left: 'a' },
          },
        ],
        output: dedent`
          type type = {
            a
            b
          }
        `,
        code: dedent`
          type type = {
            a

            b
          }
        `,
      })
    })

    it('allows to use regex for custom groups', async () => {
      await valid({
        options: [
          {
            ...options,
            customGroups: [
              {
                elementNamePattern: '^(?!.*Foo).*$',
                groupName: 'elementsWithoutFoo',
              },
            ],
            groups: ['unknown', 'elementsWithoutFoo'],
          },
        ],
        code: dedent`
          type T = {
            iHaveFooInMyName: string
            meTooIHaveFoo: string
            a: string
            b: string
          }
        `,
      })
    })

    it('allows to use in class methods', async () => {
      await invalid({
        output: dedent`
          class Class {
            async method (data: {
              a: 'aaa'
              b: 'bb'
              c: 'c'
            }) {}
          }
        `,
        code: dedent`
          class Class {
            async method (data: {
              b: 'bb'
              a: 'aaa'
              c: 'c'
            }) {}
          }
        `,
        errors: [
          {
            messageId: 'unexpectedObjectTypesOrder',
            data: { right: 'a', left: 'b' },
          },
        ],
        options: [options],
      })
    })

    it('allows to use new line as partition', async () => {
      await valid({
        code: dedent`
          type Type = {
            d: 'dd'
            e: 'e'

            c: 'ccc'

            a: 'aaaaa'
            b: 'bbbb'
          }
        `,
        options: [
          {
            ...options,
            partitionByNewLine: true,
          },
        ],
      })

      await invalid({
        errors: [
          {
            messageId: 'unexpectedObjectTypesOrder',
            data: { right: 'd', left: 'e' },
          },
          {
            messageId: 'unexpectedObjectTypesOrder',
            data: { right: 'a', left: 'b' },
          },
        ],
        output: dedent`
          type Type = {
            d: 'dd'
            e: 'e'

            c: 'ccc'

            a: 'aaaaa'
            b: 'bbbb'
          }
        `,
        code: dedent`
          type Type = {
            e: 'e'
            d: 'dd'

            c: 'ccc'

            b: 'bbbb'
            a: 'aaaaa'
          }
        `,
        options: [
          {
            ...options,
            partitionByNewLine: true,
          },
        ],
      })
    })

    it('allows to use partition comments', async () => {
      await invalid({
        output: dedent`
          type Type = {
            // Part: A
            // Not partition comment
            bbb: string
            cc: string
            d: string
            // Part: B
            aaaa: string
            e: string
            // Part: C
            // Not partition comment
            fff: string
            'gg': string
          }
        `,
        code: dedent`
          type Type = {
            // Part: A
            cc: string
            d: string
            // Not partition comment
            bbb: string
            // Part: B
            aaaa: string
            e: string
            // Part: C
            'gg': string
            // Not partition comment
            fff: string
          }
        `,
        errors: [
          {
            messageId: 'unexpectedObjectTypesOrder',
            data: { right: 'bbb', left: 'd' },
          },
          {
            messageId: 'unexpectedObjectTypesOrder',
            data: { right: 'fff', left: 'gg' },
          },
        ],
        options: [
          {
            ...options,
            partitionByComment: '^Part',
          },
        ],
      })
    })

    it('allows to use all comments as parts', async () => {
      await valid({
        code: dedent`
          type Type = {
            // Comment
            bb: string
            // Other comment
            a: string
          }
        `,
        options: [
          {
            ...options,
            partitionByComment: true,
          },
        ],
      })
    })

    it('allows to use multiple partition comments', async () => {
      await invalid({
        output: dedent`
          type Type = {
            /* Partition Comment */
            // Part: A
            d: string
            // Part: B
            aaa: string
            bb: string
            c: string
            /* Other */
            e: string
          }
        `,
        code: dedent`
          type Type = {
            /* Partition Comment */
            // Part: A
            d: string
            // Part: B
            aaa: string
            c: string
            bb: string
            /* Other */
            e: string
          }
        `,
        errors: [
          {
            messageId: 'unexpectedObjectTypesOrder',
            data: { right: 'bb', left: 'c' },
          },
        ],
        options: [
          {
            ...options,
            partitionByComment: ['Partition Comment', 'Part:', 'Other'],
          },
        ],
      })
    })

    it('allows to use regex for partition comments', async () => {
      await valid({
        code: dedent`
          type Type = {
            e: string
            f: string
            // I am a partition comment because I don't have f o o
            a: string
            b: string
          }
        `,
        options: [
          {
            ...options,
            partitionByComment: ['^(?!.*foo).*$'],
          },
        ],
      })
    })

    it('ignores block comments', async () => {
      await invalid({
        options: [
          {
            ...options,
            partitionByComment: {
              line: true,
            },
          },
        ],
        errors: [
          {
            messageId: 'unexpectedObjectTypesOrder',
            data: { right: 'a', left: 'b' },
          },
        ],
        output: dedent`
          type Type = {
            /* Comment */
            a: string
            b: string
          }
        `,
        code: dedent`
          type Type = {
            b: string
            /* Comment */
            a: string
          }
        `,
      })
    })

    it('allows to use all line comments as parts', async () => {
      await valid({
        options: [
          {
            ...options,
            partitionByComment: {
              line: true,
            },
          },
        ],
        code: dedent`
          type Type = {
            b: string
            // Comment
            a: string
          }
        `,
      })
    })

    it('allows to use multiple partition line comments', async () => {
      await valid({
        code: dedent`
          type Type = {
            c: string
            // b
            b: string
            // a
            a: string
          }
        `,
        options: [
          {
            ...options,
            partitionByComment: {
              line: ['a', 'b'],
            },
          },
        ],
      })
    })

    it('allows to use regex for partition line comments', async () => {
      await valid({
        code: dedent`
          type Type = {
            b: string
            // I am a partition comment because I don't have f o o
            a: string
          }
        `,
        options: [
          {
            ...options,
            partitionByComment: {
              line: ['^(?!.*foo).*$'],
            },
          },
        ],
      })
    })

    it('ignores line comments', async () => {
      await invalid({
        options: [
          {
            ...options,
            partitionByComment: {
              block: true,
            },
          },
        ],
        errors: [
          {
            messageId: 'unexpectedObjectTypesOrder',
            data: { right: 'a', left: 'b' },
          },
        ],
        output: dedent`
          type Type = {
            // Comment
            a: string
            b: string
          }
        `,
        code: dedent`
          type Type = {
            b: string
            // Comment
            a: string
          }
        `,
      })
    })

    it('allows to use all block comments as parts', async () => {
      await valid({
        options: [
          {
            ...options,
            partitionByComment: {
              block: true,
            },
          },
        ],
        code: dedent`
          type Type = {
            b: string
            /* Comment */
            a: string
          }
        `,
      })
    })

    it('allows to use multiple partition block comments', async () => {
      await valid({
        code: dedent`
          type Type = {
            c: string
            /* b */
            b: string
            /* a */
            a: string
          }
        `,
        options: [
          {
            ...options,
            partitionByComment: {
              block: ['a', 'b'],
            },
          },
        ],
      })
    })

    it('allows to use regex for partition block comments', async () => {
      await valid({
        code: dedent`
          type Type = {
            b: string
            /* I am a partition comment because I don't have f o o */
            a: string
          }
        `,
        options: [
          {
            ...options,
            partitionByComment: {
              block: ['^(?!.*foo).*$'],
            },
          },
        ],
      })
    })

    it('allows to trim special characters', async () => {
      await valid({
        code: dedent`
          type Type = {
            _a: string
            b: string
            _c: string
          }
        `,
        options: [
          {
            ...options,
            specialCharacters: 'trim',
          },
        ],
      })
    })

    it('allows to remove special characters', async () => {
      await valid({
        options: [
          {
            ...options,
            specialCharacters: 'remove',
          },
        ],
        code: dedent`
          type Type = {
            ab: string
            a_c: string
          }
        `,
      })
    })

    it('allows to use locale', async () => {
      await valid({
        code: dedent`
          type Type = {
            你好: string
            世界: string
            a: string
            A: string
            b: string
            B: string
          }
        `,
        options: [{ ...options, locales: 'zh-CN' }],
      })
    })

    it('allows to use method group', async () => {
      await valid({
        code: dedent`
          type Type = {
            b(): void
            c: (((v: false) => 'false') | ((v: true) => 'true')) & ((v: any) => any)
            a: string
            d: string
          }
        `,
        options: [
          {
            ...options,
            groups: ['method', 'unknown'],
          },
        ],
      })
    })

    it('removes newlines when newlinesBetween is 0', async () => {
      await invalid({
        errors: [
          {
            messageId: 'extraSpacingBetweenObjectTypeMembers',
            data: { right: 'y', left: 'a' },
          },
          {
            messageId: 'unexpectedObjectTypesOrder',
            data: { right: 'b', left: 'z' },
          },
          {
            messageId: 'extraSpacingBetweenObjectTypeMembers',
            data: { right: 'b', left: 'z' },
          },
        ],
        code: dedent`
          type Type = {
            a: () => null,


           y: "y",
          z: "z",

              b: "b",
          }
        `,
        output: dedent`
          type Type = {
            a: () => null,
           b: "b",
          y: "y",
              z: "z",
          }
        `,
        options: [
          {
            ...options,
            groups: ['method', 'unknown'],
            newlinesBetween: 0,
          },
        ],
      })
    })

    it('handles newlinesBetween between consecutive groups', async () => {
      await invalid({
        options: [
          {
            ...options,
            customGroups: [
              { elementNamePattern: 'a', groupName: 'a' },
              { elementNamePattern: 'b', groupName: 'b' },
              { elementNamePattern: 'c', groupName: 'c' },
              { elementNamePattern: 'd', groupName: 'd' },
              { elementNamePattern: 'e', groupName: 'e' },
            ],
            groups: [
              'a',
              { newlinesBetween: 1 },
              'b',
              { newlinesBetween: 1 },
              'c',
              { newlinesBetween: 0 },
              'd',
              { newlinesBetween: 'ignore' },
              'e',
            ],
            newlinesBetween: 1,
          },
        ],
        errors: [
          {
            messageId: 'missedSpacingBetweenObjectTypeMembers',
            data: { right: 'b', left: 'a' },
          },
          {
            messageId: 'extraSpacingBetweenObjectTypeMembers',
            data: { right: 'c', left: 'b' },
          },
          {
            messageId: 'extraSpacingBetweenObjectTypeMembers',
            data: { right: 'd', left: 'c' },
          },
        ],
        output: dedent`
          type Type = {
            a: string

            b: string

            c: string
            d: string


            e: string
          }
        `,
        code: dedent`
          type Type = {
            a: string
            b: string


            c: string

            d: string


            e: string
          }
        `,
      })
    })

    it.each([
      ['2 and 0', 2, 0],
      ['2 and ignore', 2, 'ignore'],
      ['0 and 2', 0, 2],
      ['ignore and 2', 'ignore', 2],
    ])(
      'enforces newlines when global option is %s',
      async (_description, globalNewlinesBetween, groupNewlinesBetween) => {
        await invalid({
          options: [
            {
              ...options,
              customGroups: [
                { elementNamePattern: 'a', groupName: 'a' },
                { elementNamePattern: 'b', groupName: 'b' },
                { groupName: 'unusedGroup', elementNamePattern: 'X' },
              ],
              groups: [
                'a',
                'unusedGroup',
                { newlinesBetween: groupNewlinesBetween },
                'b',
              ],
              newlinesBetween: globalNewlinesBetween,
            },
          ],
          errors: [
            {
              messageId: 'missedSpacingBetweenObjectTypeMembers',
              data: { right: 'b', left: 'a' },
            },
          ],
          output: dedent`
            type Type = {
              a: string


              b: string
            }
          `,
          code: dedent`
            type Type = {
              a: string
              b: string
            }
          `,
        })
      },
    )

    it.each([
      ['1', 1],
      ['2', 2],
      ['ignore', 'ignore'],
      ['0', 0],
    ])(
      'enforces no newline when global option is %s and newlinesBetween: 0 exists between all groups',
      async (_description, globalNewlinesBetween) => {
        await invalid({
          options: [
            {
              ...options,
              customGroups: [
                { elementNamePattern: 'a', groupName: 'a' },
                { elementNamePattern: 'b', groupName: 'b' },
                { elementNamePattern: 'c', groupName: 'c' },
                { groupName: 'unusedGroup', elementNamePattern: 'X' },
              ],
              groups: [
                'a',
                { newlinesBetween: 0 },
                'unusedGroup',
                { newlinesBetween: 0 },
                'b',
                { newlinesBetween: 1 },
                'c',
              ],
              newlinesBetween: globalNewlinesBetween,
            },
          ],
          errors: [
            {
              messageId: 'extraSpacingBetweenObjectTypeMembers',
              data: { right: 'b', left: 'a' },
            },
          ],
          output: dedent`
            type T = {
              a: string
              b: string
            }
          `,
          code: dedent`
            type T = {
              a: string

              b: string
            }
          `,
        })
      },
    )

    it.each([
      ['ignore and 0', 'ignore', 0],
      ['0 and ignore', 0, 'ignore'],
    ])(
      'does not enforce a newline when global option is %s',
      async (_description, globalNewlinesBetween, groupNewlinesBetween) => {
        await valid({
          options: [
            {
              ...options,
              customGroups: [
                { elementNamePattern: 'a', groupName: 'a' },
                { elementNamePattern: 'b', groupName: 'b' },
                { groupName: 'unusedGroup', elementNamePattern: 'X' },
              ],
              groups: [
                'a',
                'unusedGroup',
                { newlinesBetween: groupNewlinesBetween },
                'b',
              ],
              newlinesBetween: globalNewlinesBetween,
            },
          ],
          code: dedent`
            type Type = {
              a: string

              b: string
            }
          `,
        })

        await valid({
          options: [
            {
              ...options,
              customGroups: [
                { elementNamePattern: 'a', groupName: 'a' },
                { elementNamePattern: 'b', groupName: 'b' },
                { groupName: 'unusedGroup', elementNamePattern: 'X' },
              ],
              groups: [
                'a',
                'unusedGroup',
                { newlinesBetween: groupNewlinesBetween },
                'b',
              ],
              newlinesBetween: globalNewlinesBetween,
            },
          ],
          code: dedent`
            type Type = {
              a: string
              b: string
            }
          `,
        })
      },
    )

    it('handles newlines and comment after fixes', async () => {
      await invalid({
        errors: [
          {
            data: {
              rightGroup: 'property',
              leftGroup: 'method',
              right: 'a',
              left: 'b',
            },
            messageId: 'unexpectedObjectTypesGroupOrder',
          },
        ],
        output: dedent`
          type Test = {
            a: string // Comment after

            b: () => void
            c: () => void
          };
        `,
        code: dedent`
          type Test = {
            b: () => void
            a: string // Comment after

            c: () => void
          };
        `,
        options: [
          {
            groups: ['property', 'method'],
            newlinesBetween: 1,
          },
        ],
      })
    })

    it('ignores newline fixes between different partitions with newlinesBetween: 0', async () => {
      await invalid({
        options: [
          {
            ...options,
            customGroups: [
              {
                elementNamePattern: 'a',
                groupName: 'a',
              },
            ],
            groups: ['a', 'unknown'],
            partitionByComment: true,
            newlinesBetween: 0,
          },
        ],
        output: dedent`
          type Type = {
            a: string

            // Partition comment

            b: string
            c: string
          }
        `,
        code: dedent`
          type Type = {
            a: string

            // Partition comment

            c: string
            b: string
          }
        `,
        errors: [
          {
            messageId: 'unexpectedObjectTypesOrder',
            data: { right: 'b', left: 'c' },
          },
        ],
      })
    })

    it('sorts inline elements correctly', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedObjectTypesOrder',
            data: { right: 'a', left: 'b' },
          },
        ],
        output: dedent`
          type Type = {
            a: string; b: string,
          }
        `,
        code: dedent`
          type Type = {
            b: string, a: string
          }
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            messageId: 'unexpectedObjectTypesOrder',
            data: { right: 'a', left: 'b' },
          },
        ],
        output: dedent`
          type Type = {
            a: string; b: string,
          }
        `,
        code: dedent`
          type Type = {
            b: string, a: string;
          }
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            messageId: 'unexpectedObjectTypesOrder',
            data: { right: 'a', left: 'b' },
          },
        ],
        output: dedent`
          type Type = {
            a: string, b: string,
          }
        `,
        code: dedent`
          type Type = {
            b: string, a: string,
          }
        `,
        options: [options],
      })
    })

    it('does not sort call signature declarations', async () => {
      await valid({
        code: dedent`
          type Type = {
            <Parameters extends Record<string, number | string>>(
              input: AFunction<[Parameters], string>
            ): Alternatives<Parameters>
            <A extends CountA>(input: Input): AFunction<
              [number],
              A[keyof A]
            >
          }
        `,
        options: [options],
      })
    })

    it('does not sort constructor declarations', async () => {
      await valid({
        code: dedent`
          type Type = {
            new (value: number | string): number;
            new (value: number): unknown;
          }
        `,
        options: [options],
      })

      await valid({
        code: dedent`
          type Type = {
            new (value: number): unknown;
            new (value: number | string): number;
          }
        `,
        options: [options],
      })
    })

    it.each([
      ['string pattern', '^r|g|b$'],
      ['array with string pattern', ['noMatch', '^r|g|b$']],
      ['regex pattern', { pattern: '^R|G|B$', flags: 'i' }],
      [
        'array with regex pattern',
        ['noMatch', { pattern: '^R|G|B$', flags: 'i' }],
      ],
    ])(
      'allows to use allNamesMatchPattern with %s',
      async (_description, rgbAllNamesMatchPattern) => {
        await invalid({
          options: [
            {
              ...options,
              useConfigurationIf: {
                allNamesMatchPattern: 'foo',
              },
            },
            {
              ...options,
              customGroups: [
                {
                  elementNamePattern: 'r',
                  groupName: 'r',
                },
                {
                  elementNamePattern: 'g',
                  groupName: 'g',
                },
                {
                  elementNamePattern: 'b',
                  groupName: 'b',
                },
              ],
              useConfigurationIf: {
                allNamesMatchPattern: rgbAllNamesMatchPattern,
              },
              groups: ['r', 'g', 'b'],
            },
          ],
          errors: [
            {
              data: {
                rightGroup: 'g',
                leftGroup: 'b',
                right: 'g',
                left: 'b',
              },
              messageId: 'unexpectedObjectTypesGroupOrder',
            },
            {
              data: {
                rightGroup: 'r',
                leftGroup: 'g',
                right: 'r',
                left: 'g',
              },
              messageId: 'unexpectedObjectTypesGroupOrder',
            },
          ],
          output: dedent`
            type Type = {
              r: string
              g: string
              b: string
            }
          `,
          code: dedent`
            type Type = {
              b: string
              g: string
              r: string
            }
          `,
        })
      },
    )

    it('detects declaration name by pattern', async () => {
      await valid({
        options: [
          {
            useConfigurationIf: {
              declarationMatchesPattern: '^Type$',
            },
            type: 'unsorted',
          },
          options,
        ],
        code: dedent`
          type Type = {
            b: string
            c: string
            a: string
          }
        `,
      })

      await invalid({
        options: [
          {
            useConfigurationIf: {
              declarationMatchesPattern: '^Type$',
            },
            type: 'unsorted',
          },
          options,
        ],
        errors: [
          {
            messageId: 'unexpectedObjectTypesOrder',
            data: { right: 'a', left: 'b' },
          },
        ],
        output: dedent`
          type OtherType = {
            a: string
            b: string
          }
        `,
        code: dedent`
          type OtherType = {
            b: string
            a: string
          }
        `,
      })
    })

    it('does not match configuration if no declaration name', async () => {
      await invalid({
        options: [
          {
            useConfigurationIf: {
              declarationMatchesPattern: '^Type$',
            },
            type: 'unsorted',
          },
          options,
        ],
        errors: [
          {
            messageId: 'unexpectedObjectTypesOrder',
            data: { right: 'b', left: 'c' },
          },
        ],
        output: dedent`
          type Type = {
            a: {
              b: string
              c: string
            }
          }
        `,
        code: dedent`
          type Type = {
            a: {
              c: string
              b: string
            }
          }
        `,
      })
    })

    it('allows sorting by value', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedObjectTypesOrder',
            data: { right: 'b', left: 'a' },
          },
        ],
        output: dedent`
          type Type = {
            b: 'a'
            a: 'b'
          }
        `,
        options: [
          {
            sortBy: 'value',
            ...options,
          },
        ],
        code: dedent`
          type Type = {
            a: 'b'
            b: 'a'
          }
        `,
      })
    })

    it('does not enforce sorting of non-properties in the same group', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedObjectTypesOrder',
            data: { right: 'a', left: 'z' },
          },
          {
            messageId: 'unexpectedObjectTypesOrder',
            data: { right: 'y', left: 'a' },
          },
        ],
        output: dedent`
          type Type = {
            y: 'y'
            a(): void
            z: 'z'
          }
        `,
        code: dedent`
          type Type = {
            z: 'z'
            a(): void
            y: 'y'
          }
        `,
        options: [
          {
            sortBy: 'value',
            ...options,
          },
        ],
      })

      await invalid({
        errors: [
          {
            data: { right: '[key: string]', left: 'z' },
            messageId: 'unexpectedObjectTypesOrder',
          },
          {
            data: {
              left: '[key: string]',
              right: 'y',
            },
            messageId: 'unexpectedObjectTypesOrder',
          },
        ],
        output: dedent`
          type Type = {
            y: 'y'
            [key: string]
            z: 'z'
          }
        `,
        code: dedent`
          type Type = {
            z: 'z'
            [key: string]
            y: 'y'
          }
        `,
        options: [
          {
            sortBy: 'value',
            ...options,
          },
        ],
      })
    })

    it('enforces grouping but does not enforce sorting of non-properties', async () => {
      await invalid({
        errors: [
          {
            data: {
              leftGroup: 'unknown',
              rightGroup: 'method',
              right: 'a',
              left: 'z',
            },
            messageId: 'unexpectedObjectTypesGroupOrder',
          },
        ],
        options: [
          {
            sortBy: 'value',
            ...options,
            groups: ['method', 'unknown'],
          },
        ],
        output: dedent`
          type Type = {
            b(): void
            a(): void
            z: 'z'
          }
        `,
        code: dedent`
          type Type = {
            b(): void
            z: 'z'
            a(): void
          }
        `,
      })
    })
  })

  describe('line-length', () => {
    let options = {
      type: 'line-length',
      order: 'desc',
    } as const

    it('sorts type members', async () => {
      await valid({
        code: dedent`
          type Type = {
            a: 'aaa'
            b: 'bb'
            c: 'c'
          }
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            messageId: 'unexpectedObjectTypesOrder',
            data: { right: 'b', left: 'c' },
          },
        ],
        output: dedent`
          type Type = {
            a: 'aaa'
            b: 'bb'
            c: 'c'
          }
        `,
        code: dedent`
          type Type = {
            a: 'aaa'
            c: 'c'
            b: 'bb'
          }
        `,
        options: [options],
      })
    })

    it('sorts type members in function args', async () => {
      await valid({
        code: dedent`
          let Func = (arguments: {
            a: 'aaa'
            b: 'bb'
            c: 'c'
          }) => {
            // ...
          }
        `,
        options: [options],
      })

      await invalid({
        output: dedent`
          let Func = (arguments: {
            a: 'aaa'
            b: 'bb'
            c: 'c'
          }) => {
            // ...
          }
        `,
        code: dedent`
          let Func = (arguments: {
            b: 'bb'
            a: 'aaa'
            c: 'c'
          }) => {
            // ...
          }
        `,
        errors: [
          {
            messageId: 'unexpectedObjectTypesOrder',
            data: { right: 'a', left: 'b' },
          },
        ],
        options: [options],
      })
    })

    it('sorts type members with computed keys', async () => {
      await valid({
        code: dedent`
          type Type = {
            [key: string]: string
            [value]: string
            a?: 'aaa'
            b: 'bb'
            c: 'c'
          }
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            data: { right: '[key: string]', left: 'a' },
            messageId: 'unexpectedObjectTypesOrder',
          },
          {
            messageId: 'unexpectedObjectTypesOrder',
            data: { right: 'value', left: 'b' },
          },
        ],
        output: dedent`
          type Type = {
            [key: string]: string
            [value]: string
            a?: 'aaa'
            b: 'bb'
            c: 'c'
          }
        `,
        code: dedent`
          type Type = {
            a?: 'aaa'
            [key: string]: string
            b: 'bb'
            [value]: string
            c: 'c'
          }
        `,
        options: [options],
      })
    })

    it('sorts type members with any key types', async () => {
      await valid({
        code: dedent`
          type Type = {
            arrowFunc?: () => void
            [[data]]: string
            [name in v]?
            func(): void
            [...values]
            [8]: Value
          }
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            data: {
              left: '[...values]',
              right: '[[data]]',
            },
            messageId: 'unexpectedObjectTypesOrder',
          },
          {
            messageId: 'unexpectedObjectTypesOrder',
            data: { right: 'func', left: '8' },
          },
          {
            data: { right: 'arrowFunc', left: 'func' },
            messageId: 'unexpectedObjectTypesOrder',
          },
        ],
        output: dedent`
          type Type = {
            arrowFunc?: () => void
            [[data]]: string
            [name in v]?
            func(): void
            [...values]
            [8]: Value
          }
        `,
        code: dedent`
          type Type = {
            [...values]
            [[data]]: string
            [name in v]?
            [8]: Value
            func(): void
            arrowFunc?: () => void
          }
        `,
        options: [options],
      })
    })

    it('sorts inline type members', async () => {
      await valid({
        code: dedent`
          func<{ a: 'aa'; b: 'b' }>(/* ... */)
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            messageId: 'unexpectedObjectTypesOrder',
            data: { right: 'a', left: 'b' },
          },
        ],
        output: dedent`
          func<{ a: 'aa'; b: 'b'; }>(/* ... */)
        `,
        code: dedent`
          func<{ b: 'b'; a: 'aa' }>(/* ... */)
        `,
        options: [options],
      })
    })

    it('sorts complex predefined groups', async () => {
      await invalid({
        errors: [
          {
            data: {
              leftGroup: 'required-property',
              rightGroup: 'index-signature',
              right: '[key: string]',
              left: 'a',
            },
            messageId: 'unexpectedObjectTypesGroupOrder',
          },
          {
            data: {
              rightGroup: 'optional-multiline-member',
              leftGroup: 'index-signature',
              left: '[key: string]',
              right: 'b',
            },
            messageId: 'unexpectedObjectTypesGroupOrder',
          },
          {
            data: {
              leftGroup: 'optional-multiline-member',
              rightGroup: 'required-method',
              right: 'c',
              left: 'b',
            },
            messageId: 'unexpectedObjectTypesGroupOrder',
          },
        ],
        options: [
          {
            ...options,
            groups: [
              'unknown',
              'required-method',
              'optional-multiline-member',
              'index-signature',
              'required-property',
            ],
          },
        ],
        output: dedent`
          type Type = {
            c(): void
            b?: {
              property: string;
            }
            [key: string]: string;
            a: string
          }
        `,
        code: dedent`
          type Type = {
            a: string
            [key: string]: string;
            b?: {
              property: string;
            }
            c(): void
          }
        `,
      })
    })

    it('prioritizes selectors over modifiers quantity', async () => {
      await invalid({
        errors: [
          {
            data: {
              leftGroup: 'required-property',
              rightGroup: 'method',
              left: 'property',
              right: 'method',
            },
            messageId: 'unexpectedObjectTypesGroupOrder',
          },
        ],
        options: [
          {
            ...options,
            groups: ['method', 'required-property'],
          },
        ],
        output: dedent`
          type Type = {
            method(): void
            property: string
          }
        `,
        code: dedent`
          type Type = {
            property: string
            method(): void
          }
        `,
      })
    })

    it('prioritizes index-signature over member', async () => {
      await invalid({
        errors: [
          {
            data: {
              rightGroup: 'index-signature',
              right: '[key: string]',
              leftGroup: 'member',
              left: 'member',
            },
            messageId: 'unexpectedObjectTypesGroupOrder',
          },
        ],
        output: dedent`
          type Type = {
            [key: string]: string;
            member: "something";
          }
        `,
        code: dedent`
          type Type = {
            member: "something";
            [key: string]: string;
          }
        `,
        options: [
          {
            ...options,
            groups: ['index-signature', 'member'],
          },
        ],
      })
    })

    it('prioritizes method over member', async () => {
      await invalid({
        errors: [
          {
            data: {
              rightGroup: 'method',
              leftGroup: 'member',
              right: 'method',
              left: 'member',
            },
            messageId: 'unexpectedObjectTypesGroupOrder',
          },
        ],
        output: dedent`
          type Type = {
            method(): string
            member: "something"
          }
        `,
        code: dedent`
          type Type = {
            member: "something"
            method(): string
          }
        `,
        options: [
          {
            ...options,
            groups: ['method', 'member'],
          },
        ],
      })
    })

    it('prioritizes property over member', async () => {
      await invalid({
        errors: [
          {
            data: {
              rightGroup: 'property',
              leftGroup: 'member',
              right: 'property',
              left: 'method',
            },
            messageId: 'unexpectedObjectTypesGroupOrder',
          },
        ],
        output: dedent`
          type Type = {
            property: string
            method(): string
          }
        `,
        code: dedent`
          type Type = {
            method(): string
            property: string
          }
        `,
        options: [
          {
            ...options,
            groups: ['property', 'member'],
          },
        ],
      })
    })

    it('prioritizes multiline over optional', async () => {
      await invalid({
        errors: [
          {
            data: {
              rightGroup: 'multiline-property',
              leftGroup: 'optional-property',
              right: 'multilineProperty',
              left: 'optionalProperty',
            },
            messageId: 'unexpectedObjectTypesGroupOrder',
          },
        ],
        output: dedent`
          type Type = {
            multilineProperty: {
              a: string
            }
            optionalProperty?: string
          }
        `,
        code: dedent`
          type Type = {
            optionalProperty?: string
            multilineProperty: {
              a: string
            }
          }
        `,
        options: [
          {
            ...options,
            groups: ['multiline-property', 'optional-property'],
          },
        ],
      })
    })

    it('prioritizes multiline over required', async () => {
      await invalid({
        errors: [
          {
            data: {
              rightGroup: 'multiline-property',
              leftGroup: 'required-property',
              right: 'multilineProperty',
              left: 'requiredProperty',
            },
            messageId: 'unexpectedObjectTypesGroupOrder',
          },
        ],
        output: dedent`
          type Type = {
            multilineProperty: {
              a: string
            }
            requiredProperty: string
          }
        `,
        code: dedent`
          type Type = {
            requiredProperty: string
            multilineProperty: {
              a: string
            }
          }
        `,
        options: [
          {
            ...options,
            groups: ['multiline-property', 'required-property'],
          },
        ],
      })
    })

    it('filters on selector and modifiers', async () => {
      await invalid({
        options: [
          {
            customGroups: [
              {
                groupName: 'unusedCustomGroup',
                modifiers: ['optional'],
                selector: 'method',
              },
              {
                groupName: 'optionalPropertyGroup',
                modifiers: ['optional'],
                selector: 'property',
              },
              {
                groupName: 'propertyGroup',
                selector: 'property',
              },
            ],
            groups: ['propertyGroup', 'optionalPropertyGroup'],
          },
        ],
        errors: [
          {
            data: {
              leftGroup: 'optionalPropertyGroup',
              rightGroup: 'propertyGroup',
              right: 'c',
              left: 'b',
            },
            messageId: 'unexpectedObjectTypesGroupOrder',
          },
        ],
        output: dedent`
          type Type = {
            c: string
            a?: string
            b?: string
          }
        `,
        code: dedent`
          type Type = {
            a?: string
            b?: string
            c: string
          }
        `,
      })
    })

    it.each([
      ['string pattern', 'hello'],
      ['array with string pattern', ['noMatch', 'hello']],
      ['regex pattern', { pattern: 'HELLO', flags: 'i' }],
      [
        'array with regex pattern',
        ['noMatch', { pattern: 'HELLO', flags: 'i' }],
      ],
    ])(
      'filters on elementNamePattern with %s',
      async (_description, elementNamePattern) => {
        await invalid({
          options: [
            {
              customGroups: [
                {
                  groupName: 'propertiesStartingWithHello',
                  selector: 'property',
                  elementNamePattern,
                },
              ],
              groups: ['propertiesStartingWithHello', 'unknown'],
            },
          ],
          errors: [
            {
              data: {
                rightGroup: 'propertiesStartingWithHello',
                right: 'helloProperty',
                leftGroup: 'unknown',
                left: 'method',
              },
              messageId: 'unexpectedObjectTypesGroupOrder',
            },
          ],
          output: dedent`
            type Type = {
              helloProperty: string
              a: string
              b: string
              method(): void
            }
          `,
          code: dedent`
            type Type = {
              a: string
              b: string
              method(): void
              helloProperty: string
            }
          `,
        })
      },
    )

    it.each([
      ['string pattern', 'Date'],
      ['array with string pattern', ['noMatch', 'Date']],
      ['regex pattern', { pattern: 'DATE', flags: 'i' }],
      [
        'array with regex pattern',
        ['noMatch', { pattern: 'DATE', flags: 'i' }],
      ],
    ])(
      'filters on elementValuePattern with %s',
      async (_description, dateElementValuePattern) => {
        await invalid({
          options: [
            {
              customGroups: [
                {
                  elementValuePattern: dateElementValuePattern,
                  groupName: 'date',
                },
                {
                  elementValuePattern: 'number',
                  groupName: 'number',
                },
              ],
              groups: ['number', 'date', 'unknown'],
            },
          ],
          errors: [
            {
              data: {
                rightGroup: 'number',
                leftGroup: 'date',
                right: 'z',
                left: 'y',
              },
              messageId: 'unexpectedObjectTypesGroupOrder',
            },
          ],
          output: dedent`
            type Type = {
              a: number
              z: number
              b: Date
              y: Date
              c(): string
            }
          `,
          code: dedent`
            type Type = {
              a: number
              b: Date
              y: Date
              z: number
              c(): string
            }
          `,
        })
      },
    )

    it('sorts custom groups by overriding type and order', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedObjectTypesOrder',
            data: { right: 'bb', left: 'a' },
          },
          {
            messageId: 'unexpectedObjectTypesOrder',
            data: { right: 'ccc', left: 'bb' },
          },
          {
            messageId: 'unexpectedObjectTypesOrder',
            data: { right: 'dddd', left: 'ccc' },
          },
          {
            data: {
              rightGroup: 'reversedPropertiesByLineLength',
              leftGroup: 'unknown',
              left: 'method',
              right: 'eee',
            },
            messageId: 'unexpectedObjectTypesGroupOrder',
          },
        ],
        options: [
          {
            customGroups: [
              {
                groupName: 'reversedPropertiesByLineLength',
                selector: 'property',
                type: 'line-length',
                order: 'desc',
              },
            ],
            groups: ['reversedPropertiesByLineLength', 'unknown'],
            type: 'alphabetical',
            order: 'asc',
          },
        ],
        output: dedent`
          type Type = {
            dddd: string
            ccc: string
            eee: string
            bb: string
            ff: string
            a: string
            g: string
            anotherMethod(): void
            method(): void
            yetAnotherMethod(): void
          }
        `,
        code: dedent`
          type Type = {
            a: string
            bb: string
            ccc: string
            dddd: string
            method(): void
            eee: string
            ff: string
            g: string
            anotherMethod(): void
            yetAnotherMethod(): void
          }
        `,
      })
    })

    it('sorts custom groups by overriding fallbackSort', async () => {
      await invalid({
        options: [
          {
            customGroups: [
              {
                fallbackSort: {
                  type: 'alphabetical',
                  order: 'asc',
                },
                elementNamePattern: '^foo',
                type: 'line-length',
                groupName: 'foo',
                order: 'desc',
              },
            ],
            type: 'alphabetical',
            groups: ['foo'],
            order: 'asc',
          },
        ],
        errors: [
          {
            data: { right: 'fooBar', left: 'fooZar' },
            messageId: 'unexpectedObjectTypesOrder',
          },
        ],
        output: dedent`
          type Type = {
            fooBar: string
            fooZar: string
          }
        `,
        code: dedent`
          type Type = {
            fooZar: string
            fooBar: string
          }
        `,
      })

      await invalid({
        options: [
          {
            customGroups: [
              {
                fallbackSort: {
                  type: 'alphabetical',
                  sortBy: 'value',
                },
                elementValuePattern: '^foo',
                type: 'line-length',
                groupName: 'foo',
              },
            ],
            type: 'alphabetical',
            groups: ['foo'],
            order: 'asc',
          },
        ],
        errors: [
          {
            messageId: 'unexpectedObjectTypesOrder',
            data: { right: 'b', left: 'a' },
          },
        ],
        output: dedent`
          type Type = {
            b: fooBar
            a: fooZar
          }
        `,
        code: dedent`
          type Type = {
            a: fooZar
            b: fooBar
          }
        `,
      })
    })

    it('sorts custom groups by overriding sortBy', async () => {
      await invalid({
        errors: [
          {
            data: {
              rightGroup: 'fooElementsSortedByValue',
              leftGroup: 'unknown',
              right: 'fooC',
              left: 'z',
            },
            messageId: 'unexpectedObjectTypesGroupOrder',
          },
          {
            messageId: 'unexpectedObjectTypesOrder',
            data: { right: 'fooA', left: 'fooB' },
          },
          {
            data: {
              rightGroup: 'fooElementsSortedByValue',
              leftGroup: 'unknown',
              right: 'fooMethod',
              left: 'a',
            },
            messageId: 'unexpectedObjectTypesGroupOrder',
          },
        ],
        options: [
          {
            customGroups: [
              {
                groupName: 'fooElementsSortedByValue',
                elementNamePattern: '^foo',
                sortBy: 'value',
              },
            ],
            groups: ['fooElementsSortedByValue', 'unknown'],
            type: 'alphabetical',
            order: 'asc',
          },
        ],
        output: dedent`
          type Type = {
            fooA: Date
            fooC: number
            fooB: string
            fooMethod(): void
            a: string
            z: boolean
          }
        `,
        code: dedent`
          type Type = {
            z: boolean
            fooC: number
            fooB: string
            fooA: Date
            a: string
            fooMethod(): void
          }
        `,
      })
    })

    it('does not sort custom groups with unsorted type', async () => {
      await invalid({
        options: [
          {
            customGroups: [
              {
                groupName: 'unsortedProperties',
                selector: 'property',
                type: 'unsorted',
              },
            ],
            groups: ['unsortedProperties', 'unknown'],
          },
        ],
        errors: [
          {
            data: {
              rightGroup: 'unsortedProperties',
              leftGroup: 'unknown',
              left: 'method',
              right: 'c',
            },
            messageId: 'unexpectedObjectTypesGroupOrder',
          },
        ],
        output: dedent`
          type Type = {
            b
            a
            d
            e
            c
            method(): void
          }
        `,
        code: dedent`
          type Type = {
            b
            a
            d
            e
            method(): void
            c
          }
        `,
      })
    })

    it('sorts custom group blocks', async () => {
      await invalid({
        options: [
          {
            customGroups: [
              {
                anyOf: [
                  {
                    modifiers: ['required'],
                    selector: 'property',
                  },
                  {
                    modifiers: ['optional'],
                    selector: 'method',
                  },
                ],
                groupName: 'requiredPropertiesAndOptionalMethods',
              },
            ],
            groups: [
              ['requiredPropertiesAndOptionalMethods', 'index-signature'],
              'unknown',
            ],
          },
        ],
        errors: [
          {
            data: {
              rightGroup: 'requiredPropertiesAndOptionalMethods',
              leftGroup: 'unknown',
              right: 'd',
              left: 'c',
            },
            messageId: 'unexpectedObjectTypesGroupOrder',
          },
          {
            data: { right: '[key: string]', left: 'e' },
            messageId: 'unexpectedObjectTypesOrder',
          },
        ],
        output: dedent`
          type Type = {
            [key: string]: string
            a: string
            d?: () => void
            e: string
            b(): void
            c?: string
          }
        `,
        code: dedent`
          type Type = {
            a: string
            b(): void
            c?: string
            d?: () => void
            e: string
            [key: string]: string
          }
        `,
      })
    })

    it('allows to use regex for element names in custom groups', async () => {
      await valid({
        options: [
          {
            customGroups: [
              {
                elementNamePattern: '^(?!.*Foo).*$',
                groupName: 'elementsWithoutFoo',
              },
            ],
            groups: ['unknown', 'elementsWithoutFoo'],
            type: 'alphabetical',
          },
        ],
        code: dedent`
          type Type = {
            iHaveFooInMyName: string
            meTooIHaveFoo: string
            a: string
            b: string
          }
        `,
      })
    })

    it('allows to use newlinesInside: 1', async () => {
      await invalid({
        options: [
          {
            customGroups: [
              {
                selector: 'property',
                groupName: 'group1',
                newlinesInside: 1,
              },
            ],
            groups: ['group1'],
          },
        ],
        errors: [
          {
            messageId: 'missedSpacingBetweenObjectTypeMembers',
            data: { right: 'b', left: 'a' },
          },
        ],
        output: dedent`
          type type = {
            a

            b
          }
        `,
        code: dedent`
          type type = {
            a
            b
          }
        `,
      })
    })

    it('allows to use newlinesInside: 0', async () => {
      await invalid({
        options: [
          {
            customGroups: [
              {
                selector: 'property',
                groupName: 'group1',
                newlinesInside: 0,
              },
            ],
            type: 'alphabetical',
            groups: ['group1'],
          },
        ],
        errors: [
          {
            messageId: 'extraSpacingBetweenObjectTypeMembers',
            data: { right: 'b', left: 'a' },
          },
        ],
        output: dedent`
          type type = {
            a
            b
          }
        `,
        code: dedent`
          type type = {
            a

            b
          }
        `,
      })
    })

    it('allows to use regex for custom groups', async () => {
      await valid({
        options: [
          {
            ...options,
            customGroups: [
              {
                elementNamePattern: '^(?!.*Foo).*$',
                groupName: 'elementsWithoutFoo',
              },
            ],
            groups: ['unknown', 'elementsWithoutFoo'],
          },
        ],
        code: dedent`
          type T = {
            iHaveFooInMyName: string
            meTooIHaveFoo: string
            a: string
            b: string
          }
        `,
      })
    })

    it('allows to use in class methods', async () => {
      await invalid({
        output: dedent`
          class Class {
            async method (data: {
              a: 'aaa'
              b: 'bb'
              c: 'c'
            }) {}
          }
        `,
        code: dedent`
          class Class {
            async method (data: {
              b: 'bb'
              a: 'aaa'
              c: 'c'
            }) {}
          }
        `,
        errors: [
          {
            messageId: 'unexpectedObjectTypesOrder',
            data: { right: 'a', left: 'b' },
          },
        ],
        options: [options],
      })
    })

    it('allows to use new line as partition', async () => {
      await valid({
        code: dedent`
          type Type = {
            d: 'dd'
            e: 'e'

            c: 'ccc'

            a: 'aaaaa'
            b: 'bbbb'
          }
        `,
        options: [
          {
            ...options,
            partitionByNewLine: true,
          },
        ],
      })

      await invalid({
        errors: [
          {
            messageId: 'unexpectedObjectTypesOrder',
            data: { right: 'd', left: 'e' },
          },
          {
            messageId: 'unexpectedObjectTypesOrder',
            data: { right: 'a', left: 'b' },
          },
        ],
        output: dedent`
          type Type = {
            d: 'dd'
            e: 'e'

            c: 'ccc'

            a: 'aaaaa'
            b: 'bbbb'
          }
        `,
        code: dedent`
          type Type = {
            e: 'e'
            d: 'dd'

            c: 'ccc'

            b: 'bbbb'
            a: 'aaaaa'
          }
        `,
        options: [
          {
            ...options,
            partitionByNewLine: true,
          },
        ],
      })
    })

    it('allows to use partition comments', async () => {
      await invalid({
        output: dedent`
          type Type = {
            // Part: A
            // Not partition comment
            bbb: string
            cc: string
            d: string
            // Part: B
            aaaa: string
            e: string
            // Part: C
            'gg': string
            // Not partition comment
            fff: string
          }
        `,
        code: dedent`
          type Type = {
            // Part: A
            cc: string
            d: string
            // Not partition comment
            bbb: string
            // Part: B
            aaaa: string
            e: string
            // Part: C
            'gg': string
            // Not partition comment
            fff: string
          }
        `,
        errors: [
          {
            messageId: 'unexpectedObjectTypesOrder',
            data: { right: 'bbb', left: 'd' },
          },
        ],
        options: [
          {
            ...options,
            partitionByComment: '^Part',
          },
        ],
      })
    })

    it('allows to use all comments as parts', async () => {
      await valid({
        code: dedent`
          type Type = {
            // Comment
            bb: string
            // Other comment
            a: string
          }
        `,
        options: [
          {
            ...options,
            partitionByComment: true,
          },
        ],
      })
    })

    it('allows to use multiple partition comments', async () => {
      await invalid({
        output: dedent`
          type Type = {
            /* Partition Comment */
            // Part: A
            d: string
            // Part: B
            aaa: string
            bb: string
            c: string
            /* Other */
            e: string
          }
        `,
        code: dedent`
          type Type = {
            /* Partition Comment */
            // Part: A
            d: string
            // Part: B
            aaa: string
            c: string
            bb: string
            /* Other */
            e: string
          }
        `,
        errors: [
          {
            messageId: 'unexpectedObjectTypesOrder',
            data: { right: 'bb', left: 'c' },
          },
        ],
        options: [
          {
            ...options,
            partitionByComment: ['Partition Comment', 'Part:', 'Other'],
          },
        ],
      })
    })

    it('allows to use regex for partition comments', async () => {
      await valid({
        code: dedent`
          type Type = {
            e: string
            f: string
            // I am a partition comment because I don't have f o o
            a: string
            b: string
          }
        `,
        options: [
          {
            ...options,
            partitionByComment: ['^(?!.*foo).*$'],
          },
        ],
      })
    })

    it('ignores block comments', async () => {
      await invalid({
        options: [
          {
            ...options,
            partitionByComment: {
              line: true,
            },
          },
        ],
        errors: [
          {
            messageId: 'unexpectedObjectTypesOrder',
            data: { right: 'aa', left: 'b' },
          },
        ],
        output: dedent`
          type Type = {
            /* Comment */
            aa: string
            b: string
          }
        `,
        code: dedent`
          type Type = {
            b: string
            /* Comment */
            aa: string
          }
        `,
      })
    })

    it('allows to use all line comments as parts', async () => {
      await valid({
        options: [
          {
            ...options,
            partitionByComment: {
              line: true,
            },
          },
        ],
        code: dedent`
          type Type = {
            b: string
            // Comment
            a: string
          }
        `,
      })
    })

    it('allows to use multiple partition line comments', async () => {
      await valid({
        code: dedent`
          type Type = {
            c: string
            // b
            b: string
            // a
            a: string
          }
        `,
        options: [
          {
            ...options,
            partitionByComment: {
              line: ['a', 'b'],
            },
          },
        ],
      })
    })

    it('allows to use regex for partition line comments', async () => {
      await valid({
        code: dedent`
          type Type = {
            b: string
            // I am a partition comment because I don't have f o o
            a: string
          }
        `,
        options: [
          {
            ...options,
            partitionByComment: {
              line: ['^(?!.*foo).*$'],
            },
          },
        ],
      })
    })

    it('ignores line comments', async () => {
      await invalid({
        options: [
          {
            ...options,
            partitionByComment: {
              block: true,
            },
          },
        ],
        errors: [
          {
            messageId: 'unexpectedObjectTypesOrder',
            data: { right: 'aa', left: 'b' },
          },
        ],
        output: dedent`
          type Type = {
            // Comment
            aa: string
            b: string
          }
        `,
        code: dedent`
          type Type = {
            b: string
            // Comment
            aa: string
          }
        `,
      })
    })

    it('allows to use all block comments as parts', async () => {
      await valid({
        options: [
          {
            ...options,
            partitionByComment: {
              block: true,
            },
          },
        ],
        code: dedent`
          type Type = {
            b: string
            /* Comment */
            a: string
          }
        `,
      })
    })

    it('allows to use multiple partition block comments', async () => {
      await valid({
        code: dedent`
          type Type = {
            c: string
            /* b */
            b: string
            /* a */
            a: string
          }
        `,
        options: [
          {
            ...options,
            partitionByComment: {
              block: ['a', 'b'],
            },
          },
        ],
      })
    })

    it('allows to use regex for partition block comments', async () => {
      await valid({
        code: dedent`
          type Type = {
            b: string
            /* I am a partition comment because I don't have f o o */
            a: string
          }
        `,
        options: [
          {
            ...options,
            partitionByComment: {
              block: ['^(?!.*foo).*$'],
            },
          },
        ],
      })
    })

    it('allows to trim special characters', async () => {
      await valid({
        code: dedent`
          type Type = {
            _a: string
            bb: string
            _c: string
          }
        `,
        options: [
          {
            ...options,
            specialCharacters: 'trim',
          },
        ],
      })
    })

    it('allows to remove special characters', async () => {
      await valid({
        options: [
          {
            ...options,
            specialCharacters: 'remove',
          },
        ],
        code: dedent`
          type Type = {
            abc: string
            a_c: string
          }
        `,
      })
    })

    it('allows to use locale', async () => {
      await valid({
        code: dedent`
          type Type = {
            你好: string
            世界: string
            a: string
            A: string
            b: string
            B: string
          }
        `,
        options: [{ ...options, locales: 'zh-CN' }],
      })
    })

    it('allows to use method group', async () => {
      await valid({
        code: dedent`
          type Type = {
            c: (((v: false) => 'false') | ((v: true) => 'true')) & ((v: any) => any)
            b(): void
            a: string
            d: string
          }
        `,
        options: [
          {
            ...options,
            groups: ['method', 'unknown'],
          },
        ],
      })
    })

    it('removes newlines when newlinesBetween is 0', async () => {
      await invalid({
        errors: [
          {
            data: {
              left: 'aaaa',
              right: 'yy',
            },
            messageId: 'extraSpacingBetweenObjectTypeMembers',
          },
          {
            messageId: 'unexpectedObjectTypesOrder',
            data: { right: 'bbb', left: 'z' },
          },
          {
            messageId: 'extraSpacingBetweenObjectTypeMembers',
            data: { right: 'bbb', left: 'z' },
          },
        ],
        code: dedent`
          type Type = {
            aaaa: () => null,


           yy: "y",
          z: "z",

              bbb: "b",
          }
        `,
        output: dedent`
          type Type = {
            aaaa: () => null,
           bbb: "b",
          yy: "y",
              z: "z",
          }
        `,
        options: [
          {
            ...options,
            groups: ['method', 'unknown'],
            newlinesBetween: 0,
          },
        ],
      })
    })

    it('handles newlinesBetween between consecutive groups', async () => {
      await invalid({
        options: [
          {
            ...options,
            customGroups: [
              { elementNamePattern: 'a', groupName: 'a' },
              { elementNamePattern: 'b', groupName: 'b' },
              { elementNamePattern: 'c', groupName: 'c' },
              { elementNamePattern: 'd', groupName: 'd' },
              { elementNamePattern: 'e', groupName: 'e' },
            ],
            groups: [
              'a',
              { newlinesBetween: 1 },
              'b',
              { newlinesBetween: 1 },
              'c',
              { newlinesBetween: 0 },
              'd',
              { newlinesBetween: 'ignore' },
              'e',
            ],
            newlinesBetween: 1,
          },
        ],
        errors: [
          {
            messageId: 'missedSpacingBetweenObjectTypeMembers',
            data: { right: 'b', left: 'a' },
          },
          {
            messageId: 'extraSpacingBetweenObjectTypeMembers',
            data: { right: 'c', left: 'b' },
          },
          {
            messageId: 'extraSpacingBetweenObjectTypeMembers',
            data: { right: 'd', left: 'c' },
          },
        ],
        output: dedent`
          type Type = {
            a: string

            b: string

            c: string
            d: string


            e: string
          }
        `,
        code: dedent`
          type Type = {
            a: string
            b: string


            c: string

            d: string


            e: string
          }
        `,
      })
    })

    it.each([
      ['2 and 0', 2, 0],
      ['2 and ignore', 2, 'ignore'],
      ['0 and 2', 0, 2],
      ['ignore and 2', 'ignore', 2],
    ])(
      'enforces newlines when global option is %s',
      async (_description, globalNewlinesBetween, groupNewlinesBetween) => {
        await invalid({
          options: [
            {
              ...options,
              customGroups: [
                { elementNamePattern: 'a', groupName: 'a' },
                { elementNamePattern: 'b', groupName: 'b' },
                { groupName: 'unusedGroup', elementNamePattern: 'X' },
              ],
              groups: [
                'a',
                'unusedGroup',
                { newlinesBetween: groupNewlinesBetween },
                'b',
              ],
              newlinesBetween: globalNewlinesBetween,
            },
          ],
          errors: [
            {
              messageId: 'missedSpacingBetweenObjectTypeMembers',
              data: { right: 'b', left: 'a' },
            },
          ],
          output: dedent`
            type Type = {
              a: string


              b: string
            }
          `,
          code: dedent`
            type Type = {
              a: string
              b: string
            }
          `,
        })
      },
    )

    it.each([
      ['1', 1],
      ['2', 2],
      ['ignore', 'ignore'],
      ['0', 0],
    ])(
      'enforces no newline when global option is %s and newlinesBetween: 0 exists between all groups',
      async (_description, globalNewlinesBetween) => {
        await invalid({
          options: [
            {
              ...options,
              customGroups: [
                { elementNamePattern: 'a', groupName: 'a' },
                { elementNamePattern: 'b', groupName: 'b' },
                { elementNamePattern: 'c', groupName: 'c' },
                { groupName: 'unusedGroup', elementNamePattern: 'X' },
              ],
              groups: [
                'a',
                { newlinesBetween: 0 },
                'unusedGroup',
                { newlinesBetween: 0 },
                'b',
                { newlinesBetween: 1 },
                'c',
              ],
              newlinesBetween: globalNewlinesBetween,
            },
          ],
          errors: [
            {
              messageId: 'extraSpacingBetweenObjectTypeMembers',
              data: { right: 'b', left: 'a' },
            },
          ],
          output: dedent`
            type T = {
              a: string
              b: string
            }
          `,
          code: dedent`
            type T = {
              a: string

              b: string
            }
          `,
        })
      },
    )

    it.each([
      ['ignore and 0', 'ignore', 0],
      ['0 and ignore', 0, 'ignore'],
    ])(
      'does not enforce a newline when global option is %s',
      async (_description, globalNewlinesBetween, groupNewlinesBetween) => {
        await valid({
          options: [
            {
              ...options,
              customGroups: [
                { elementNamePattern: 'a', groupName: 'a' },
                { elementNamePattern: 'b', groupName: 'b' },
                { groupName: 'unusedGroup', elementNamePattern: 'X' },
              ],
              groups: [
                'a',
                'unusedGroup',
                { newlinesBetween: groupNewlinesBetween },
                'b',
              ],
              newlinesBetween: globalNewlinesBetween,
            },
          ],
          code: dedent`
            type Type = {
              a: string

              b: string
            }
          `,
        })

        await valid({
          options: [
            {
              ...options,
              customGroups: [
                { elementNamePattern: 'a', groupName: 'a' },
                { elementNamePattern: 'b', groupName: 'b' },
                { groupName: 'unusedGroup', elementNamePattern: 'X' },
              ],
              groups: [
                'a',
                'unusedGroup',
                { newlinesBetween: groupNewlinesBetween },
                'b',
              ],
              newlinesBetween: globalNewlinesBetween,
            },
          ],
          code: dedent`
            type Type = {
              a: string
              b: string
            }
          `,
        })
      },
    )

    it('handles newlines and comment after fixes', async () => {
      await invalid({
        errors: [
          {
            data: {
              rightGroup: 'property',
              leftGroup: 'method',
              right: 'a',
              left: 'b',
            },
            messageId: 'unexpectedObjectTypesGroupOrder',
          },
        ],
        output: dedent`
          type Test = {
            a: string // Comment after

            b: () => void
            c: () => void
          };
        `,
        code: dedent`
          type Test = {
            b: () => void
            a: string // Comment after

            c: () => void
          };
        `,
        options: [
          {
            groups: ['property', 'method'],
            newlinesBetween: 1,
          },
        ],
      })
    })

    it('ignores newline fixes between different partitions with newlinesBetween: 0', async () => {
      await invalid({
        options: [
          {
            ...options,
            customGroups: [
              {
                elementNamePattern: 'a',
                groupName: 'a',
              },
            ],
            groups: ['a', 'unknown'],
            partitionByComment: true,
            newlinesBetween: 0,
          },
        ],
        output: dedent`
          type Type = {
            a: string

            // Partition comment

            bb: string
            c: string
          }
        `,
        code: dedent`
          type Type = {
            a: string

            // Partition comment

            c: string
            bb: string
          }
        `,
        errors: [
          {
            messageId: 'unexpectedObjectTypesOrder',
            data: { right: 'bb', left: 'c' },
          },
        ],
      })
    })

    it('sorts inline elements correctly', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedObjectTypesOrder',
            data: { right: 'aa', left: 'b' },
          },
        ],
        output: dedent`
          type Type = {
            aa: string; b: string,
          }
        `,
        code: dedent`
          type Type = {
            b: string, aa: string
          }
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            messageId: 'unexpectedObjectTypesOrder',
            data: { right: 'aa', left: 'b' },
          },
        ],
        output: dedent`
          type Type = {
            aa: string; b: string,
          }
        `,
        code: dedent`
          type Type = {
            b: string, aa: string;
          }
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            messageId: 'unexpectedObjectTypesOrder',
            data: { right: 'aa', left: 'b' },
          },
        ],
        output: dedent`
          type Type = {
            aa: string, b: string,
          }
        `,
        code: dedent`
          type Type = {
            b: string, aa: string,
          }
        `,
        options: [options],
      })
    })

    it('does not sort call signature declarations', async () => {
      await valid({
        code: dedent`
          type Type = {
            <Parameters extends Record<string, number | string>>(
              input: AFunction<[Parameters], string>
            ): Alternatives<Parameters>
            <A extends CountA>(input: Input): AFunction<
              [number],
              A[keyof A]
            >
          }
        `,
        options: [options],
      })
    })

    it('does not sort constructor declarations', async () => {
      await valid({
        code: dedent`
          type Type = {
            new (value: number | string): number;
            new (value: number): unknown;
          }
        `,
        options: [options],
      })

      await valid({
        code: dedent`
          type Type = {
            new (value: number): unknown;
            new (value: number | string): number;
          }
        `,
        options: [options],
      })
    })

    it.each([
      ['string pattern', '^r|g|b$'],
      ['array with string pattern', ['noMatch', '^r|g|b$']],
      ['regex pattern', { pattern: '^R|G|B$', flags: 'i' }],
      [
        'array with regex pattern',
        ['noMatch', { pattern: '^R|G|B$', flags: 'i' }],
      ],
    ])(
      'allows to use allNamesMatchPattern with %s',
      async (_description, rgbAllNamesMatchPattern) => {
        await invalid({
          options: [
            {
              ...options,
              useConfigurationIf: {
                allNamesMatchPattern: 'foo',
              },
            },
            {
              ...options,
              customGroups: [
                {
                  elementNamePattern: 'r',
                  groupName: 'r',
                },
                {
                  elementNamePattern: 'g',
                  groupName: 'g',
                },
                {
                  elementNamePattern: 'b',
                  groupName: 'b',
                },
              ],
              useConfigurationIf: {
                allNamesMatchPattern: rgbAllNamesMatchPattern,
              },
              groups: ['r', 'g', 'b'],
            },
          ],
          errors: [
            {
              data: {
                rightGroup: 'g',
                leftGroup: 'b',
                right: 'g',
                left: 'b',
              },
              messageId: 'unexpectedObjectTypesGroupOrder',
            },
            {
              data: {
                rightGroup: 'r',
                leftGroup: 'g',
                right: 'r',
                left: 'g',
              },
              messageId: 'unexpectedObjectTypesGroupOrder',
            },
          ],
          output: dedent`
            type Type = {
              r: string
              g: string
              b: string
            }
          `,
          code: dedent`
            type Type = {
              b: string
              g: string
              r: string
            }
          `,
        })
      },
    )

    it('detects declaration name by pattern', async () => {
      await valid({
        options: [
          {
            useConfigurationIf: {
              declarationMatchesPattern: '^Type$',
            },
            type: 'unsorted',
          },
          options,
        ],
        code: dedent`
          type Type = {
            b: string
            c: string
            a: string
          }
        `,
      })

      await invalid({
        options: [
          {
            useConfigurationIf: {
              declarationMatchesPattern: '^Type$',
            },
            type: 'unsorted',
          },
          options,
        ],
        errors: [
          {
            messageId: 'unexpectedObjectTypesOrder',
            data: { right: 'aa', left: 'b' },
          },
        ],
        output: dedent`
          type OtherType = {
            aa: string
            b: string
          }
        `,
        code: dedent`
          type OtherType = {
            b: string
            aa: string
          }
        `,
      })
    })

    it('does not match configuration if no declaration name', async () => {
      await invalid({
        options: [
          {
            useConfigurationIf: {
              declarationMatchesPattern: '^Type$',
            },
            type: 'unsorted',
          },
          options,
        ],
        errors: [
          {
            messageId: 'unexpectedObjectTypesOrder',
            data: { right: 'bb', left: 'c' },
          },
        ],
        output: dedent`
          type Type = {
            a: {
              bb: string
              c: string
            }
          }
        `,
        code: dedent`
          type Type = {
            a: {
              c: string
              bb: string
            }
          }
        `,
      })
    })

    it('allows sorting by value', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedObjectTypesOrder',
            data: { right: 'b', left: 'a' },
          },
        ],
        output: dedent`
          type Type = {
            b: 'aa'
            a: 'b'
          }
        `,
        options: [
          {
            sortBy: 'value',
            ...options,
          },
        ],
        code: dedent`
          type Type = {
            a: 'b'
            b: 'aa'
          }
        `,
      })
    })

    it('does not enforce sorting of non-properties in the same group', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedObjectTypesOrder',
            data: { right: 'aaa', left: 'z' },
          },
          {
            messageId: 'unexpectedObjectTypesOrder',
            data: { right: 'yy', left: 'aaa' },
          },
        ],
        output: dedent`
          type Type = {
            yy: 'y'
            aaa(): void
            z: 'z'
          }
        `,
        code: dedent`
          type Type = {
            z: 'z'
            aaa(): void
            yy: 'y'
          }
        `,
        options: [
          {
            sortBy: 'value',
            ...options,
          },
        ],
      })
    })

    it('enforces grouping but does not enforce sorting of non-properties', async () => {
      await invalid({
        errors: [
          {
            data: {
              leftGroup: 'unknown',
              rightGroup: 'method',
              right: 'a',
              left: 'z',
            },
            messageId: 'unexpectedObjectTypesGroupOrder',
          },
        ],
        options: [
          {
            sortBy: 'value',
            ...options,
            groups: ['method', 'unknown'],
          },
        ],
        output: dedent`
          type Type = {
            b(): void
            a(): void
            z: 'z'
          }
        `,
        code: dedent`
          type Type = {
            b(): void
            z: 'z'
            a(): void
          }
        `,
      })
    })

    it('handles fallbackSort option', async () => {
      await invalid({
        options: [
          {
            ...options,
            fallbackSort: {
              type: 'alphabetical',
            },
          },
        ],
        errors: [
          {
            messageId: 'unexpectedObjectTypesOrder',
            data: { right: 'bb', left: 'a' },
          },
        ],
        output: dedent`
          type Type = {
            bb: string;
            c: string;
            a: string;
          }
        `,
        code: dedent`
          type Type = {
            a: string;
            bb: string;
            c: string;
          }
        `,
      })

      await invalid({
        options: [
          {
            ...options,
            fallbackSort: {
              type: 'alphabetical',
              order: 'asc',
            },
          },
        ],
        errors: [
          {
            messageId: 'unexpectedObjectTypesOrder',
            data: { right: 'bb', left: 'c' },
          },
        ],
        output: dedent`
          type Type = {
            bb: string;
            a: string;
            c: string;
          }
        `,
        code: dedent`
          type Type = {
            c: string;
            bb: string;
            a: string;
          }
        `,
      })

      await invalid({
        options: [
          {
            ...options,
            fallbackSort: {
              type: 'alphabetical',
              sortBy: 'value',
            },
          },
        ],
        errors: [
          {
            messageId: 'unexpectedObjectTypesOrder',
            data: { right: 'bb', left: 'c' },
          },
        ],
        output: dedent`
          type Type = {
            bb: string;
            c: boolean;
            a: number;
          }
        `,
        code: dedent`
          type Type = {
            c: boolean;
            bb: string;
            a: number;
          }
        `,
      })
    })
  })

  describe('custom', () => {
    let alphabet = Alphabet.generateRecommendedAlphabet()
      .sortByLocaleCompare('en-US')
      .getCharacters()

    let options = {
      type: 'custom',
      order: 'asc',
      alphabet,
    } as const

    it('sorts type members', async () => {
      await valid({
        code: dedent`
          type Type = {
            a: 'aaa'
            b: 'bb'
            c: 'c'
          }
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            messageId: 'unexpectedObjectTypesOrder',
            data: { right: 'b', left: 'c' },
          },
        ],
        output: dedent`
          type Type = {
            a: 'aaa'
            b: 'bb'
            c: 'c'
          }
        `,
        code: dedent`
          type Type = {
            a: 'aaa'
            c: 'c'
            b: 'bb'
          }
        `,
        options: [options],
      })
    })

    it('sorts type members by their value', async () => {
      await valid({
        code: dedent`
          type Type = {
            b: 'a'
            a: 'b'
            c: 'c'
          }
        `,
        options: [
          {
            ...options,
            sortBy: 'value',
          },
        ],
      })
    })
  })

  describe('unsorted', () => {
    let options = {
      type: 'unsorted',
      order: 'asc',
    } as const

    it('does not enforce sorting', async () => {
      await valid({
        code: dedent`
          type Type = {
            b: string;
            c: string;
            a: string;
          }
        `,
        options: [options],
      })

      await valid({
        code: dedent`
          type Type = {
            c: 'c';
            b: 'a';
            a: 'b';
          }
        `,
        options: [
          {
            ...options,
            sortBy: 'value',
          },
        ],
      })
    })

    it('enforces grouping', async () => {
      await invalid({
        options: [
          {
            ...options,
            customGroups: [
              {
                elementNamePattern: '^a',
                groupName: 'a',
              },
              {
                elementNamePattern: '^b',
                groupName: 'b',
              },
            ],
            groups: ['b', 'a'],
          },
        ],
        errors: [
          {
            data: {
              rightGroup: 'b',
              leftGroup: 'a',
              right: 'ba',
              left: 'aa',
            },
            messageId: 'unexpectedObjectTypesGroupOrder',
          },
        ],
        output: dedent`
          type Type = {
            ba: string
            bb: string
            ab: string
            aa: string
          }
        `,
        code: dedent`
          type Type = {
            ab: string
            aa: string
            ba: string
            bb: string
          }
        `,
      })
    })

    it('enforces newlines between', async () => {
      await invalid({
        options: [
          {
            ...options,
            customGroups: [
              {
                elementNamePattern: 'a',
                groupName: 'a',
              },
              {
                elementNamePattern: 'b',
                groupName: 'b',
              },
            ],
            newlinesBetween: 1,
            groups: ['b', 'a'],
          },
        ],
        errors: [
          {
            messageId: 'missedSpacingBetweenObjectTypeMembers',
            data: { right: 'a', left: 'b' },
          },
        ],
        output: dedent`
          type Type = {
            b: string

            a: string
          }
        `,
        code: dedent`
          type Type = {
            b: string
            a: string
          }
        `,
      })
    })
  })

  describe('misc', () => {
    it('ignores semi at the end of value', async () => {
      await valid({
        code: dedent`
          type Type<T> = T extends {
            (...args: any[]): infer R;
            (...args: any[]): infer R;
            (...args: any[]): infer R;
            (...args: any[]): infer R;
          }
            ? R
            : T extends { (...args: any[]): infer R; (...args: any[]): infer R; (...args: any[]): infer R }
            ? R
            : T extends { (...args: any[]): infer R; (...args: any[]): infer R }
            ? R
            : T extends (...args: any[]) => infer R
            ? R
            : any;
        `,
      })
    })

    it('sets alphabetical asc sorting as default', async () => {
      await valid({
        code: dedent`
          type Calculator = {
            log: (x: number) => number,
            log10: (x: number) => number,
            log1p: (x: number) => number,
            log2: (x: number) => number,
          }
        `,
      })

      await valid({
        code: dedent`
          type Calculator = {
            log: (x: number) => number,
            log10: (x: number) => number,
            log1p: (x: number) => number,
            log2: (x: number) => number,
          }
        `,
        options: [{}],
      })

      await invalid({
        output: dedent`
          type Calculator = {
            log: (x: number) => number,
            log10: (x: number) => number,
            log1p: (x: number) => number,
            log2: (x: number) => number,
          }
        `,
        code: dedent`
          type Calculator = {
            log: (x: number) => number,
            log1p: (x: number) => number,
            log2: (x: number) => number,
            log10: (x: number) => number,
          }
        `,
        errors: [
          {
            messageId: 'unexpectedObjectTypesOrder',
            data: { right: 'log10', left: 'log2' },
          },
        ],
      })
    })

    it('handles nested groups with custom groups', async () => {
      await valid({
        options: [
          {
            customGroups: [
              {
                elementValuePattern: 'string',
                groupName: 'strings',
              },
              {
                elementValuePattern: 'number',
                groupName: 'numbers',
              },
            ],
            groups: [['strings', 'numbers'], 'unknown'],
          },
        ],
        code: dedent`
          type Type = {
            a: string
            b: string
            c: number
            d: number
          }
        `,
      })
    })

    it('sorts custom groups by overriding fallbackSort', async () => {
      await invalid({
        options: [
          {
            customGroups: [
              {
                fallbackSort: {
                  type: 'alphabetical',
                  order: 'asc',
                },
                elementNamePattern: '^foo',
                type: 'line-length',
                groupName: 'foo',
                order: 'desc',
              },
            ],
            type: 'alphabetical',
            groups: ['foo'],
            order: 'asc',
          },
        ],
        errors: [
          {
            data: { right: 'fooBar', left: 'fooZar' },
            messageId: 'unexpectedObjectTypesOrder',
          },
        ],
        output: dedent`
          type Type = {
            fooBar: string
            fooZar: string
          }
        `,
        code: dedent`
          type Type = {
            fooZar: string
            fooBar: string
          }
        `,
      })

      await invalid({
        options: [
          {
            customGroups: [
              {
                fallbackSort: {
                  type: 'alphabetical',
                  sortBy: 'value',
                },
                elementValuePattern: '^foo',
                type: 'line-length',
                groupName: 'foo',
              },
            ],
            type: 'alphabetical',
            groups: ['foo'],
            order: 'asc',
          },
        ],
        errors: [
          {
            messageId: 'unexpectedObjectTypesOrder',
            data: { right: 'b', left: 'a' },
          },
        ],
        output: dedent`
          type Type = {
            b: fooBar
            a: fooZar
          }
        `,
        code: dedent`
          type Type = {
            a: fooZar
            b: fooBar
          }
        `,
      })
    })

    it('sorts type members with computed keys without type annotations', async () => {
      await valid({
        code: dedent`
          type Type = {
            [a]
            [b]?
            [c]
          }
        `,
      })

      await invalid({
        errors: [
          {
            messageId: 'unexpectedObjectTypesOrder',
            data: { right: 'b', left: 'c' },
          },
          {
            messageId: 'unexpectedObjectTypesOrder',
            data: { right: 'a', left: 'b' },
          },
        ],
        output: dedent`
          type Type = {
            [a]
            [b]?
            [c]
          }
        `,
        code: dedent`
          type Type = {
            [c]
            [b]?
            [a]
          }
        `,
      })
    })

    it('respects eslint-disable comments', async () => {
      await valid({
        code: dedent`
          type Type = {
            b: string;
            c: string;
            // eslint-disable-next-line
            a: string;
          }
        `,
      })

      await invalid({
        output: dedent`
          type Type = {
            b: string
            c: string
            // eslint-disable-next-line
            a: string
          }
        `,
        code: dedent`
          type Type = {
            c: string
            b: string
            // eslint-disable-next-line
            a: string
          }
        `,
        errors: [
          {
            messageId: 'unexpectedObjectTypesOrder',
            data: { right: 'b', left: 'c' },
          },
        ],
        options: [{}],
      })

      await invalid({
        errors: [
          {
            messageId: 'unexpectedObjectTypesOrder',
            data: { right: 'c', left: 'd' },
          },
          {
            messageId: 'unexpectedObjectTypesOrder',
            data: { right: 'b', left: 'a' },
          },
        ],
        output: dedent`
          type Type = {
            b: string
            c: string
            // eslint-disable-next-line
            a: string
            d: string
          }
        `,
        code: dedent`
          type Type = {
            d: string
            c: string
            // eslint-disable-next-line
            a: string
            b: string
          }
        `,
        options: [
          {
            partitionByComment: true,
          },
        ],
      })

      await invalid({
        output: dedent`
          type Type = {
            b: string
            c: string
            a: string // eslint-disable-line
          }
        `,
        code: dedent`
          type Type = {
            c: string
            b: string
            a: string // eslint-disable-line
          }
        `,
        errors: [
          {
            messageId: 'unexpectedObjectTypesOrder',
            data: { right: 'b', left: 'c' },
          },
        ],
        options: [{}],
      })

      await invalid({
        output: dedent`
          type Type = {
            b: string
            c: string
            /* eslint-disable-next-line */
            a: string
          }
        `,
        code: dedent`
          type Type = {
            c: string
            b: string
            /* eslint-disable-next-line */
            a: string
          }
        `,
        errors: [
          {
            messageId: 'unexpectedObjectTypesOrder',
            data: { right: 'b', left: 'c' },
          },
        ],
        options: [{}],
      })

      await invalid({
        output: dedent`
          type Type = {
            b: string
            c: string
            a: string /* eslint-disable-line */
          }
        `,
        code: dedent`
          type Type = {
            c: string
            b: string
            a: string /* eslint-disable-line */
          }
        `,
        errors: [
          {
            messageId: 'unexpectedObjectTypesOrder',
            data: { right: 'b', left: 'c' },
          },
        ],
        options: [{}],
      })

      await invalid({
        output: dedent`
          type Type = {
            a: string
            d: string
            /* eslint-disable */
            c: string
            b: string
            // Shouldn't move
            /* eslint-enable */
            e: string
          }
        `,
        code: dedent`
          type Type = {
            d: string
            e: string
            /* eslint-disable */
            c: string
            b: string
            // Shouldn't move
            /* eslint-enable */
            a: string
          }
        `,
        errors: [
          {
            messageId: 'unexpectedObjectTypesOrder',
            data: { right: 'a', left: 'b' },
          },
        ],
        options: [{}],
      })

      await invalid({
        output: dedent`
          type Type = {
            b: string
            c: string
            // eslint-disable-next-line rule-to-test/sort-object-types
            a: string
          }
        `,
        code: dedent`
          type Type = {
            c: string
            b: string
            // eslint-disable-next-line rule-to-test/sort-object-types
            a: string
          }
        `,
        errors: [
          {
            messageId: 'unexpectedObjectTypesOrder',
            data: { right: 'b', left: 'c' },
          },
        ],
        options: [{}],
      })

      await invalid({
        output: dedent`
          type Type = {
            b: string
            c: string
            a: string // eslint-disable-line rule-to-test/sort-object-types
          }
        `,
        code: dedent`
          type Type = {
            c: string
            b: string
            a: string // eslint-disable-line rule-to-test/sort-object-types
          }
        `,
        errors: [
          {
            messageId: 'unexpectedObjectTypesOrder',
            data: { right: 'b', left: 'c' },
          },
        ],
        options: [{}],
      })

      await invalid({
        output: dedent`
          type Type = {
            b: string
            c: string
            /* eslint-disable-next-line rule-to-test/sort-object-types */
            a: string
          }
        `,
        code: dedent`
          type Type = {
            c: string
            b: string
            /* eslint-disable-next-line rule-to-test/sort-object-types */
            a: string
          }
        `,
        errors: [
          {
            messageId: 'unexpectedObjectTypesOrder',
            data: { right: 'b', left: 'c' },
          },
        ],
        options: [{}],
      })

      await invalid({
        output: dedent`
          type Type = {
            b: string
            c: string
            a: string /* eslint-disable-line rule-to-test/sort-object-types */
          }
        `,
        code: dedent`
          type Type = {
            c: string
            b: string
            a: string /* eslint-disable-line rule-to-test/sort-object-types */
          }
        `,
        errors: [
          {
            messageId: 'unexpectedObjectTypesOrder',
            data: { right: 'b', left: 'c' },
          },
        ],
        options: [{}],
      })

      await invalid({
        output: dedent`
          type Type = {
            a: string
            d: string
            /* eslint-disable rule-to-test/sort-object-types */
            c: string
            b: string
            // Shouldn't move
            /* eslint-enable */
            e: string
          }
        `,
        code: dedent`
          type Type = {
            d: string
            e: string
            /* eslint-disable rule-to-test/sort-object-types */
            c: string
            b: string
            // Shouldn't move
            /* eslint-enable */
            a: string
          }
        `,
        errors: [
          {
            messageId: 'unexpectedObjectTypesOrder',
            data: { right: 'a', left: 'b' },
          },
        ],
        options: [{}],
      })
    })
  })
})
