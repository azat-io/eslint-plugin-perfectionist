import { createRuleTester } from 'eslint-vitest-rule-tester'
import typescriptParser from '@typescript-eslint/parser'
import { describe, expect, it } from 'vitest'
import dedent from 'dedent'

import { validateRuleJsonSchema } from '../utils/validate-rule-json-schema'
import { Alphabet } from '../../utils/alphabet'
import rule from '../../rules/sort-interfaces'

describe('sort-interfaces', () => {
  let { invalid, valid } = createRuleTester({
    parser: typescriptParser,
    name: 'sort-interfaces',
    rule,
  })

  describe('alphabetical', () => {
    let options = {
      type: 'alphabetical',
      order: 'asc',
    } as const

    it('sorts interface properties', async () => {
      await valid({
        code: dedent`
          interface Interface {
            a: string
          }
        `,
        options: [options],
      })

      await valid({
        code: dedent`
          interface Interface {
            a: string
            b: 'b1' | 'b2',
            c: string
          }
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            data: {
              right: 'b',
              left: 'c',
            },
            messageId: 'unexpectedInterfacePropertiesOrder',
          },
        ],
        output: dedent`
          interface Interface {
            a: string
            b: 'b1' | 'b2',
            c: string
          }
        `,
        code: dedent`
          interface Interface {
            a: string
            c: string
            b: 'b1' | 'b2',
          }
        `,
        options: [options],
      })
    })

    it('works with ts index signature', async () => {
      await valid({
        code: dedent`
          interface Interface {
            [key in Object]: string
            a: 'a'
          }
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            data: {
              right: '[key in Object]',
              left: 'a',
            },
            messageId: 'unexpectedInterfacePropertiesOrder',
          },
        ],
        output: dedent`
          interface Interface {
            [key in Object]: string
            a: 'a'
          }
        `,
        code: dedent`
          interface Interface {
            a: 'a'
            [key in Object]: string
          }
        `,
        options: [options],
      })
    })

    it('sorts multi-word keys by value', async () => {
      await valid({
        code: dedent`
          interface Interface {
            a: Value
            'b-b': string
            c: string
            'd-d': string
          }
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            data: {
              left: 'b-b',
              right: 'a',
            },
            messageId: 'unexpectedInterfacePropertiesOrder',
          },
          {
            data: {
              left: 'd-d',
              right: 'c',
            },
            messageId: 'unexpectedInterfacePropertiesOrder',
          },
        ],
        output: dedent`
          interface Interface {
            a: Value
            'b-b': string
            c: string
            'd-d': string
          }
        `,
        code: dedent`
          interface Interface {
            'b-b': string
            a: Value
            'd-d': string
            c: string
          }
        `,
        options: [options],
      })
    })

    it('works with typescript index signature', async () => {
      await valid({
        code: dedent`
          interface Interface {
            [key: string]: string
            a: string
            b: string
          }
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            data: {
              right: '[key: string]',
              left: 'a',
            },
            messageId: 'unexpectedInterfacePropertiesOrder',
          },
        ],
        output: dedent`
          interface Interface {
            [key: string]: string
            a: string
            b: string
          }
        `,
        code: dedent`
          interface Interface {
            a: string
            [key: string]: string
            b: string
          }
        `,
        options: [options],
      })
    })

    it('works with method and construct signatures', async () => {
      await valid({
        code: dedent`
          interface Interface {
            a: number
            b: () => void
            c(): number
            d: string
            e()
          }
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            data: {
              right: 'a',
              left: 'c',
            },
            messageId: 'unexpectedInterfacePropertiesOrder',
          },
          {
            data: {
              right: 'd',
              left: 'e',
            },
            messageId: 'unexpectedInterfacePropertiesOrder',
          },
        ],
        output: dedent`
          interface Interface {
            a: number
            b: () => void
            c(): number
            d: string
            e()
          }
        `,
        code: dedent`
          interface Interface {
            c(): number
            a: number
            b: () => void
            e()
            d: string
          }
        `,
        options: [options],
      })
    })

    it('works with empty properties with empty values', async () => {
      await valid({
        code: dedent`
          interface Interface {
            [...other]
            [d in D]
            [v in V]?
            a: 10 | 20 | 30
            b: string
          }
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            data: {
              right: '[...other]',
              left: 'a',
            },
            messageId: 'unexpectedInterfacePropertiesOrder',
          },
          {
            data: {
              right: '[v in V]',
              left: 'b',
            },
            messageId: 'unexpectedInterfacePropertiesOrder',
          },
        ],
        output: dedent`
          interface Interface {
            [...other]
            [d in D]
            [v in V]?
            a: 10 | 20 | 30
            b: string
          }
        `,
        code: dedent`
          interface Interface {
            [d in D]
            a: 10 | 20 | 30
            [...other]
            b: string
            [v in V]?
          }
        `,
        options: [options],
      })
    })

    it('does not break interface docs', async () => {
      await invalid({
        errors: [
          {
            data: {
              right: 'a',
              left: 'b',
            },
            messageId: 'unexpectedInterfacePropertiesOrder',
          },
          {
            data: {
              right: 'c',
              left: 'd',
            },
            messageId: 'unexpectedInterfacePropertiesOrder',
          },
        ],
        output: dedent`
          interface Interface {
            /**
             * Comment A
             */
            a: string
            /**
             * Comment B
             */
            b: Array
            /* Comment C */
            c: string | number
            // Comment D
            d: string
          }
        `,
        code: dedent`
          interface Interface {
            /**
             * Comment B
             */
            b: Array
            /**
             * Comment A
             */
            a: string
            // Comment D
            d: string
            /* Comment C */
            c: string | number
          }
        `,
        options: [options],
      })
    })

    it('sorts interfaces with comments on the same line', async () => {
      await invalid({
        errors: [
          {
            data: {
              right: 'a',
              left: 'b',
            },
            messageId: 'unexpectedInterfacePropertiesOrder',
          },
        ],
        output: dedent`
          interface Interface {
            a: string | number // Comment A
            b: string // Comment B
          }
        `,
        code: dedent`
          interface Interface {
            b: string // Comment B
            a: string | number // Comment A
          }
        `,
        options: [options],
      })
    })

    it('sorts interfaces with semi and comments on the same line', async () => {
      await invalid({
        errors: [
          {
            data: {
              right: 'a',
              left: 'b',
            },
            messageId: 'unexpectedInterfacePropertiesOrder',
          },
        ],
        output: dedent`
          interface Interface {
            a: 'aaa'; // Comment A
            b: 'b'; // Comment B
          }
        `,
        code: dedent`
          interface Interface {
            b: 'b'; // Comment B
            a: 'aaa'; // Comment A
          }
        `,
        options: [options],
      })
    })

    it('does not sort call signature declarations', async () => {
      await valid({
        code: dedent`
          interface Interface {
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
          interface Interface {
            new (value: number | string): number;
            new (value: number): unknown;
          }
        `,
        options: [options],
      })

      await valid({
        code: dedent`
          interface Interface {
            new (value: number): unknown;
            new (value: number | string): number;
          }
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
            messageId: 'unexpectedInterfacePropertiesGroupOrder',
          },
          {
            data: {
              rightGroup: 'optional-multiline-member',
              leftGroup: 'index-signature',
              left: '[key: string]',
              right: 'b',
            },
            messageId: 'unexpectedInterfacePropertiesGroupOrder',
          },
          {
            data: {
              leftGroup: 'optional-multiline-member',
              rightGroup: 'required-method',
              right: 'c',
              left: 'b',
            },
            messageId: 'unexpectedInterfacePropertiesGroupOrder',
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
          interface Interface {
            c(): void
            b?: {
              property: string;
            }
            [key: string]: string;
            a: string
          }
        `,
        code: dedent`
          interface Interface {
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

    it('prioritize selectors over modifiers quantity', async () => {
      await invalid({
        errors: [
          {
            data: {
              leftGroup: 'required-property',
              rightGroup: 'method',
              left: 'property',
              right: 'method',
            },
            messageId: 'unexpectedInterfacePropertiesGroupOrder',
          },
        ],
        output: dedent`
          interface Interface {
            method(): void
            property: string
          }
        `,
        code: dedent`
          interface Interface {
            property: string
            method(): void
          }
        `,
        options: [
          {
            ...options,
            groups: ['method', 'required-property'],
          },
        ],
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
            messageId: 'unexpectedInterfacePropertiesGroupOrder',
          },
        ],
        output: dedent`
          interface Interface {
            [key: string]: string;
            member: 'something';
          }
        `,
        code: dedent`
          interface Interface {
            member: 'something';
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
            messageId: 'unexpectedInterfacePropertiesGroupOrder',
          },
        ],
        output: dedent`
          interface Interface {
            method(): string
            member: 'something'
          }
        `,
        code: dedent`
          interface Interface {
            member: 'something'
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
            messageId: 'unexpectedInterfacePropertiesGroupOrder',
          },
        ],
        output: dedent`
          interface Interface {
            property: string
            method(): string
          }
        `,
        code: dedent`
          interface Interface {
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
            messageId: 'unexpectedInterfacePropertiesGroupOrder',
          },
        ],
        output: dedent`
          interface Interface {
            multilineProperty: {
              a: string
            }
            optionalProperty?: string
          }
        `,
        code: dedent`
          interface Interface {
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
            messageId: 'unexpectedInterfacePropertiesGroupOrder',
          },
        ],
        output: dedent`
          interface Interface {
            multilineProperty: {
              a: string
            }
            requiredProperty: string
          }
        `,
        code: dedent`
          interface Interface {
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
            messageId: 'unexpectedInterfacePropertiesGroupOrder',
          },
        ],
        output: dedent`
          interface Interface {
            c: string
            a?: string
            b?: string
          }
        `,
        code: dedent`
          interface Interface {
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
      ['case-insensitive regex', { pattern: 'HELLO', flags: 'i' }],
      ['array with regex', ['noMatch', { pattern: 'HELLO', flags: 'i' }]],
    ])(
      'filters on elementNamePattern - %s',
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
              messageId: 'unexpectedInterfacePropertiesGroupOrder',
            },
          ],
          output: dedent`
            interface Interface {
              helloProperty: string
              a: string
              b: string
              method(): void
            }
          `,
          code: dedent`
            interface Interface {
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
      ['case-insensitive regex', { pattern: 'DATE', flags: 'i' }],
      ['array with regex', ['noMatch', { pattern: 'DATE', flags: 'i' }]],
    ])(
      'filters on elementValuePattern - %s',
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
              messageId: 'unexpectedInterfacePropertiesGroupOrder',
            },
          ],
          output: dedent`
            interface Interface {
              a: number
              z: number
              b: Date
              y: Date
              c(): string
            }
          `,
          code: dedent`
            interface Interface {
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
            data: {
              right: 'bb',
              left: 'a',
            },
            messageId: 'unexpectedInterfacePropertiesOrder',
          },
          {
            data: {
              right: 'ccc',
              left: 'bb',
            },
            messageId: 'unexpectedInterfacePropertiesOrder',
          },
          {
            data: {
              right: 'dddd',
              left: 'ccc',
            },
            messageId: 'unexpectedInterfacePropertiesOrder',
          },
          {
            data: {
              rightGroup: 'reversedPropertiesByLineLength',
              leftGroup: 'unknown',
              left: 'method',
              right: 'eee',
            },
            messageId: 'unexpectedInterfacePropertiesGroupOrder',
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
          interface Interface {
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
          interface Interface {
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
            data: {
              right: 'fooBar',
              left: 'fooZar',
            },
            messageId: 'unexpectedInterfacePropertiesOrder',
          },
        ],
        output: dedent`
          interface Interface {
            fooBar: string
            fooZar: string
          }
        `,
        code: dedent`
          interface Interface {
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
            data: {
              right: 'b',
              left: 'a',
            },
            messageId: 'unexpectedInterfacePropertiesOrder',
          },
        ],
        output: dedent`
          interface Interface {
            b: fooBar
            a: fooZar
          }
        `,
        code: dedent`
          interface Interface {
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
            messageId: 'unexpectedInterfacePropertiesGroupOrder',
          },
          {
            data: {
              right: 'fooA',
              left: 'fooB',
            },
            messageId: 'unexpectedInterfacePropertiesOrder',
          },
          {
            data: {
              rightGroup: 'fooElementsSortedByValue',
              leftGroup: 'unknown',
              right: 'fooMethod',
              left: 'a',
            },
            messageId: 'unexpectedInterfacePropertiesGroupOrder',
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
          interface Interface {
            fooA: Date
            fooC: number
            fooB: string
            fooMethod(): void
            a: string
            z: boolean
          }
        `,
        code: dedent`
          interface Interface {
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
            messageId: 'unexpectedInterfacePropertiesGroupOrder',
          },
        ],
        output: dedent`
          interface Interface {
            b
            a
            d
            e
            c
            method(): void
          }
        `,
        code: dedent`
          interface Interface {
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
            messageId: 'unexpectedInterfacePropertiesGroupOrder',
          },
          {
            data: {
              right: '[key: string]',
              left: 'e',
            },
            messageId: 'unexpectedInterfacePropertiesOrder',
          },
        ],
        output: dedent`
          interface Interface {
            [key: string]: string
            a: string
            d?: () => void
            e: string
            b(): void
            c?: string
          }
        `,
        code: dedent`
          interface Interface {
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
          interface Interface {
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
            data: {
              right: 'b',
              left: 'a',
            },
            messageId: 'missedSpacingBetweenInterfaceMembers',
          },
        ],
        output: dedent`
          interface Interface {
            a

            b
          }
        `,
        code: dedent`
          interface Interface {
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
            data: {
              right: 'b',
              left: 'a',
            },
            messageId: 'extraSpacingBetweenInterfaceMembers',
          },
        ],
        output: dedent`
          interface Interface {
            a
            b
          }
        `,
        code: dedent`
          interface Interface {
            a

            b
          }
        `,
      })
    })

    it('allows to use new line as partition', async () => {
      await valid({
        code: dedent`
          interface Interface {
            e: 'eee'
            f: 'ff'
            g: 'g'

            a: 'aaa'

            b?: 'bbb'
            c: 'cc'
            d: 'd'
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
            data: {
              right: 'e',
              left: 'f',
            },
            messageId: 'unexpectedInterfacePropertiesOrder',
          },
          {
            data: {
              right: 'c',
              left: 'd',
            },
            messageId: 'unexpectedInterfacePropertiesOrder',
          },
        ],
        output: dedent`
          interface Interface {
            e: 'eee'
            f: 'ff'
            g: 'g'

            a: 'aaa'

            b?: 'bbb'
            c: 'cc'
            d: 'd'
          }
        `,
        code: dedent`
          interface Interface {
            f: 'ff'
            e: 'eee'
            g: 'g'

            a: 'aaa'

            b?: 'bbb'
            d: 'd'
            c: 'cc'
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
          interface MyInterface {
            // Part: A
            // Not partition comment
            bbb: string;
            cc: string;
            d: string;
            // Part: B
            aaaa: string;
            e: string;
            // Part: C
            // Not partition comment
            fff: string;
            'gg': string;
          }
        `,
        code: dedent`
          interface MyInterface {
            // Part: A
            cc: string;
            d: string;
            // Not partition comment
            bbb: string;
            // Part: B
            aaaa: string;
            e: string;
            // Part: C
            'gg': string;
            // Not partition comment
            fff: string;
          }
        `,
        errors: [
          {
            data: {
              right: 'bbb',
              left: 'd',
            },
            messageId: 'unexpectedInterfacePropertiesOrder',
          },
          {
            data: {
              right: 'fff',
              left: 'gg',
            },
            messageId: 'unexpectedInterfacePropertiesOrder',
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
          interface MyInterface {
            // Comment
            bb: string;
            // Other comment
            a: string;
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
          interface MyInterface {
            /* Partition Comment */
            // Part: A
            d: string;
            // Part: B
            aaa: string;
            bb: string;
            c: string;
            /* Other */
            e: string;
          }
        `,
        code: dedent`
          interface MyInterface {
            /* Partition Comment */
            // Part: A
            d: string;
            // Part: B
            aaa: string;
            c: string;
            bb: string;
            /* Other */
            e: string;
          }
        `,
        errors: [
          {
            data: {
              right: 'bb',
              left: 'c',
            },
            messageId: 'unexpectedInterfacePropertiesOrder',
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
          interface MyInterface {
            e: string,
            f: string,
            // I am a partition comment because I don't have f o o
            a: string,
            b: string,
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

    it('allows to trim special characters', async () => {
      await valid({
        code: dedent`
          interface MyInterface {
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

    it('ignores block comments when using line partition', async () => {
      await invalid({
        errors: [
          {
            data: {
              right: 'a',
              left: 'b',
            },
            messageId: 'unexpectedInterfacePropertiesOrder',
          },
        ],
        options: [
          {
            ...options,
            partitionByComment: {
              line: true,
            },
          },
        ],
        output: dedent`
          interface Interface {
            /* Comment */
            a: string
            b: string
          }
        `,
        code: dedent`
          interface Interface {
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
          interface Interface {
            b: string
            // Comment
            a: string
          }
        `,
      })
    })

    it('allows to use multiple line partition comments', async () => {
      await valid({
        code: dedent`
          interface Interface {
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

    it('allows to use regex for line partition comments', async () => {
      await valid({
        code: dedent`
          interface Interface {
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

    it('ignores line comments when using block partition', async () => {
      await invalid({
        errors: [
          {
            data: {
              right: 'a',
              left: 'b',
            },
            messageId: 'unexpectedInterfacePropertiesOrder',
          },
        ],
        options: [
          {
            ...options,
            partitionByComment: {
              block: true,
            },
          },
        ],
        output: dedent`
          interface Interface {
            // Comment
            a: string
            b: string
          }
        `,
        code: dedent`
          interface Interface {
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
          interface Interface {
            b: string
            /* Comment */
            a: string
          }
        `,
      })
    })

    it('allows to use multiple block partition comments', async () => {
      await valid({
        code: dedent`
          interface Interface {
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

    it('allows to use regex for block partition comments', async () => {
      await valid({
        code: dedent`
          interface Interface {
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

    it('allows to remove special characters', async () => {
      await valid({
        code: dedent`
          interface MyInterface {
            ab: string
            a_c: string
          }
        `,
        options: [
          {
            ...options,
            specialCharacters: 'remove',
          },
        ],
      })
    })

    it('allows to use locale', async () => {
      await valid({
        code: dedent`
          interface MyInterface {
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
          interface Interface {
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
            data: {
              right: 'y',
              left: 'a',
            },
            messageId: 'extraSpacingBetweenInterfaceMembers',
          },
          {
            data: {
              right: 'b',
              left: 'z',
            },
            messageId: 'unexpectedInterfacePropertiesOrder',
          },
          {
            data: {
              right: 'b',
              left: 'z',
            },
            messageId: 'extraSpacingBetweenInterfaceMembers',
          },
        ],
        code: dedent`
          interface Interface {
            a: () => null,


           y: "y",
          z: "z",

              b: "b",
          }
        `,
        output: dedent`
          interface Interface {
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
            data: {
              right: 'b',
              left: 'a',
            },
            messageId: 'missedSpacingBetweenInterfaceMembers',
          },
          {
            data: {
              right: 'c',
              left: 'b',
            },
            messageId: 'extraSpacingBetweenInterfaceMembers',
          },
          {
            data: {
              right: 'd',
              left: 'c',
            },
            messageId: 'extraSpacingBetweenInterfaceMembers',
          },
        ],
        output: dedent`
          interface Interface {
            a: string

            b: string

            c: string
            d: string


            e: string
          }
        `,
        code: dedent`
          interface Interface {
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
      [2, 0],
      [2, 'ignore'],
      [0, 2],
      ['ignore', 2],
    ])(
      'enforces newlines when global option is %s and group option is %s',
      async (globalNewlinesBetween, groupNewlinesBetween) => {
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
              data: {
                right: 'b',
                left: 'a',
              },
              messageId: 'missedSpacingBetweenInterfaceMembers',
            },
          ],
          output: dedent`
            interface Interface {
              a: string


              b: string
            }
          `,
          code: dedent`
            interface Interface {
              a: string
              b: string
            }
          `,
        })
      },
    )

    it.each([1, 2, 'ignore', 0])(
      'enforces no newline when global option is %s and newlinesBetween: 0 exists between all groups',
      async globalNewlinesBetween => {
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
              data: {
                right: 'b',
                left: 'a',
              },
              messageId: 'extraSpacingBetweenInterfaceMembers',
            },
          ],
          output: dedent`
            interface Interface {
              a: string
              b: string
            }
          `,
          code: dedent`
            interface Interface {
              a: string

              b: string
            }
          `,
        })
      },
    )

    it.each([
      ['ignore', 0],
      [0, 'ignore'],
    ])(
      'does not enforce newline when global option is %s and group option is %s',
      async (globalNewlinesBetween, groupNewlinesBetween) => {
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
            interface Interface {
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
            interface Interface {
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
            messageId: 'unexpectedInterfacePropertiesGroupOrder',
          },
        ],
        output: dedent`
          interface Interface {
            a: string // Comment after

            b: () => void
            c: () => void
          };
        `,
        code: dedent`
          interface Interface {
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

    it('ignores newline fixes between different partitions when newlinesBetween is 0', async () => {
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
        errors: [
          {
            data: {
              right: 'b',
              left: 'c',
            },
            messageId: 'unexpectedInterfacePropertiesOrder',
          },
        ],
        output: dedent`
          interface Interface {
            a

            // Partition comment

            b
            c
          }
        `,
        code: dedent`
          interface Interface {
            a

            // Partition comment

            c
            b
          }
        `,
      })
    })

    it('sorts inline elements correctly', async () => {
      await invalid({
        errors: [
          {
            data: {
              right: 'a',
              left: 'b',
            },
            messageId: 'unexpectedInterfacePropertiesOrder',
          },
        ],
        output: dedent`
          interface Interface {
            a: string; b: string,
          }
        `,
        code: dedent`
          interface Interface {
            b: string, a: string
          }
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            data: {
              right: 'a',
              left: 'b',
            },
            messageId: 'unexpectedInterfacePropertiesOrder',
          },
        ],
        output: dedent`
          interface Interface {
            a: string; b: string,
          }
        `,
        code: dedent`
          interface Interface {
            b: string, a: string;
          }
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            data: {
              right: 'a',
              left: 'b',
            },
            messageId: 'unexpectedInterfacePropertiesOrder',
          },
        ],
        output: dedent`
          interface Interface {
            a: string, b: string,
          }
        `,
        code: dedent`
          interface Interface {
            b: string, a: string,
          }
        `,
        options: [options],
      })
    })

    it.each([
      ['^r|g|b$', '^r|g|b$'],
      ['array with ^r|g|b$', ['noMatch', '^r|g|b$']],
      ['pattern with flags', { pattern: '^R|G|B$', flags: 'i' }],
      [
        'array with pattern and flags',
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
                  elementNamePattern: '^r$',
                  groupName: 'r',
                },
                {
                  elementNamePattern: '^g$',
                  groupName: 'g',
                },
                {
                  elementNamePattern: '^b$',
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
              messageId: 'unexpectedInterfacePropertiesGroupOrder',
            },
            {
              data: {
                rightGroup: 'r',
                leftGroup: 'g',
                right: 'r',
                left: 'g',
              },
              messageId: 'unexpectedInterfacePropertiesGroupOrder',
            },
          ],
          output: dedent`
            interface Interface {
              r: string
              g: string
              b: string
            }
          `,
          code: dedent`
            interface Interface {
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
              declarationMatchesPattern: '^Interface$',
            },
            type: 'unsorted',
          },
          options,
        ],
        code: dedent`
          interface Interface {
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
              declarationMatchesPattern: '^Interface$',
            },
            type: 'unsorted',
          },
          options,
        ],
        errors: [
          {
            data: {
              right: 'a',
              left: 'b',
            },
            messageId: 'unexpectedInterfacePropertiesOrder',
          },
        ],
        output: dedent`
          interface OtherInterface {
            a: string
            b: string
          }
        `,
        code: dedent`
          interface OtherInterface {
            b: string
            a: string
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
          interface Interface {
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
            data: {
              right: 'a',
              left: 'b',
            },
            messageId: 'unexpectedInterfacePropertiesOrder',
          },
        ],
        output: dedent`
          // Do NOT ignore me
          interface Interface {
            a: string
            b: string
          }
        `,
        code: dedent`
          // Do NOT ignore me
          interface Interface {
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
            data: {
              right: 'b',
              left: 'a',
            },
            messageId: 'unexpectedInterfacePropertiesOrder',
          },
        ],
        output: dedent`
          interface Interface {
            b: 'a'
            a: 'b'
          }
        `,
        code: dedent`
          interface Interface {
            a: 'b'
            b: 'a'
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

    it('does not enforce sorting of non-properties in the same group', async () => {
      await invalid({
        errors: [
          {
            data: {
              right: 'a',
              left: 'z',
            },
            messageId: 'unexpectedInterfacePropertiesOrder',
          },
          {
            data: {
              right: 'y',
              left: 'a',
            },
            messageId: 'unexpectedInterfacePropertiesOrder',
          },
        ],
        output: dedent`
          interface Interface {
            y: 'y'
            a(): void
            z: 'z'
          }
        `,
        code: dedent`
          interface Interface {
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
            data: {
              right: '[key: string]',
              left: 'z',
            },
            messageId: 'unexpectedInterfacePropertiesOrder',
          },
          {
            data: {
              left: '[key: string]',
              right: 'y',
            },
            messageId: 'unexpectedInterfacePropertiesOrder',
          },
        ],
        output: dedent`
          interface Interface {
            y: 'y'
            [key: string]
            z: 'z'
          }
        `,
        code: dedent`
          interface Interface {
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
              rightGroup: 'method',
              leftGroup: 'unknown',
              right: 'a',
              left: 'z',
            },
            messageId: 'unexpectedInterfacePropertiesGroupOrder',
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
          interface Interface {
            b(): void
            a(): void
            z: 'z'
          }
        `,
        code: dedent`
          interface Interface {
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

    it('sorts interface properties', async () => {
      await valid({
        code: dedent`
          interface Interface {
            a: string
          }
        `,
        options: [options],
      })

      await valid({
        code: dedent`
          interface Interface {
            a: string
            b: 'b1' | 'b2',
            c: string
          }
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            data: {
              right: 'b',
              left: 'c',
            },
            messageId: 'unexpectedInterfacePropertiesOrder',
          },
        ],
        output: dedent`
          interface Interface {
            a: string
            b: 'b1' | 'b2',
            c: string
          }
        `,
        code: dedent`
          interface Interface {
            a: string
            c: string
            b: 'b1' | 'b2',
          }
        `,
        options: [options],
      })
    })

    it('works with ts index signature', async () => {
      await valid({
        code: dedent`
          interface Interface {
            [key in Object]: string
            a: 'a'
          }
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            data: {
              right: '[key in Object]',
              left: 'a',
            },
            messageId: 'unexpectedInterfacePropertiesOrder',
          },
        ],
        output: dedent`
          interface Interface {
            [key in Object]: string
            a: 'a'
          }
        `,
        code: dedent`
          interface Interface {
            a: 'a'
            [key in Object]: string
          }
        `,
        options: [options],
      })
    })

    it('sorts multi-word keys by value', async () => {
      await valid({
        code: dedent`
          interface Interface {
            a: Value
            'b-b': string
            c: string
            'd-d': string
          }
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            data: {
              left: 'b-b',
              right: 'a',
            },
            messageId: 'unexpectedInterfacePropertiesOrder',
          },
          {
            data: {
              left: 'd-d',
              right: 'c',
            },
            messageId: 'unexpectedInterfacePropertiesOrder',
          },
        ],
        output: dedent`
          interface Interface {
            a: Value
            'b-b': string
            c: string
            'd-d': string
          }
        `,
        code: dedent`
          interface Interface {
            'b-b': string
            a: Value
            'd-d': string
            c: string
          }
        `,
        options: [options],
      })
    })

    it('works with typescript index signature', async () => {
      await valid({
        code: dedent`
          interface Interface {
            [key: string]: string
            a: string
            b: string
          }
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            data: {
              right: '[key: string]',
              left: 'a',
            },
            messageId: 'unexpectedInterfacePropertiesOrder',
          },
        ],
        output: dedent`
          interface Interface {
            [key: string]: string
            a: string
            b: string
          }
        `,
        code: dedent`
          interface Interface {
            a: string
            [key: string]: string
            b: string
          }
        `,
        options: [options],
      })
    })

    it('works with method and construct signatures', async () => {
      await valid({
        code: dedent`
          interface Interface {
            a: number
            b: () => void
            c(): number
            d: string
            e()
          }
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            data: {
              right: 'a',
              left: 'c',
            },
            messageId: 'unexpectedInterfacePropertiesOrder',
          },
          {
            data: {
              right: 'd',
              left: 'e',
            },
            messageId: 'unexpectedInterfacePropertiesOrder',
          },
        ],
        output: dedent`
          interface Interface {
            a: number
            b: () => void
            c(): number
            d: string
            e()
          }
        `,
        code: dedent`
          interface Interface {
            c(): number
            a: number
            b: () => void
            e()
            d: string
          }
        `,
        options: [options],
      })
    })

    it('works with empty properties with empty values', async () => {
      await valid({
        code: dedent`
          interface Interface {
            [...other]
            [d in D]
            [v in V]?
            a: 10 | 20 | 30
            b: string
          }
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            data: {
              right: '[...other]',
              left: 'a',
            },
            messageId: 'unexpectedInterfacePropertiesOrder',
          },
          {
            data: {
              right: '[v in V]',
              left: 'b',
            },
            messageId: 'unexpectedInterfacePropertiesOrder',
          },
        ],
        output: dedent`
          interface Interface {
            [...other]
            [d in D]
            [v in V]?
            a: 10 | 20 | 30
            b: string
          }
        `,
        code: dedent`
          interface Interface {
            [d in D]
            a: 10 | 20 | 30
            [...other]
            b: string
            [v in V]?
          }
        `,
        options: [options],
      })
    })

    it('does not break interface docs', async () => {
      await invalid({
        errors: [
          {
            data: {
              right: 'a',
              left: 'b',
            },
            messageId: 'unexpectedInterfacePropertiesOrder',
          },
          {
            data: {
              right: 'c',
              left: 'd',
            },
            messageId: 'unexpectedInterfacePropertiesOrder',
          },
        ],
        output: dedent`
          interface Interface {
            /**
             * Comment A
             */
            a: string
            /**
             * Comment B
             */
            b: Array
            /* Comment C */
            c: string | number
            // Comment D
            d: string
          }
        `,
        code: dedent`
          interface Interface {
            /**
             * Comment B
             */
            b: Array
            /**
             * Comment A
             */
            a: string
            // Comment D
            d: string
            /* Comment C */
            c: string | number
          }
        `,
        options: [options],
      })
    })

    it('sorts interfaces with comments on the same line', async () => {
      await invalid({
        errors: [
          {
            data: {
              right: 'a',
              left: 'b',
            },
            messageId: 'unexpectedInterfacePropertiesOrder',
          },
        ],
        output: dedent`
          interface Interface {
            a: string | number // Comment A
            b: string // Comment B
          }
        `,
        code: dedent`
          interface Interface {
            b: string // Comment B
            a: string | number // Comment A
          }
        `,
        options: [options],
      })
    })

    it('sorts interfaces with semi and comments on the same line', async () => {
      await invalid({
        errors: [
          {
            data: {
              right: 'a',
              left: 'b',
            },
            messageId: 'unexpectedInterfacePropertiesOrder',
          },
        ],
        output: dedent`
          interface Interface {
            a: 'aaa'; // Comment A
            b: 'b'; // Comment B
          }
        `,
        code: dedent`
          interface Interface {
            b: 'b'; // Comment B
            a: 'aaa'; // Comment A
          }
        `,
        options: [options],
      })
    })

    it('does not sort call signature declarations', async () => {
      await valid({
        code: dedent`
          interface Interface {
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
          interface Interface {
            new (value: number | string): number;
            new (value: number): unknown;
          }
        `,
        options: [options],
      })

      await valid({
        code: dedent`
          interface Interface {
            new (value: number): unknown;
            new (value: number | string): number;
          }
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
            messageId: 'unexpectedInterfacePropertiesGroupOrder',
          },
          {
            data: {
              rightGroup: 'optional-multiline-member',
              leftGroup: 'index-signature',
              left: '[key: string]',
              right: 'b',
            },
            messageId: 'unexpectedInterfacePropertiesGroupOrder',
          },
          {
            data: {
              leftGroup: 'optional-multiline-member',
              rightGroup: 'required-method',
              right: 'c',
              left: 'b',
            },
            messageId: 'unexpectedInterfacePropertiesGroupOrder',
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
          interface Interface {
            c(): void
            b?: {
              property: string;
            }
            [key: string]: string;
            a: string
          }
        `,
        code: dedent`
          interface Interface {
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

    it('prioritize selectors over modifiers quantity', async () => {
      await invalid({
        errors: [
          {
            data: {
              leftGroup: 'required-property',
              rightGroup: 'method',
              left: 'property',
              right: 'method',
            },
            messageId: 'unexpectedInterfacePropertiesGroupOrder',
          },
        ],
        output: dedent`
          interface Interface {
            method(): void
            property: string
          }
        `,
        code: dedent`
          interface Interface {
            property: string
            method(): void
          }
        `,
        options: [
          {
            ...options,
            groups: ['method', 'required-property'],
          },
        ],
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
            messageId: 'unexpectedInterfacePropertiesGroupOrder',
          },
        ],
        output: dedent`
          interface Interface {
            [key: string]: string;
            member: 'something'
          }
        `,
        code: dedent`
          interface Interface {
            member: 'something'
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
            messageId: 'unexpectedInterfacePropertiesGroupOrder',
          },
        ],
        output: dedent`
          interface Interface {
            method(): string
            member: 'something'
          }
        `,
        code: dedent`
          interface Interface {
            member: 'something'
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
            messageId: 'unexpectedInterfacePropertiesGroupOrder',
          },
        ],
        output: dedent`
          interface Interface {
            property: string
            method(): string
          }
        `,
        code: dedent`
          interface Interface {
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
            messageId: 'unexpectedInterfacePropertiesGroupOrder',
          },
        ],
        output: dedent`
          interface Interface {
            multilineProperty: {
              a: string
            }
            optionalProperty?: string
          }
        `,
        code: dedent`
          interface Interface {
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
            messageId: 'unexpectedInterfacePropertiesGroupOrder',
          },
        ],
        output: dedent`
          interface Interface {
            multilineProperty: {
              a: string
            }
            requiredProperty: string
          }
        `,
        code: dedent`
          interface Interface {
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
            messageId: 'unexpectedInterfacePropertiesGroupOrder',
          },
        ],
        output: dedent`
          interface Interface {
            c: string
            a?: string
            b?: string
          }
        `,
        code: dedent`
          interface Interface {
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
      ['case-insensitive regex', { pattern: 'HELLO', flags: 'i' }],
      ['array with regex', ['noMatch', { pattern: 'HELLO', flags: 'i' }]],
    ])(
      'filters on elementNamePattern - %s',
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
              messageId: 'unexpectedInterfacePropertiesGroupOrder',
            },
          ],
          output: dedent`
            interface Interface {
              helloProperty: string
              a: string
              b: string
              method(): void
            }
          `,
          code: dedent`
            interface Interface {
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
      ['case-insensitive regex', { pattern: 'DATE', flags: 'i' }],
      ['array with regex', ['noMatch', { pattern: 'DATE', flags: 'i' }]],
    ])(
      'filters on elementValuePattern - %s',
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
              messageId: 'unexpectedInterfacePropertiesGroupOrder',
            },
          ],
          output: dedent`
            interface Interface {
              a: number
              z: number
              b: Date
              y: Date
              c(): string
            }
          `,
          code: dedent`
            interface Interface {
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
            data: {
              right: 'bb',
              left: 'a',
            },
            messageId: 'unexpectedInterfacePropertiesOrder',
          },
          {
            data: {
              right: 'ccc',
              left: 'bb',
            },
            messageId: 'unexpectedInterfacePropertiesOrder',
          },
          {
            data: {
              right: 'dddd',
              left: 'ccc',
            },
            messageId: 'unexpectedInterfacePropertiesOrder',
          },
          {
            data: {
              rightGroup: 'reversedPropertiesByLineLength',
              leftGroup: 'unknown',
              left: 'method',
              right: 'eee',
            },
            messageId: 'unexpectedInterfacePropertiesGroupOrder',
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
          interface Interface {
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
          interface Interface {
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
            data: {
              right: 'fooBar',
              left: 'fooZar',
            },
            messageId: 'unexpectedInterfacePropertiesOrder',
          },
        ],
        output: dedent`
          interface Interface {
            fooBar: string
            fooZar: string
          }
        `,
        code: dedent`
          interface Interface {
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
            data: {
              right: 'b',
              left: 'a',
            },
            messageId: 'unexpectedInterfacePropertiesOrder',
          },
        ],
        output: dedent`
          interface Interface {
            b: fooBar
            a: fooZar
          }
        `,
        code: dedent`
          interface Interface {
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
            messageId: 'unexpectedInterfacePropertiesGroupOrder',
          },
          {
            data: {
              right: 'fooA',
              left: 'fooB',
            },
            messageId: 'unexpectedInterfacePropertiesOrder',
          },
          {
            data: {
              rightGroup: 'fooElementsSortedByValue',
              leftGroup: 'unknown',
              right: 'fooMethod',
              left: 'a',
            },
            messageId: 'unexpectedInterfacePropertiesGroupOrder',
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
          interface Interface {
            fooA: Date
            fooC: number
            fooB: string
            fooMethod(): void
            a: string
            z: boolean
          }
        `,
        code: dedent`
          interface Interface {
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
            messageId: 'unexpectedInterfacePropertiesGroupOrder',
          },
        ],
        output: dedent`
          interface Interface {
            b
            a
            d
            e
            c
            method(): void
          }
        `,
        code: dedent`
          interface Interface {
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
            messageId: 'unexpectedInterfacePropertiesGroupOrder',
          },
          {
            data: {
              right: '[key: string]',
              left: 'e',
            },
            messageId: 'unexpectedInterfacePropertiesOrder',
          },
        ],
        output: dedent`
          interface Interface {
            [key: string]: string
            a: string
            d?: () => void
            e: string
            b(): void
            c?: string
          }
        `,
        code: dedent`
          interface Interface {
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
          interface Interface {
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
            data: {
              right: 'b',
              left: 'a',
            },
            messageId: 'missedSpacingBetweenInterfaceMembers',
          },
        ],
        output: dedent`
          interface Interface {
            a

            b
          }
        `,
        code: dedent`
          interface Interface {
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
            data: {
              right: 'b',
              left: 'a',
            },
            messageId: 'extraSpacingBetweenInterfaceMembers',
          },
        ],
        output: dedent`
          interface Interface {
            a
            b
          }
        `,
        code: dedent`
          interface Interface {
            a

            b
          }
        `,
      })
    })

    it('allows to use new line as partition', async () => {
      await valid({
        code: dedent`
          interface Interface {
            e: 'eee'
            f: 'ff'
            g: 'g'

            a: 'aaa'

            b?: 'bbb'
            c: 'cc'
            d: 'd'
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
            data: {
              right: 'e',
              left: 'f',
            },
            messageId: 'unexpectedInterfacePropertiesOrder',
          },
          {
            data: {
              right: 'c',
              left: 'd',
            },
            messageId: 'unexpectedInterfacePropertiesOrder',
          },
        ],
        output: dedent`
          interface Interface {
            e: 'eee'
            f: 'ff'
            g: 'g'

            a: 'aaa'

            b?: 'bbb'
            c: 'cc'
            d: 'd'
          }
        `,
        code: dedent`
          interface Interface {
            f: 'ff'
            e: 'eee'
            g: 'g'

            a: 'aaa'

            b?: 'bbb'
            d: 'd'
            c: 'cc'
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
          interface MyInterface {
            // Part: A
            // Not partition comment
            bbb: string;
            cc: string;
            d: string;
            // Part: B
            aaaa: string;
            e: string;
            // Part: C
            // Not partition comment
            fff: string;
            'gg': string;
          }
        `,
        code: dedent`
          interface MyInterface {
            // Part: A
            cc: string;
            d: string;
            // Not partition comment
            bbb: string;
            // Part: B
            aaaa: string;
            e: string;
            // Part: C
            'gg': string;
            // Not partition comment
            fff: string;
          }
        `,
        errors: [
          {
            data: {
              right: 'bbb',
              left: 'd',
            },
            messageId: 'unexpectedInterfacePropertiesOrder',
          },
          {
            data: {
              right: 'fff',
              left: 'gg',
            },
            messageId: 'unexpectedInterfacePropertiesOrder',
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
          interface MyInterface {
            // Comment
            bb: string;
            // Other comment
            a: string;
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
          interface MyInterface {
            /* Partition Comment */
            // Part: A
            d: string;
            // Part: B
            aaa: string;
            bb: string;
            c: string;
            /* Other */
            e: string;
          }
        `,
        code: dedent`
          interface MyInterface {
            /* Partition Comment */
            // Part: A
            d: string;
            // Part: B
            aaa: string;
            c: string;
            bb: string;
            /* Other */
            e: string;
          }
        `,
        errors: [
          {
            data: {
              right: 'bb',
              left: 'c',
            },
            messageId: 'unexpectedInterfacePropertiesOrder',
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
          interface MyInterface {
            e: string,
            f: string,
            // I am a partition comment because I don't have f o o
            a: string,
            b: string,
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

    it('allows to trim special characters', async () => {
      await valid({
        code: dedent`
          interface MyInterface {
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

    it('ignores block comments when using line partition', async () => {
      await invalid({
        errors: [
          {
            data: {
              right: 'a',
              left: 'b',
            },
            messageId: 'unexpectedInterfacePropertiesOrder',
          },
        ],
        options: [
          {
            ...options,
            partitionByComment: {
              line: true,
            },
          },
        ],
        output: dedent`
          interface Interface {
            /* Comment */
            a: string
            b: string
          }
        `,
        code: dedent`
          interface Interface {
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
          interface Interface {
            b: string
            // Comment
            a: string
          }
        `,
      })
    })

    it('allows to use multiple line partition comments', async () => {
      await valid({
        code: dedent`
          interface Interface {
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

    it('allows to use regex for line partition comments', async () => {
      await valid({
        code: dedent`
          interface Interface {
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

    it('ignores line comments when using block partition', async () => {
      await invalid({
        errors: [
          {
            data: {
              right: 'a',
              left: 'b',
            },
            messageId: 'unexpectedInterfacePropertiesOrder',
          },
        ],
        options: [
          {
            ...options,
            partitionByComment: {
              block: true,
            },
          },
        ],
        output: dedent`
          interface Interface {
            // Comment
            a: string
            b: string
          }
        `,
        code: dedent`
          interface Interface {
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
          interface Interface {
            b: string
            /* Comment */
            a: string
          }
        `,
      })
    })

    it('allows to use multiple block partition comments', async () => {
      await valid({
        code: dedent`
          interface Interface {
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

    it('allows to use regex for block partition comments', async () => {
      await valid({
        code: dedent`
          interface Interface {
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

    it('allows to remove special characters', async () => {
      await valid({
        code: dedent`
          interface MyInterface {
            ab: string
            a_c: string
          }
        `,
        options: [
          {
            ...options,
            specialCharacters: 'remove',
          },
        ],
      })
    })

    it('allows to use locale', async () => {
      await valid({
        code: dedent`
          interface MyInterface {
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
          interface Interface {
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
            data: {
              right: 'y',
              left: 'a',
            },
            messageId: 'extraSpacingBetweenInterfaceMembers',
          },
          {
            data: {
              right: 'b',
              left: 'z',
            },
            messageId: 'unexpectedInterfacePropertiesOrder',
          },
          {
            data: {
              right: 'b',
              left: 'z',
            },
            messageId: 'extraSpacingBetweenInterfaceMembers',
          },
        ],
        code: dedent`
          interface Interface {
            a: () => null,


           y: "y",
          z: "z",

              b: "b",
          }
        `,
        output: dedent`
          interface Interface {
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
            data: {
              right: 'b',
              left: 'a',
            },
            messageId: 'missedSpacingBetweenInterfaceMembers',
          },
          {
            data: {
              right: 'c',
              left: 'b',
            },
            messageId: 'extraSpacingBetweenInterfaceMembers',
          },
          {
            data: {
              right: 'd',
              left: 'c',
            },
            messageId: 'extraSpacingBetweenInterfaceMembers',
          },
        ],
        output: dedent`
          interface Interface {
            a: string

            b: string

            c: string
            d: string


            e: string
          }
        `,
        code: dedent`
          interface Interface {
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
      [2, 0],
      [2, 'ignore'],
      [0, 2],
      ['ignore', 2],
    ])(
      'enforces newlines when global option is %s and group option is %s',
      async (globalNewlinesBetween, groupNewlinesBetween) => {
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
              data: {
                right: 'b',
                left: 'a',
              },
              messageId: 'missedSpacingBetweenInterfaceMembers',
            },
          ],
          output: dedent`
            interface Interface {
              a: string


              b: string
            }
          `,
          code: dedent`
            interface Interface {
              a: string
              b: string
            }
          `,
        })
      },
    )

    it.each([1, 2, 'ignore', 0])(
      'enforces no newline when global option is %s and newlinesBetween: 0 exists between all groups',
      async globalNewlinesBetween => {
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
              data: {
                right: 'b',
                left: 'a',
              },
              messageId: 'extraSpacingBetweenInterfaceMembers',
            },
          ],
          output: dedent`
            interface Interface {
              a: string
              b: string
            }
          `,
          code: dedent`
            interface Interface {
              a: string

              b: string
            }
          `,
        })
      },
    )

    it.each([
      ['ignore', 0],
      [0, 'ignore'],
    ])(
      'does not enforce newline when global option is %s and group option is %s',
      async (globalNewlinesBetween, groupNewlinesBetween) => {
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
            interface Interface {
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
            interface Interface {
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
            messageId: 'unexpectedInterfacePropertiesGroupOrder',
          },
        ],
        output: dedent`
          interface Interface {
            a: string // Comment after

            b: () => void
            c: () => void
          };
        `,
        code: dedent`
          interface Interface {
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

    it('ignores newline fixes between different partitions when newlinesBetween is 0', async () => {
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
        errors: [
          {
            data: {
              right: 'b',
              left: 'c',
            },
            messageId: 'unexpectedInterfacePropertiesOrder',
          },
        ],
        output: dedent`
          interface Interface {
            a

            // Partition comment

            b
            c
          }
        `,
        code: dedent`
          interface Interface {
            a

            // Partition comment

            c
            b
          }
        `,
      })
    })

    it('sorts inline elements correctly', async () => {
      await invalid({
        errors: [
          {
            data: {
              right: 'a',
              left: 'b',
            },
            messageId: 'unexpectedInterfacePropertiesOrder',
          },
        ],
        output: dedent`
          interface Interface {
            a: string; b: string,
          }
        `,
        code: dedent`
          interface Interface {
            b: string, a: string
          }
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            data: {
              right: 'a',
              left: 'b',
            },
            messageId: 'unexpectedInterfacePropertiesOrder',
          },
        ],
        output: dedent`
          interface Interface {
            a: string; b: string,
          }
        `,
        code: dedent`
          interface Interface {
            b: string, a: string;
          }
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            data: {
              right: 'a',
              left: 'b',
            },
            messageId: 'unexpectedInterfacePropertiesOrder',
          },
        ],
        output: dedent`
          interface Interface {
            a: string, b: string,
          }
        `,
        code: dedent`
          interface Interface {
            b: string, a: string,
          }
        `,
        options: [options],
      })
    })

    it.each([
      ['^r|g|b$', '^r|g|b$'],
      ['array with ^r|g|b$', ['noMatch', '^r|g|b$']],
      ['pattern with flags', { pattern: '^R|G|B$', flags: 'i' }],
      [
        'array with pattern and flags',
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
                  elementNamePattern: '^r$',
                  groupName: 'r',
                },
                {
                  elementNamePattern: '^g$',
                  groupName: 'g',
                },
                {
                  elementNamePattern: '^b$',
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
              messageId: 'unexpectedInterfacePropertiesGroupOrder',
            },
            {
              data: {
                rightGroup: 'r',
                leftGroup: 'g',
                right: 'r',
                left: 'g',
              },
              messageId: 'unexpectedInterfacePropertiesGroupOrder',
            },
          ],
          output: dedent`
            interface Interface {
              r: string
              g: string
              b: string
            }
          `,
          code: dedent`
            interface Interface {
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
              declarationMatchesPattern: '^Interface$',
            },
            type: 'unsorted',
          },
          options,
        ],
        code: dedent`
          interface Interface {
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
              declarationMatchesPattern: '^Interface$',
            },
            type: 'unsorted',
          },
          options,
        ],
        errors: [
          {
            data: {
              right: 'a',
              left: 'b',
            },
            messageId: 'unexpectedInterfacePropertiesOrder',
          },
        ],
        output: dedent`
          interface OtherInterface {
            a: string
            b: string
          }
        `,
        code: dedent`
          interface OtherInterface {
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
            data: {
              right: 'b',
              left: 'a',
            },
            messageId: 'unexpectedInterfacePropertiesOrder',
          },
        ],
        output: dedent`
          interface Interface {
            b: 'a'
            a: 'b'
          }
        `,
        code: dedent`
          interface Interface {
            a: 'b'
            b: 'a'
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

    it('does not enforce sorting of non-properties in the same group', async () => {
      await invalid({
        errors: [
          {
            data: {
              right: 'a',
              left: 'z',
            },
            messageId: 'unexpectedInterfacePropertiesOrder',
          },
          {
            data: {
              right: 'y',
              left: 'a',
            },
            messageId: 'unexpectedInterfacePropertiesOrder',
          },
        ],
        output: dedent`
          interface Interface {
            y: 'y'
            a(): void
            z: 'z'
          }
        `,
        code: dedent`
          interface Interface {
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
            data: {
              right: '[key: string]',
              left: 'z',
            },
            messageId: 'unexpectedInterfacePropertiesOrder',
          },
          {
            data: {
              left: '[key: string]',
              right: 'y',
            },
            messageId: 'unexpectedInterfacePropertiesOrder',
          },
        ],
        output: dedent`
          interface Interface {
            y: 'y'
            [key: string]
            z: 'z'
          }
        `,
        code: dedent`
          interface Interface {
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
              rightGroup: 'method',
              leftGroup: 'unknown',
              right: 'a',
              left: 'z',
            },
            messageId: 'unexpectedInterfacePropertiesGroupOrder',
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
          interface Interface {
            b(): void
            a(): void
            z: 'z'
          }
        `,
        code: dedent`
          interface Interface {
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

    it('sorts interface properties', async () => {
      await valid({
        code: dedent`
          interface Interface {
            a: string
          }
        `,
        options: [options],
      })

      await valid({
        code: dedent`
          interface Interface {
            b: 'b1' | 'b2',
            a: string
            c: string
          }
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            data: {
              right: 'b',
              left: 'c',
            },
            messageId: 'unexpectedInterfacePropertiesOrder',
          },
        ],
        output: dedent`
          interface Interface {
            b: 'b1' | 'b2',
            a: string
            c: string
          }
        `,
        code: dedent`
          interface Interface {
            a: string
            c: string
            b: 'b1' | 'b2',
          }
        `,
        options: [options],
      })
    })

    it('works with ts index signature', async () => {
      await valid({
        code: dedent`
          interface Interface {
            [key in Object]: string
            a: 'a'
          }
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            data: {
              right: '[key in Object]',
              left: 'a',
            },
            messageId: 'unexpectedInterfacePropertiesOrder',
          },
        ],
        output: dedent`
          interface Interface {
            [key in Object]: string
            a: 'a'
          }
        `,
        code: dedent`
          interface Interface {
            a: 'a'
            [key in Object]: string
          }
        `,
        options: [options],
      })
    })

    it('sorts multi-word keys by value', async () => {
      await valid({
        code: dedent`
          interface Interface {
            'b-b': string
            'd-d': string
            c: string
            a: Value
          }
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            data: {
              right: 'd-d',
              left: 'a',
            },
            messageId: 'unexpectedInterfacePropertiesOrder',
          },
        ],
        output: dedent`
          interface Interface {
            'b-b': string
            'd-d': string
            c: string
            a: Value
          }
        `,
        code: dedent`
          interface Interface {
            'b-b': string
            a: Value
            'd-d': string
            c: string
          }
        `,
        options: [options],
      })
    })

    it('works with typescript index signature', async () => {
      await valid({
        code: dedent`
          interface Interface {
            [key: string]: string
            a: string
            b: string
          }
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            data: {
              right: '[key: string]',
              left: 'a',
            },
            messageId: 'unexpectedInterfacePropertiesOrder',
          },
        ],
        output: dedent`
          interface Interface {
            [key: string]: string
            a: string
            b: string
          }
        `,
        code: dedent`
          interface Interface {
            a: string
            [key: string]: string
            b: string
          }
        `,
        options: [options],
      })
    })

    it('works with method and construct signatures', async () => {
      await valid({
        code: dedent`
          interface Interface {
            b: () => void
            c(): number
            d: string
            a: number
            e()
          }
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            data: {
              right: 'b',
              left: 'a',
            },
            messageId: 'unexpectedInterfacePropertiesOrder',
          },
          {
            data: {
              right: 'd',
              left: 'e',
            },
            messageId: 'unexpectedInterfacePropertiesOrder',
          },
        ],
        output: dedent`
          interface Interface {
            b: () => void
            c(): number
            a: number
            d: string
            e()
          }
        `,
        code: dedent`
          interface Interface {
            c(): number
            a: number
            b: () => void
            e()
            d: string
          }
        `,
        options: [options],
      })
    })

    it('works with empty properties with empty values', async () => {
      await valid({
        code: dedent`
          interface Interface {
            a: 10 | 20 | 30
            [...other]
            b: string
            [v in V]?
            [d in D]
          }
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            data: {
              left: '[d in D]',
              right: 'a',
            },
            messageId: 'unexpectedInterfacePropertiesOrder',
          },
        ],
        output: dedent`
          interface Interface {
            a: 10 | 20 | 30
            [...other]
            b: string
            [v in V]?
            [d in D]
          }
        `,
        code: dedent`
          interface Interface {
            [d in D]
            a: 10 | 20 | 30
            [...other]
            b: string
            [v in V]?
          }
        `,
        options: [options],
      })
    })

    it('does not break interface docs', async () => {
      await invalid({
        errors: [
          {
            data: {
              right: 'a',
              left: 'b',
            },
            messageId: 'unexpectedInterfacePropertiesOrder',
          },
          {
            data: {
              right: 'c',
              left: 'd',
            },
            messageId: 'unexpectedInterfacePropertiesOrder',
          },
        ],
        output: dedent`
          interface Interface {
            /* Comment C */
            c: string | number
            /**
             * Comment A
             */
            a: string
            // Comment D
            d: string
            /**
             * Comment B
             */
            b: Array
          }
        `,
        code: dedent`
          interface Interface {
            /**
             * Comment B
             */
            b: Array
            /**
             * Comment A
             */
            a: string
            // Comment D
            d: string
            /* Comment C */
            c: string | number
          }
        `,
        options: [options],
      })
    })

    it('sorts interfaces with comments on the same line', async () => {
      await invalid({
        errors: [
          {
            data: {
              right: 'a',
              left: 'b',
            },
            messageId: 'unexpectedInterfacePropertiesOrder',
          },
        ],
        output: dedent`
          interface Interface {
            a: string | number // Comment A
            b: string // Comment B
          }
        `,
        code: dedent`
          interface Interface {
            b: string // Comment B
            a: string | number // Comment A
          }
        `,
        options: [options],
      })
    })

    it('sorts interfaces with semi and comments on the same line', async () => {
      await invalid({
        errors: [
          {
            data: {
              right: 'a',
              left: 'b',
            },
            messageId: 'unexpectedInterfacePropertiesOrder',
          },
        ],
        output: dedent`
          interface Interface {
            a: 'aaa'; // Comment A
            b: 'b'; // Comment B
          }
        `,
        code: dedent`
          interface Interface {
            b: 'b'; // Comment B
            a: 'aaa'; // Comment A
          }
        `,
        options: [options],
      })
    })

    it('does not sort call signature declarations', async () => {
      await valid({
        code: dedent`
          interface Interface {
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
          interface Interface {
            new (value: number | string): number;
            new (value: number): unknown;
          }
        `,
        options: [options],
      })

      await valid({
        code: dedent`
          interface Interface {
            new (value: number): unknown;
            new (value: number | string): number;
          }
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
            messageId: 'unexpectedInterfacePropertiesGroupOrder',
          },
          {
            data: {
              rightGroup: 'optional-multiline-member',
              leftGroup: 'index-signature',
              left: '[key: string]',
              right: 'b',
            },
            messageId: 'unexpectedInterfacePropertiesGroupOrder',
          },
          {
            data: {
              leftGroup: 'optional-multiline-member',
              rightGroup: 'required-method',
              right: 'c',
              left: 'b',
            },
            messageId: 'unexpectedInterfacePropertiesGroupOrder',
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
          interface Interface {
            c(): void
            b?: {
              property: string;
            }
            [key: string]: string;
            a: string
          }
        `,
        code: dedent`
          interface Interface {
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

    it('prioritize selectors over modifiers quantity', async () => {
      await invalid({
        errors: [
          {
            data: {
              leftGroup: 'required-property',
              rightGroup: 'method',
              left: 'property',
              right: 'method',
            },
            messageId: 'unexpectedInterfacePropertiesGroupOrder',
          },
        ],
        output: dedent`
          interface Interface {
            method(): void
            property: string
          }
        `,
        code: dedent`
          interface Interface {
            property: string
            method(): void
          }
        `,
        options: [
          {
            ...options,
            groups: ['method', 'required-property'],
          },
        ],
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
            messageId: 'unexpectedInterfacePropertiesGroupOrder',
          },
        ],
        output: dedent`
          interface Interface {
            [key: string]: string;
            member: 'something'
          }
        `,
        code: dedent`
          interface Interface {
            member: 'something'
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
            messageId: 'unexpectedInterfacePropertiesGroupOrder',
          },
        ],
        output: dedent`
          interface Interface {
            method(): string
            member: "something"
          }
        `,
        code: dedent`
          interface Interface {
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
            messageId: 'unexpectedInterfacePropertiesGroupOrder',
          },
        ],
        output: dedent`
          interface Interface {
            property: string
            method(): string
          }
        `,
        code: dedent`
          interface Interface {
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
            messageId: 'unexpectedInterfacePropertiesGroupOrder',
          },
        ],
        output: dedent`
          interface Interface {
            multilineProperty: {
              a: string
            }
            optionalProperty?: string
          }
        `,
        code: dedent`
          interface Interface {
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
            messageId: 'unexpectedInterfacePropertiesGroupOrder',
          },
        ],
        output: dedent`
          interface Interface {
            multilineProperty: {
              a: string
            }
            requiredProperty: string
          }
        `,
        code: dedent`
          interface Interface {
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
            messageId: 'unexpectedInterfacePropertiesGroupOrder',
          },
        ],
        output: dedent`
          interface Interface {
            c: string
            a?: string
            b?: string
          }
        `,
        code: dedent`
          interface Interface {
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
      ['case-insensitive regex', { pattern: 'HELLO', flags: 'i' }],
      ['array with regex', ['noMatch', { pattern: 'HELLO', flags: 'i' }]],
    ])(
      'filters on elementNamePattern - %s',
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
              messageId: 'unexpectedInterfacePropertiesGroupOrder',
            },
          ],
          output: dedent`
            interface Interface {
              helloProperty: string
              a: string
              b: string
              method(): void
            }
          `,
          code: dedent`
            interface Interface {
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
      ['case-insensitive regex', { pattern: 'DATE', flags: 'i' }],
      ['array with regex', ['noMatch', { pattern: 'DATE', flags: 'i' }]],
    ])(
      'filters on elementValuePattern - %s',
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
              messageId: 'unexpectedInterfacePropertiesGroupOrder',
            },
          ],
          output: dedent`
            interface Interface {
              a: number
              z: number
              b: Date
              y: Date
              c(): string
            }
          `,
          code: dedent`
            interface Interface {
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
            data: {
              right: 'bb',
              left: 'a',
            },
            messageId: 'unexpectedInterfacePropertiesOrder',
          },
          {
            data: {
              right: 'ccc',
              left: 'bb',
            },
            messageId: 'unexpectedInterfacePropertiesOrder',
          },
          {
            data: {
              right: 'dddd',
              left: 'ccc',
            },
            messageId: 'unexpectedInterfacePropertiesOrder',
          },
          {
            data: {
              rightGroup: 'reversedPropertiesByLineLength',
              leftGroup: 'unknown',
              left: 'method',
              right: 'eee',
            },
            messageId: 'unexpectedInterfacePropertiesGroupOrder',
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
          interface Interface {
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
          interface Interface {
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
            data: {
              right: 'fooBar',
              left: 'fooZar',
            },
            messageId: 'unexpectedInterfacePropertiesOrder',
          },
        ],
        output: dedent`
          interface Interface {
            fooBar: string
            fooZar: string
          }
        `,
        code: dedent`
          interface Interface {
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
            data: {
              right: 'b',
              left: 'a',
            },
            messageId: 'unexpectedInterfacePropertiesOrder',
          },
        ],
        output: dedent`
          interface Interface {
            b: fooBar
            a: fooZar
          }
        `,
        code: dedent`
          interface Interface {
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
            messageId: 'unexpectedInterfacePropertiesGroupOrder',
          },
          {
            data: {
              right: 'fooA',
              left: 'fooB',
            },
            messageId: 'unexpectedInterfacePropertiesOrder',
          },
          {
            data: {
              rightGroup: 'fooElementsSortedByValue',
              leftGroup: 'unknown',
              right: 'fooMethod',
              left: 'a',
            },
            messageId: 'unexpectedInterfacePropertiesGroupOrder',
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
          interface Interface {
            fooA: Date
            fooC: number
            fooB: string
            fooMethod(): void
            a: string
            z: boolean
          }
        `,
        code: dedent`
          interface Interface {
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
            messageId: 'unexpectedInterfacePropertiesGroupOrder',
          },
        ],
        output: dedent`
          interface Interface {
            b
            a
            d
            e
            c
            method(): void
          }
        `,
        code: dedent`
          interface Interface {
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
            messageId: 'unexpectedInterfacePropertiesGroupOrder',
          },
          {
            data: {
              right: '[key: string]',
              left: 'e',
            },
            messageId: 'unexpectedInterfacePropertiesOrder',
          },
        ],
        output: dedent`
          interface Interface {
            [key: string]: string
            a: string
            d?: () => void
            e: string
            b(): void
            c?: string
          }
        `,
        code: dedent`
          interface Interface {
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
          interface Interface {
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
            data: {
              right: 'b',
              left: 'a',
            },
            messageId: 'missedSpacingBetweenInterfaceMembers',
          },
        ],
        output: dedent`
          interface Interface {
            a

            b
          }
        `,
        code: dedent`
          interface Interface {
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
            data: {
              right: 'b',
              left: 'a',
            },
            messageId: 'extraSpacingBetweenInterfaceMembers',
          },
        ],
        output: dedent`
          interface Interface {
            a
            b
          }
        `,
        code: dedent`
          interface Interface {
            a

            b
          }
        `,
      })
    })

    it('allows to use new line as partition', async () => {
      await valid({
        code: dedent`
          interface Interface {
            e: 'eee'
            f: 'ff'
            g: 'g'

            a: 'aaa'

            b?: 'bbb'
            c: 'cc'
            d: 'd'
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
            data: {
              right: 'e',
              left: 'f',
            },
            messageId: 'unexpectedInterfacePropertiesOrder',
          },
          {
            data: {
              right: 'c',
              left: 'd',
            },
            messageId: 'unexpectedInterfacePropertiesOrder',
          },
        ],
        output: dedent`
          interface Interface {
            e: 'eee'
            f: 'ff'
            g: 'g'

            a: 'aaa'

            b?: 'bbb'
            c: 'cc'
            d: 'd'
          }
        `,
        code: dedent`
          interface Interface {
            f: 'ff'
            e: 'eee'
            g: 'g'

            a: 'aaa'

            b?: 'bbb'
            d: 'd'
            c: 'cc'
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
          interface MyInterface {
            // Part: A
            // Not partition comment
            bbb: string;
            cc: string;
            d: string;
            // Part: B
            aaaa: string;
            e: string;
            // Part: C
            'gg': string;
            // Not partition comment
            fff: string;
          }
        `,
        code: dedent`
          interface MyInterface {
            // Part: A
            cc: string;
            d: string;
            // Not partition comment
            bbb: string;
            // Part: B
            aaaa: string;
            e: string;
            // Part: C
            'gg': string;
            // Not partition comment
            fff: string;
          }
        `,
        errors: [
          {
            data: {
              right: 'bbb',
              left: 'd',
            },
            messageId: 'unexpectedInterfacePropertiesOrder',
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
          interface MyInterface {
            // Comment
            bb: string;
            // Other comment
            a: string;
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
          interface MyInterface {
            /* Partition Comment */
            // Part: A
            d: string;
            // Part: B
            aaa: string;
            bb: string;
            c: string;
            /* Other */
            e: string;
          }
        `,
        code: dedent`
          interface MyInterface {
            /* Partition Comment */
            // Part: A
            d: string;
            // Part: B
            aaa: string;
            c: string;
            bb: string;
            /* Other */
            e: string;
          }
        `,
        errors: [
          {
            data: {
              right: 'bb',
              left: 'c',
            },
            messageId: 'unexpectedInterfacePropertiesOrder',
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
          interface MyInterface {
            e: string,
            f: string,
            // I am a partition comment because I don't have f o o
            a: string,
            b: string,
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

    it('allows to trim special characters', async () => {
      await valid({
        code: dedent`
          interface MyInterface {
            _aaa: string
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

    it('ignores block comments when using line partition', async () => {
      await invalid({
        errors: [
          {
            data: {
              right: 'aa',
              left: 'b',
            },
            messageId: 'unexpectedInterfacePropertiesOrder',
          },
        ],
        options: [
          {
            ...options,
            partitionByComment: {
              line: true,
            },
          },
        ],
        output: dedent`
          interface Interface {
            /* Comment */
            aa: string
            b: string
          }
        `,
        code: dedent`
          interface Interface {
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
          interface Interface {
            b: string
            // Comment
            a: string
          }
        `,
      })
    })

    it('allows to use multiple line partition comments', async () => {
      await valid({
        code: dedent`
          interface Interface {
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

    it('allows to use regex for line partition comments', async () => {
      await valid({
        code: dedent`
          interface Interface {
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

    it('ignores line comments when using block partition', async () => {
      await invalid({
        errors: [
          {
            data: {
              right: 'aa',
              left: 'b',
            },
            messageId: 'unexpectedInterfacePropertiesOrder',
          },
        ],
        options: [
          {
            ...options,
            partitionByComment: {
              block: true,
            },
          },
        ],
        output: dedent`
          interface Interface {
            // Comment
            aa: string
            b: string
          }
        `,
        code: dedent`
          interface Interface {
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
          interface Interface {
            b: string
            /* Comment */
            a: string
          }
        `,
      })
    })

    it('allows to use multiple block partition comments', async () => {
      await valid({
        code: dedent`
          interface Interface {
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

    it('allows to use regex for block partition comments', async () => {
      await valid({
        code: dedent`
          interface Interface {
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

    it('allows to remove special characters', async () => {
      await valid({
        code: dedent`
          interface MyInterface {
            abc: string
            a_c: string
          }
        `,
        options: [
          {
            ...options,
            specialCharacters: 'remove',
          },
        ],
      })
    })

    it('allows to use locale', async () => {
      await valid({
        code: dedent`
          interface MyInterface {
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
          interface Interface {
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
            messageId: 'extraSpacingBetweenInterfaceMembers',
          },
          {
            data: {
              right: 'bbb',
              left: 'z',
            },
            messageId: 'unexpectedInterfacePropertiesOrder',
          },
          {
            data: {
              right: 'bbb',
              left: 'z',
            },
            messageId: 'extraSpacingBetweenInterfaceMembers',
          },
        ],
        code: dedent`
          interface Interface {
            aaaa: () => null,


           yy: "y",
          z: "z",

              bbb: "b",
          }
        `,
        output: dedent`
          interface Interface {
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
            data: {
              right: 'b',
              left: 'a',
            },
            messageId: 'missedSpacingBetweenInterfaceMembers',
          },
          {
            data: {
              right: 'c',
              left: 'b',
            },
            messageId: 'extraSpacingBetweenInterfaceMembers',
          },
          {
            data: {
              right: 'd',
              left: 'c',
            },
            messageId: 'extraSpacingBetweenInterfaceMembers',
          },
        ],
        output: dedent`
          interface Interface {
            a: string

            b: string

            c: string
            d: string


            e: string
          }
        `,
        code: dedent`
          interface Interface {
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
      [2, 0],
      [2, 'ignore'],
      [0, 2],
      ['ignore', 2],
    ])(
      'enforces newlines when global option is %s and group option is %s',
      async (globalNewlinesBetween, groupNewlinesBetween) => {
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
              data: {
                right: 'b',
                left: 'a',
              },
              messageId: 'missedSpacingBetweenInterfaceMembers',
            },
          ],
          output: dedent`
            interface Interface {
              a: string


              b: string
            }
          `,
          code: dedent`
            interface Interface {
              a: string
              b: string
            }
          `,
        })
      },
    )

    it.each([1, 2, 'ignore', 0])(
      'enforces no newline when global option is %s and newlinesBetween: 0 exists between all groups',
      async globalNewlinesBetween => {
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
              data: {
                right: 'b',
                left: 'a',
              },
              messageId: 'extraSpacingBetweenInterfaceMembers',
            },
          ],
          output: dedent`
            interface Interface {
              a: string
              b: string
            }
          `,
          code: dedent`
            interface Interface {
              a: string

              b: string
            }
          `,
        })
      },
    )

    it.each([
      ['ignore', 0],
      [0, 'ignore'],
    ])(
      'does not enforce newline when global option is %s and group option is %s',
      async (globalNewlinesBetween, groupNewlinesBetween) => {
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
            interface Interface {
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
            interface Interface {
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
            messageId: 'unexpectedInterfacePropertiesGroupOrder',
          },
        ],
        output: dedent`
          interface Interface {
            a: string // Comment after

            b: () => void
            c: () => void
          };
        `,
        code: dedent`
          interface Interface {
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

    it('ignores newline fixes between different partitions when newlinesBetween is 0', async () => {
      await invalid({
        options: [
          {
            ...options,
            customGroups: [
              {
                elementNamePattern: 'aaa',
                groupName: 'a',
              },
            ],
            groups: ['a', 'unknown'],
            partitionByComment: true,
            newlinesBetween: 0,
          },
        ],
        errors: [
          {
            data: {
              right: 'bb',
              left: 'c',
            },
            messageId: 'unexpectedInterfacePropertiesOrder',
          },
        ],
        output: dedent`
          interface Interface {
            aaa

            // Partition comment

            bb
            c
          }
        `,
        code: dedent`
          interface Interface {
            aaa

            // Partition comment

            c
            bb
          }
        `,
      })
    })

    it('sorts inline elements correctly', async () => {
      await invalid({
        errors: [
          {
            data: {
              right: 'aa',
              left: 'b',
            },
            messageId: 'unexpectedInterfacePropertiesOrder',
          },
        ],
        output: dedent`
          interface Interface {
            aa: string; b: string,
          }
        `,
        code: dedent`
          interface Interface {
            b: string, aa: string
          }
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            data: {
              right: 'aa',
              left: 'b',
            },
            messageId: 'unexpectedInterfacePropertiesOrder',
          },
        ],
        output: dedent`
          interface Interface {
            aa: string; b: string,
          }
        `,
        code: dedent`
          interface Interface {
            b: string, aa: string;
          }
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            data: {
              right: 'aa',
              left: 'b',
            },
            messageId: 'unexpectedInterfacePropertiesOrder',
          },
        ],
        output: dedent`
          interface Interface {
            aa: string, b: string,
          }
        `,
        code: dedent`
          interface Interface {
            b: string, aa: string,
          }
        `,
        options: [options],
      })
    })

    it.each([
      ['^r|g|b$', '^r|g|b$'],
      ['array with ^r|g|b$', ['noMatch', '^r|g|b$']],
      ['pattern with flags', { pattern: '^R|G|B$', flags: 'i' }],
      [
        'array with pattern and flags',
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
                  elementNamePattern: '^r$',
                  groupName: 'r',
                },
                {
                  elementNamePattern: '^g$',
                  groupName: 'g',
                },
                {
                  elementNamePattern: '^b$',
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
              messageId: 'unexpectedInterfacePropertiesGroupOrder',
            },
            {
              data: {
                rightGroup: 'r',
                leftGroup: 'g',
                right: 'r',
                left: 'g',
              },
              messageId: 'unexpectedInterfacePropertiesGroupOrder',
            },
          ],
          output: dedent`
            interface Interface {
              r: string
              g: string
              b: string
            }
          `,
          code: dedent`
            interface Interface {
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
              declarationMatchesPattern: '^Interface$',
            },
            type: 'unsorted',
          },
          options,
        ],
        code: dedent`
          interface Interface {
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
              declarationMatchesPattern: '^Interface$',
            },
            type: 'unsorted',
          },
          options,
        ],
        errors: [
          {
            data: {
              right: 'aa',
              left: 'b',
            },
            messageId: 'unexpectedInterfacePropertiesOrder',
          },
        ],
        output: dedent`
          interface OtherInterface {
            aa: string
            b: string
          }
        `,
        code: dedent`
          interface OtherInterface {
            b: string
            aa: string
          }
        `,
      })
    })

    it('allows sorting by value', async () => {
      await invalid({
        errors: [
          {
            data: {
              right: 'bb',
              left: 'a',
            },
            messageId: 'unexpectedInterfacePropertiesOrder',
          },
        ],
        output: dedent`
          interface Interface {
            bb: 'a'
            a: 'b'
          }
        `,
        code: dedent`
          interface Interface {
            a: 'b'
            bb: 'a'
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

    it('does not enforce sorting of non-properties in the same group', async () => {
      await invalid({
        errors: [
          {
            data: {
              right: 'a',
              left: 'z',
            },
            messageId: 'unexpectedInterfacePropertiesOrder',
          },
          {
            data: {
              right: 'y',
              left: 'a',
            },
            messageId: 'unexpectedInterfacePropertiesOrder',
          },
        ],
        output: dedent`
          interface Interface {
            y: 'yy'
            a(): void
            z: 'z'
          }
        `,
        code: dedent`
          interface Interface {
            z: 'z'
            a(): void
            y: 'yy'
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
              rightGroup: 'method',
              leftGroup: 'unknown',
              right: 'a',
              left: 'z',
            },
            messageId: 'unexpectedInterfacePropertiesGroupOrder',
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
          interface Interface {
            b(): void
            a(): void
            z: 'z'
          }
        `,
        code: dedent`
          interface Interface {
            b(): void
            z: 'z'
            a(): void
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

    it('sorts interface properties', async () => {
      await valid({
        code: dedent`
          interface Interface {
            a: string
          }
        `,
        options: [options],
      })

      await valid({
        code: dedent`
          interface Interface {
            a: string
            b: 'b1' | 'b2',
            c: string
          }
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            data: {
              right: 'b',
              left: 'c',
            },
            messageId: 'unexpectedInterfacePropertiesOrder',
          },
        ],
        output: dedent`
          interface Interface {
            a: string
            b: 'b1' | 'b2',
            c: string
          }
        `,
        code: dedent`
          interface Interface {
            a: string
            c: string
            b: 'b1' | 'b2',
          }
        `,
        options: [options],
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
          interface Interface {
            b: string;
            c: string;
            a: string;
          }
        `,
        options: [options],
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
            messageId: 'unexpectedInterfacePropertiesGroupOrder',
          },
        ],
        output: dedent`
          interface Interface {
            ba: string
            bb: string
            ab: string
            aa: string
          }
        `,
        code: dedent`
          interface Interface {
            ab: string
            aa: string
            ba: string
            bb: string
          }
        `,
      })
    })

    it('enforces newlines between groups', async () => {
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
            data: {
              right: 'a',
              left: 'b',
            },
            messageId: 'missedSpacingBetweenInterfaceMembers',
          },
        ],
        output: dedent`
          interface Interface {
            b: string

            a: string
          }
        `,
        code: dedent`
          interface Interface {
            b: string
            a: string
          }
        `,
      })
    })
  })

  describe('misc', () => {
    it('validates the JSON schema', async () => {
      await expect(
        validateRuleJsonSchema(rule.meta.schema),
      ).resolves.not.toThrow()
    })

    it('sets alphabetical asc sorting as default', async () => {
      await valid(dedent`
        interface Interface {
          a: string
          b: string
        }
      `)

      await valid({
        code: dedent`
          interface Calculator {
            log: (x: number) => number,
            log10: (x: number) => number,
            log1p: (x: number) => number,
            log2: (x: number) => number,
          }
        `,
        options: [{}],
      })

      await invalid({
        errors: [
          {
            data: {
              right: 'a',
              left: 'b',
            },
            messageId: 'unexpectedInterfacePropertiesOrder',
          },
        ],
        output: dedent`
          interface Interface {
            a: string
            b: string
          }
        `,
        code: dedent`
          interface Interface {
            b: string
            a: string
          }
        `,
      })
    })

    it('supports eslint-disable for individual nodes', async () => {
      await valid({
        code: dedent`
          interface Interface {
            b: string;
            c: string;
            // eslint-disable-next-line
            a: string;
          }
        `,
      })

      await invalid({
        errors: [
          {
            data: {
              right: 'b',
              left: 'c',
            },
            messageId: 'unexpectedInterfacePropertiesOrder',
          },
        ],
        output: dedent`
          interface Interface {
            b: string
            c: string
            // eslint-disable-next-line
            a: string
          }
        `,
        code: dedent`
          interface Interface {
            c: string
            b: string
            // eslint-disable-next-line
            a: string
          }
        `,
        options: [{}],
      })

      await invalid({
        errors: [
          {
            data: {
              right: 'c',
              left: 'd',
            },
            messageId: 'unexpectedInterfacePropertiesOrder',
          },
          {
            data: {
              right: 'b',
              left: 'a',
            },
            messageId: 'unexpectedInterfacePropertiesOrder',
          },
        ],
        output: dedent`
          interface Interface {
            b: string
            c: string
            // eslint-disable-next-line
            a: string
            d: string
          }
        `,
        code: dedent`
          interface Interface {
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
        errors: [
          {
            data: {
              right: 'b',
              left: 'c',
            },
            messageId: 'unexpectedInterfacePropertiesOrder',
          },
        ],
        output: dedent`
          interface Interface {
            b: string
            c: string
            a: string // eslint-disable-line
          }
        `,
        code: dedent`
          interface Interface {
            c: string
            b: string
            a: string // eslint-disable-line
          }
        `,
        options: [{}],
      })

      await invalid({
        errors: [
          {
            data: {
              right: 'b',
              left: 'c',
            },
            messageId: 'unexpectedInterfacePropertiesOrder',
          },
        ],
        output: dedent`
          interface Interface {
            b: string
            c: string
            /* eslint-disable-next-line */
            a: string
          }
        `,
        code: dedent`
          interface Interface {
            c: string
            b: string
            /* eslint-disable-next-line */
            a: string
          }
        `,
        options: [{}],
      })

      await invalid({
        errors: [
          {
            data: {
              right: 'b',
              left: 'c',
            },
            messageId: 'unexpectedInterfacePropertiesOrder',
          },
        ],
        output: dedent`
          interface Interface {
            b: string
            c: string
            a: string /* eslint-disable-line */
          }
        `,
        code: dedent`
          interface Interface {
            c: string
            b: string
            a: string /* eslint-disable-line */
          }
        `,
        options: [{}],
      })

      await invalid({
        output: dedent`
          interface Interface {
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
          interface Interface {
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
            data: {
              right: 'a',
              left: 'b',
            },
            messageId: 'unexpectedInterfacePropertiesOrder',
          },
        ],
        options: [{}],
      })

      await invalid({
        output: dedent`
          interface Interface {
            b: string
            c: string
            // eslint-disable-next-line rule-to-test/sort-interfaces
            a: string
          }
        `,
        code: dedent`
          interface Interface {
            c: string
            b: string
            // eslint-disable-next-line rule-to-test/sort-interfaces
            a: string
          }
        `,
        errors: [
          {
            data: {
              right: 'b',
              left: 'c',
            },
            messageId: 'unexpectedInterfacePropertiesOrder',
          },
        ],
        options: [{}],
      })

      await invalid({
        errors: [
          {
            data: {
              right: 'b',
              left: 'c',
            },
            messageId: 'unexpectedInterfacePropertiesOrder',
          },
        ],
        output: dedent`
          interface Interface {
            b: string
            c: string
            a: string // eslint-disable-line rule-to-test/sort-interfaces
          }
        `,
        code: dedent`
          interface Interface {
            c: string
            b: string
            a: string // eslint-disable-line rule-to-test/sort-interfaces
          }
        `,
        options: [{}],
      })

      await invalid({
        output: dedent`
          interface Interface {
            b: string
            c: string
            /* eslint-disable-next-line rule-to-test/sort-interfaces */
            a: string
          }
        `,
        code: dedent`
          interface Interface {
            c: string
            b: string
            /* eslint-disable-next-line rule-to-test/sort-interfaces */
            a: string
          }
        `,
        errors: [
          {
            data: {
              right: 'b',
              left: 'c',
            },
            messageId: 'unexpectedInterfacePropertiesOrder',
          },
        ],
        options: [{}],
      })

      await invalid({
        errors: [
          {
            data: {
              right: 'b',
              left: 'c',
            },
            messageId: 'unexpectedInterfacePropertiesOrder',
          },
        ],
        output: dedent`
          interface Interface {
            b: string
            c: string
            a: string /* eslint-disable-line rule-to-test/sort-interfaces */
          }
        `,
        code: dedent`
          interface Interface {
            c: string
            b: string
            a: string /* eslint-disable-line rule-to-test/sort-interfaces */
          }
        `,
        options: [{}],
      })

      await invalid({
        output: dedent`
          interface Interface {
            a: string
            d: string
            /* eslint-disable rule-to-test/sort-interfaces */
            c: string
            b: string
            // Shouldn't move
            /* eslint-enable */
            e: string
          }
        `,
        code: dedent`
          interface Interface {
            d: string
            e: string
            /* eslint-disable rule-to-test/sort-interfaces */
            c: string
            b: string
            // Shouldn't move
            /* eslint-enable */
            a: string
          }
        `,
        errors: [
          {
            data: {
              right: 'a',
              left: 'b',
            },
            messageId: 'unexpectedInterfacePropertiesOrder',
          },
        ],
        options: [{}],
      })
    })
  })
})
