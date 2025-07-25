import { RuleTester } from '@typescript-eslint/rule-tester'
import { afterAll, describe, expect, it } from 'vitest'
import dedent from 'dedent'

import type { Options } from '../../rules/sort-interfaces'

import { validateRuleJsonSchema } from '../utils/validate-rule-json-schema'
import { Alphabet } from '../../utils/alphabet'
import rule from '../../rules/sort-interfaces'

let ruleName = 'sort-interfaces'

describe(ruleName, () => {
  RuleTester.describeSkip = describe.skip
  RuleTester.afterAll = afterAll
  RuleTester.describe = describe
  RuleTester.itOnly = it.only
  RuleTester.itSkip = it.skip
  RuleTester.it = it

  let ruleTester = new RuleTester()

  describe(`${ruleName}: sorting by alphabetical order`, () => {
    let type = 'alphabetical-order'

    let options: Options[0] = {
      type: 'alphabetical',
      ignoreCase: true,
      order: 'asc',
    } as const

    ruleTester.run(`${ruleName}(${type}): sorts interface properties`, rule, {
      invalid: [
        {
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
        },
      ],
      valid: [
        {
          code: dedent`
            interface Interface {
              a: string
            }
          `,
          options: [options],
        },
        {
          code: dedent`
            interface Interface {
              a: string
              b: 'b1' | 'b2',
              c: string
            }
          `,
          options: [options],
        },
      ],
    })

    ruleTester.run(
      `${ruleName}(${type}): works with ts index signature`,
      rule,
      {
        invalid: [
          {
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
          },
        ],
        valid: [
          {
            code: dedent`
              interface Interface {
                [key in Object]: string
                a: 'a'
              }
            `,
            options: [options],
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): sorts multi-word keys by value`,
      rule,
      {
        invalid: [
          {
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
          },
        ],
        valid: [
          {
            code: dedent`
              interface Interface {
                a: Value
                'b-b': string
                c: string
                'd-d': string
              }
            `,
            options: [options],
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): works with typescript index signature`,
      rule,
      {
        invalid: [
          {
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
          },
        ],
        valid: [
          {
            code: dedent`
              interface Interface {
                [key: string]: string
                a: string
                b: string
              }
            `,
            options: [options],
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): works with method and construct signatures`,
      rule,
      {
        invalid: [
          {
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
          },
        ],
        valid: [
          {
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
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): works with empty properties with empty values`,
      rule,
      {
        invalid: [
          {
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
          },
        ],
        valid: [
          {
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
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): does not break interface docs`,
      rule,
      {
        invalid: [
          {
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
          },
        ],
        valid: [],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): sorts interfaces with comments on the same line`,
      rule,
      {
        invalid: [
          {
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
          },
        ],
        valid: [],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): sorts interfaces with semi and comments on the same line`,
      rule,
      {
        invalid: [
          {
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
          },
        ],
        valid: [],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): does not sort call signature declarations`,
      rule,
      {
        valid: [
          {
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
          },
        ],
        invalid: [],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): does not sort constructor declarations`,
      rule,
      {
        valid: [
          {
            code: dedent`
              interface Interface {
                new (value: number | string): number;
                new (value: number): unknown;
              }
            `,
            options: [options],
          },
          {
            code: dedent`
              interface Interface {
                new (value: number): unknown;
                new (value: number | string): number;
              }
            `,
            options: [options],
          },
        ],
        invalid: [],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): sorts complex predefined groups`,
      rule,
      {
        invalid: [
          {
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
                  rightGroup: 'optional-multiline',
                  leftGroup: 'index-signature',
                  left: '[key: string]',
                  right: 'b',
                },
                messageId: 'unexpectedInterfacePropertiesGroupOrder',
              },
              {
                data: {
                  leftGroup: 'optional-multiline',
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
                  'optional-multiline',
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
          },
        ],
        valid: [],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): prioritize selectors over modifiers quantity`,
      rule,
      {
        invalid: [
          {
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
          },
        ],
        valid: [],
      },
    )

    describe(`${ruleName}(${type}): selectors priority`, () => {
      ruleTester.run(
        `${ruleName}(${type}): prioritize index-signature over multiline`,
        rule,
        {
          invalid: [
            {
              errors: [
                {
                  data: {
                    rightGroup: 'index-signature',
                    left: 'multilineProperty',
                    right: '[key: string]',
                    leftGroup: 'multiline',
                  },
                  messageId: 'unexpectedInterfacePropertiesGroupOrder',
                },
              ],
              output: dedent`
                interface Interface {
                  [key: string]: string;
                  multilineProperty: {
                    a: string
                  }
                }
              `,
              code: dedent`
                interface Interface {
                  multilineProperty: {
                    a: string
                  }
                  [key: string]: string;
                }
              `,
              options: [
                {
                  ...options,
                  groups: ['index-signature', 'multiline'],
                },
              ],
            },
          ],
          valid: [],
        },
      )

      ruleTester.run(
        `${ruleName}(${type}): prioritize method over multiline`,
        rule,
        {
          invalid: [
            {
              errors: [
                {
                  data: {
                    left: 'multilineProperty',
                    leftGroup: 'multiline',
                    rightGroup: 'method',
                    right: 'method',
                  },
                  messageId: 'unexpectedInterfacePropertiesGroupOrder',
                },
              ],
              output: dedent`
                interface Interface {
                  method(): string
                  multilineProperty: {
                    a: string
                  }
                }
              `,
              code: dedent`
                interface Interface {
                  multilineProperty: {
                    a: string
                  }
                  method(): string
                }
              `,
              options: [
                {
                  ...options,
                  groups: ['method', 'multiline'],
                },
              ],
            },
          ],
          valid: [],
        },
      )

      ruleTester.run(
        `${ruleName}(${type}): prioritize multiline over property`,
        rule,
        {
          invalid: [
            {
              errors: [
                {
                  data: {
                    right: 'multilineProperty',
                    rightGroup: 'multiline',
                    leftGroup: 'property',
                    left: 'property',
                  },
                  messageId: 'unexpectedInterfacePropertiesGroupOrder',
                },
              ],
              output: dedent`
                interface Interface {
                  multilineProperty: {
                    a: string
                  }
                  property: string
                }
              `,
              code: dedent`
                interface Interface {
                  property: string
                  multilineProperty: {
                    a: string
                  }
                }
              `,
              options: [
                {
                  ...options,
                  groups: ['multiline', 'property'],
                },
              ],
            },
          ],
          valid: [],
        },
      )

      ruleTester.run(
        `${ruleName}(${type}): prioritize property over member`,
        rule,
        {
          invalid: [
            {
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
            },
          ],
          valid: [],
        },
      )
    })

    describe(`${ruleName}(${type}): modifiers priority`, () => {
      ruleTester.run(
        `${ruleName}(${type}): prioritize multiline over optional`,
        rule,
        {
          invalid: [
            {
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
            },
          ],
          valid: [],
        },
      )

      ruleTester.run(
        `${ruleName}(${type}): prioritize multiline over required`,
        rule,
        {
          invalid: [
            {
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
            },
          ],
          valid: [],
        },
      )
    })

    ruleTester.run(
      `${ruleName}(${type}): allows to set groups for sorting`,
      rule,
      {
        invalid: [
          {
            errors: [
              {
                data: {
                  rightGroup: 'multiline',
                  leftGroup: 'unknown',
                  right: 'd',
                  left: 'c',
                },
                messageId: 'unexpectedInterfacePropertiesGroupOrder',
              },
              {
                data: {
                  leftGroup: 'multiline',
                  rightGroup: 'g',
                  right: 'g',
                  left: 'd',
                },
                messageId: 'unexpectedInterfacePropertiesGroupOrder',
              },
            ],
            output: dedent`
              interface Interface {
                g: 'g'
                d: {
                  e: 'e'
                  f: 'f'
                }
                a: 'aaa'
                b: 'bb'
                c: 'c'
              }
            `,
            code: dedent`
              interface Interface {
                a: 'aaa'
                b: 'bb'
                c: 'c'
                d: {
                  e: 'e'
                  f: 'f'
                }
                g: 'g'
              }
            `,
            options: [
              {
                ...options,
                customGroups: {
                  g: 'g',
                },
                groups: ['g', 'multiline', 'unknown'],
              },
            ],
          },
        ],
        valid: [
          {
            code: dedent`
              interface Interface {
                g: 'g'
                d: {
                  e: 'e'
                  f: 'f'
                }
                a: 'aaa'
                b: 'bb'
                c: 'c'
              }
            `,
            options: [
              {
                ...options,
                customGroups: {
                  g: 'g',
                },
                groups: ['g', 'multiline', 'unknown'],
              },
            ],
          },
        ],
      },
    )

    describe(`${ruleName}: custom groups`, () => {
      ruleTester.run(`${ruleName}: filters on selector and modifiers`, rule, {
        invalid: [
          {
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
          },
        ],
        valid: [],
      })

      for (let elementNamePattern of [
        'hello',
        ['noMatch', 'hello'],
        { pattern: 'HELLO', flags: 'i' },
        ['noMatch', { pattern: 'HELLO', flags: 'i' }],
      ]) {
        ruleTester.run(`${ruleName}: filters on elementNamePattern`, rule, {
          invalid: [
            {
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
            },
          ],
          valid: [],
        })
      }

      for (let dateElementValuePattern of [
        'Date',
        ['noMatch', 'Date'],
        { pattern: 'DATE', flags: 'i' },
        ['noMatch', { pattern: 'DATE', flags: 'i' }],
      ]) {
        ruleTester.run(`${ruleName}: filters on elementValuePattern`, rule, {
          invalid: [
            {
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
            },
          ],
          valid: [],
        })
      }

      ruleTester.run(
        `${ruleName}: sort custom groups by overriding 'type' and 'order'`,
        rule,
        {
          invalid: [
            {
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
            },
          ],
          valid: [],
        },
      )

      ruleTester.run(
        `${ruleName}: sort custom groups by overriding 'fallbackSort'`,
        rule,
        {
          invalid: [
            {
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
            },
            {
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
            },
          ],
          valid: [],
        },
      )

      ruleTester.run(
        `${ruleName}: sort custom groups by overriding 'sortBy'`,
        rule,
        {
          invalid: [
            {
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
            },
          ],
          valid: [],
        },
      )

      ruleTester.run(
        `${ruleName}: does not sort custom groups with 'unsorted' type`,
        rule,
        {
          invalid: [
            {
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
            },
          ],
          valid: [],
        },
      )

      ruleTester.run(`${ruleName}: sort custom group blocks`, rule, {
        invalid: [
          {
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
          },
        ],
        valid: [],
      })

      ruleTester.run(
        `${ruleName}: allows to use regex for element names in custom groups`,
        rule,
        {
          valid: [
            {
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
            },
          ],
          invalid: [],
        },
      )

      describe('newlinesInside', () => {
        for (let newlinesInside of ['always', 1] as const) {
          ruleTester.run(
            `${ruleName}: allows to use newlinesInside: "${newlinesInside}"`,
            rule,
            {
              invalid: [
                {
                  options: [
                    {
                      customGroups: [
                        {
                          selector: 'property',
                          groupName: 'group1',
                          newlinesInside,
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
                },
              ],
              valid: [],
            },
          )
        }

        for (let newlinesInside of ['never', 0] as const) {
          ruleTester.run(
            `${ruleName}: allows to use newlinesInside: "${newlinesInside}"`,
            rule,
            {
              invalid: [
                {
                  options: [
                    {
                      customGroups: [
                        {
                          selector: 'property',
                          groupName: 'group1',
                          newlinesInside,
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
                },
              ],
              valid: [],
            },
          )
        }
      })
    })

    ruleTester.run(
      `${ruleName}(${type}): allows to use regex for custom groups`,
      rule,
      {
        valid: [
          {
            options: [
              {
                ...options,
                customGroups: {
                  elementsWithoutFoo: '^(?!.*Foo).*$',
                },
                groups: ['unknown', 'elementsWithoutFoo'],
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
          },
        ],
        invalid: [],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): allows to use new line as partition`,
      rule,
      {
        invalid: [
          {
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
          },
        ],
        valid: [
          {
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
          },
        ],
      },
    )

    ruleTester.run(`${ruleName}(${type}): sorts interface properties`, rule, {
      invalid: [
        {
          errors: [
            {
              data: {
                right: 'c',
                left: 'b',
              },
              messageId: 'unexpectedInterfacePropertiesOrder',
            },
          ],
          output: dedent`
            interface Interface {
              a?: string
              c?: string
              d?: string
              e?(): void
              b: string
            }
          `,
          code: dedent`
            interface Interface {
              a?: string
              b: string
              c?: string
              d?: string
              e?(): void
            }
          `,
          options: [
            {
              ...options,
              groupKind: 'optional-first',
            },
          ],
        },
      ],
      valid: [
        {
          code: dedent`
            interface Interface {
              a?: string
              [index: number]: string
            }
          `,
          options: [
            {
              ...options,
              groupKind: 'optional-first',
            },
          ],
        },
      ],
    })

    ruleTester.run(
      `${ruleName}(${type}): allows to set groups for sorting`,
      rule,
      {
        invalid: [
          {
            errors: [
              {
                data: {
                  rightGroup: 'unknown',
                  leftGroup: 'last',
                  right: 'b',
                  left: 'a',
                },
                messageId: 'unexpectedInterfacePropertiesGroupOrder',
              },
              {
                data: {
                  right: 'c',
                  left: 'b',
                },
                messageId: 'unexpectedInterfacePropertiesOrder',
              },
            ],
            options: [
              {
                ...options,
                customGroups: {
                  last: 'a',
                },
                groups: ['unknown', 'last'],
                groupKind: 'optional-first',
              },
            ],
            output: dedent`
              interface Interface {
                c?: string
                d?: string
                b: string
                e: string
                a: string
              }
            `,
            code: dedent`
              interface Interface {
                a: string
                b: string
                c?: string
                d?: string
                e: string
              }
            `,
          },
        ],
        valid: [],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): allows to use partition comments`,
      rule,
      {
        invalid: [
          {
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
          },
        ],
        valid: [],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): allows to use all comments as parts`,
      rule,
      {
        valid: [
          {
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
          },
        ],
        invalid: [],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): allows to use multiple partition comments`,
      rule,
      {
        invalid: [
          {
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
          },
        ],
        valid: [],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): allows to use regex for partition comments`,
      rule,
      {
        valid: [
          {
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
          },
        ],
        invalid: [],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): allows to trim special characters`,
      rule,
      {
        valid: [
          {
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
          },
        ],
        invalid: [],
      },
    )

    describe(`${ruleName}(${type}): allows to use "partitionByComment.line"`, () => {
      ruleTester.run(`${ruleName}(${type}): ignores block comments`, rule, {
        invalid: [
          {
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
          },
        ],
        valid: [],
      })

      ruleTester.run(
        `${ruleName}(${type}): allows to use all comments as parts`,
        rule,
        {
          valid: [
            {
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
            },
          ],
          invalid: [],
        },
      )

      ruleTester.run(
        `${ruleName}(${type}): allows to use multiple partition comments`,
        rule,
        {
          valid: [
            {
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
            },
          ],
          invalid: [],
        },
      )

      ruleTester.run(
        `${ruleName}(${type}): allows to use regex for partition comments`,
        rule,
        {
          valid: [
            {
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
            },
          ],
          invalid: [],
        },
      )
    })

    describe(`${ruleName}(${type}): allows to use "partitionByComment.block"`, () => {
      ruleTester.run(`${ruleName}(${type}): ignores line comments`, rule, {
        invalid: [
          {
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
          },
        ],
        valid: [],
      })

      ruleTester.run(
        `${ruleName}(${type}): allows to use all comments as parts`,
        rule,
        {
          valid: [
            {
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
            },
          ],
          invalid: [],
        },
      )

      ruleTester.run(
        `${ruleName}(${type}): allows to use multiple partition comments`,
        rule,
        {
          valid: [
            {
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
            },
          ],
          invalid: [],
        },
      )

      ruleTester.run(
        `${ruleName}(${type}): allows to use regex for partition comments`,
        rule,
        {
          valid: [
            {
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
            },
          ],
          invalid: [],
        },
      )
    })

    ruleTester.run(
      `${ruleName}(${type}): allows to remove special characters`,
      rule,
      {
        valid: [
          {
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
          },
        ],
        invalid: [],
      },
    )

    ruleTester.run(`${ruleName}(${type}): allows to use locale`, rule, {
      valid: [
        {
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
        },
      ],
      invalid: [],
    })

    ruleTester.run(`${ruleName}(${type}): allows to use method group`, rule, {
      valid: [
        {
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
        },
      ],
      invalid: [],
    })

    describe(`${ruleName}: newlinesBetween`, () => {
      for (let newlinesBetween of ['never', 0] as const) {
        ruleTester.run(
          `${ruleName}(${type}): removes newlines when "${newlinesBetween}"`,
          rule,
          {
            invalid: [
              {
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
                    newlinesBetween,
                  },
                ],
              },
            ],
            valid: [],
          },
        )
      }

      for (let newlinesBetween of ['always', 1] as const) {
        ruleTester.run(
          `${ruleName}(${type}): keeps one newline when "${newlinesBetween}"`,
          rule,
          {
            invalid: [
              {
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
                    groups: ['a', 'b'],
                    newlinesBetween,
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
                    a; 

                  b;
                  }
                `,
                code: dedent`
                  interface Interface {
                    a; b;
                  }
                `,
              },
              {
                errors: [
                  {
                    data: {
                      right: 'z',
                      left: 'a',
                    },
                    messageId: 'extraSpacingBetweenInterfaceMembers',
                  },
                  {
                    data: {
                      right: 'y',
                      left: 'z',
                    },
                    messageId: 'unexpectedInterfacePropertiesOrder',
                  },
                  {
                    data: {
                      right: 'b',
                      left: 'y',
                    },
                    messageId: 'missedSpacingBetweenInterfaceMembers',
                  },
                ],
                output: dedent`
                  interface Interface {
                    a: () => null,

                   y: "y",
                  z: "z",

                      b: {
                        // Newline stuff
                      },
                  }
                `,
                code: dedent`
                  interface Interface {
                    a: () => null,


                   z: "z",
                  y: "y",
                      b: {
                        // Newline stuff
                      },
                  }
                `,
                options: [
                  {
                    ...options,
                    groups: ['method', 'unknown', 'multiline'],
                    newlinesBetween,
                  },
                ],
              },
            ],
            valid: [],
          },
        )
      }

      describe(`${ruleName}(${type}): "newlinesBetween" inside groups`, () => {
        ruleTester.run(
          `${ruleName}(${type}): handles "newlinesBetween" between consecutive groups`,
          rule,
          {
            invalid: [
              {
                options: [
                  {
                    ...options,
                    groups: [
                      'a',
                      { newlinesBetween: 'always' },
                      'b',
                      { newlinesBetween: 'always' },
                      'c',
                      { newlinesBetween: 'never' },
                      'd',
                      { newlinesBetween: 'ignore' },
                      'e',
                    ],
                    customGroups: [
                      { elementNamePattern: 'a', groupName: 'a' },
                      { elementNamePattern: 'b', groupName: 'b' },
                      { elementNamePattern: 'c', groupName: 'c' },
                      { elementNamePattern: 'd', groupName: 'd' },
                      { elementNamePattern: 'e', groupName: 'e' },
                    ],
                    newlinesBetween: 'always',
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
              },
            ],
            valid: [],
          },
        )

        describe(`${ruleName}(${type}): "newlinesBetween" between non-consecutive groups`, () => {
          for (let [globalNewlinesBetween, groupNewlinesBetween] of [
            [2, 'never'],
            [2, 0],
            [2, 'ignore'],
            ['never', 2],
            [0, 2],
            ['ignore', 2],
          ] as const) {
            ruleTester.run(
              `${ruleName}(${type}): enforces newlines if the global option is ${globalNewlinesBetween} and the group option is "${groupNewlinesBetween}"`,
              rule,
              {
                invalid: [
                  {
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
                  },
                ],
                valid: [],
              },
            )
          }

          for (let globalNewlinesBetween of [
            'always',
            2,
            'ignore',
            'never',
            0,
          ] as const) {
            ruleTester.run(
              `${ruleName}(${type}): enforces no newline if the global option is "${globalNewlinesBetween}" and "newlinesBetween: never" exists between all groups`,
              rule,
              {
                invalid: [
                  {
                    options: [
                      {
                        ...options,
                        groups: [
                          'a',
                          { newlinesBetween: 'never' },
                          'unusedGroup',
                          { newlinesBetween: 'never' },
                          'b',
                          { newlinesBetween: 'always' },
                          'c',
                        ],
                        customGroups: [
                          { elementNamePattern: 'a', groupName: 'a' },
                          { elementNamePattern: 'b', groupName: 'b' },
                          { elementNamePattern: 'c', groupName: 'c' },
                          { groupName: 'unusedGroup', elementNamePattern: 'X' },
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
                  },
                ],
                valid: [],
              },
            )
          }

          for (let [globalNewlinesBetween, groupNewlinesBetween] of [
            ['ignore', 'never'] as const,
            ['ignore', 0] as const,
            ['never', 'ignore'] as const,
            [0, 'ignore'] as const,
          ]) {
            ruleTester.run(
              `${ruleName}(${type}): does not enforce a newline if the global option is "${globalNewlinesBetween}" and the group option is "${groupNewlinesBetween}"`,
              rule,
              {
                valid: [
                  {
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
                  },
                  {
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
                  },
                ],
                invalid: [],
              },
            )
          }
        })
      })

      ruleTester.run(
        `${ruleName}(${type}): handles newlines and comment after fixes`,
        rule,
        {
          invalid: [
            {
              output: [
                dedent`
                  interface Interface {
                    a: string // Comment after
                    b: () => void

                    c: () => void
                  };
                `,
                dedent`
                  interface Interface {
                    a: string // Comment after

                    b: () => void
                    c: () => void
                  };
                `,
              ],
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
                  newlinesBetween: 'always',
                },
              ],
            },
          ],
          valid: [],
        },
      )

      for (let newlinesBetween of ['never', 0] as const) {
        ruleTester.run(
          `${ruleName}(${type}): ignores newline fixes between different partitions (${newlinesBetween})`,
          rule,
          {
            invalid: [
              {
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
                    newlinesBetween,
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
              },
            ],
            valid: [],
          },
        )
      }
    })

    ruleTester.run(
      `${ruleName}(${type}): sorts inline elements correctly`,
      rule,
      {
        invalid: [
          {
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
          },
          {
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
          },
          {
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
          },
        ],
        valid: [],
      },
    )

    describe(`${ruleName}(${type}): allows to use 'useConfigurationIf'`, () => {
      for (let rgbAllNamesMatchPattern of [
        '^r|g|b$',
        ['noMatch', '^r|g|b$'],
        { pattern: '^R|G|B$', flags: 'i' },
        ['noMatch', { pattern: '^R|G|B$', flags: 'i' }],
      ]) {
        ruleTester.run(
          `${ruleName}(${type}): allows to use 'allNamesMatchPattern'`,
          rule,
          {
            invalid: [
              {
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
                options: [
                  {
                    ...options,
                    useConfigurationIf: {
                      allNamesMatchPattern: 'foo',
                    },
                  },
                  {
                    ...options,
                    customGroups: {
                      r: 'r',
                      g: 'g',
                      b: 'b',
                    },
                    useConfigurationIf: {
                      allNamesMatchPattern: rgbAllNamesMatchPattern,
                    },
                    groups: ['r', 'g', 'b'],
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
              },
            ],
            valid: [],
          },
        )
      }

      describe(`${ruleName}(${type}): allows to use 'declarationMatchesPattern'`, () => {
        ruleTester.run(
          `${ruleName}(${type}): detects declaration name by pattern`,
          rule,
          {
            invalid: [
              {
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
              },
            ],
            valid: [
              {
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
              },
            ],
          },
        )
      })
    })

    describe(`${ruleName}(${type}): sorting by value`, () => {
      ruleTester.run(`${ruleName}(${type}): allows sorting by value`, rule, {
        invalid: [
          {
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
          },
        ],
        valid: [],
      })

      ruleTester.run(
        `${ruleName}(${type}): does not enforce sorting of non-properties in the same group`,
        rule,
        {
          invalid: [
            {
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
            },
            {
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
            },
          ],
          valid: [],
        },
      )

      ruleTester.run(
        `${ruleName}(${type}): enforces grouping but does not enforce sorting of non-properties`,
        rule,
        {
          invalid: [
            {
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
            },
          ],
          valid: [],
        },
      )
    })
  })

  describe(`${ruleName}: sorting by natural order`, () => {
    let type = 'natural-order'

    let options = {
      ignoreCase: true,
      type: 'natural',
      order: 'asc',
    } as const

    ruleTester.run(`${ruleName}(${type}): sorts interface properties`, rule, {
      invalid: [
        {
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
        },
      ],
      valid: [
        {
          code: dedent`
            interface Interface {
              a: string
              b: 'b1' | 'b2',
              c: string
            }
          `,
          options: [options],
        },
      ],
    })

    ruleTester.run(
      `${ruleName}(${type}): works with ts index signature`,
      rule,
      {
        invalid: [
          {
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
          },
        ],
        valid: [
          {
            code: dedent`
              interface Interface {
                [key in Object]: string
                a: 'a'
              }
            `,
            options: [options],
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): sorts multi-word keys by value`,
      rule,
      {
        invalid: [
          {
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
          },
        ],
        valid: [
          {
            code: dedent`
              interface Interface {
                a: Value
                'b-b': string
                c: string
                'd-d': string
              }
            `,
            options: [options],
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): works with typescript index signature`,
      rule,
      {
        invalid: [
          {
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
          },
        ],
        valid: [
          {
            code: dedent`
              interface Interface {
                [key: string]: string
                a: string
                b: string
              }
            `,
            options: [options],
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): works with method and construct signatures`,
      rule,
      {
        invalid: [
          {
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
          },
        ],
        valid: [
          {
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
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): works with empty properties with empty values`,
      rule,
      {
        invalid: [
          {
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
          },
        ],
        valid: [
          {
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
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): does not break interface docs`,
      rule,
      {
        invalid: [
          {
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
          },
        ],
        valid: [],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): sorts interfaces with comments on the same line`,
      rule,
      {
        invalid: [
          {
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
          },
        ],
        valid: [],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): sorts interfaces with semi and comments on the same line`,
      rule,
      {
        invalid: [
          {
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
          },
        ],
        valid: [],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): does not sort call signature declarations`,
      rule,
      {
        valid: [
          {
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
          },
        ],
        invalid: [],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): allows to use new line as partition`,
      rule,
      {
        invalid: [
          {
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
          },
        ],
        valid: [
          {
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
          },
        ],
      },
    )

    ruleTester.run(`${ruleName}(${type}): sorts interface properties`, rule, {
      invalid: [
        {
          errors: [
            {
              data: {
                right: 'c',
                left: 'b',
              },
              messageId: 'unexpectedInterfacePropertiesOrder',
            },
          ],
          output: dedent`
            interface Interface {
              a?: string
              c?: string
              d?: string
              e?(): void
              b: string
            }
          `,
          code: dedent`
            interface Interface {
              a?: string
              b: string
              c?: string
              d?: string
              e?(): void
            }
          `,
          options: [
            {
              ...options,
              groupKind: 'optional-first',
            },
          ],
        },
      ],
      valid: [
        {
          code: dedent`
            interface Interface {
              a?: string
              [index: number]: string
            }
          `,
          options: [
            {
              ...options,
              groupKind: 'optional-first',
            },
          ],
        },
      ],
    })

    ruleTester.run(
      `${ruleName}(${type}): allows to use partition comments`,
      rule,
      {
        invalid: [
          {
            output: dedent`
              interface MyInterface {
                // Part: A
                // Not partition comment
                bbb: boolean;
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
                bbb: boolean;
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
          },
        ],
        valid: [],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): allows to use all comments as parts`,
      rule,
      {
        valid: [
          {
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
          },
        ],
        invalid: [],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): allows to use multiple partition comments`,
      rule,
      {
        invalid: [
          {
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
          },
        ],
        valid: [],
      },
    )

    ruleTester.run(`${ruleName}(${type}): allows to use method group`, rule, {
      valid: [
        {
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
        },
      ],
      invalid: [],
    })
  })

  describe(`${ruleName}: sorts by custom alphabet`, () => {
    let type = 'custom'

    let alphabet = Alphabet.generateRecommendedAlphabet()
      .sortByLocaleCompare('en-US')
      .getCharacters()
    let options = {
      type: 'custom',
      order: 'asc',
      alphabet,
    } as const

    ruleTester.run(`${ruleName}(${type}): sorts interface properties`, rule, {
      invalid: [
        {
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
        },
      ],
      valid: [
        {
          code: dedent`
            interface Interface {
              a: string
            }
          `,
          options: [options],
        },
        {
          code: dedent`
            interface Interface {
              a: string
              b: 'b1' | 'b2',
              c: string
            }
          `,
          options: [options],
        },
      ],
    })
  })

  describe(`${ruleName}: sorting by line length`, () => {
    let type = 'line-length-order'

    let options = {
      type: 'line-length',
      order: 'desc',
    } as const

    ruleTester.run(`${ruleName}(${type}): sorts interface properties`, rule, {
      invalid: [
        {
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
        },
      ],
      valid: [
        {
          code: dedent`
            interface Interface {
              b: 'b1' | 'b2',
              a: string
              c: string
            }
          `,
          options: [options],
        },
      ],
    })

    ruleTester.run(
      `${ruleName}(${type}): takes into account the presence of an optional operator`,
      rule,
      {
        invalid: [
          {
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
                b?: string
                a: string
              }
            `,
            code: dedent`
              interface Interface {
                a: string
                b?: string
              }
            `,
            options: [options],
          },
        ],
        valid: [
          {
            code: dedent`
              interface Interface {
                a: string
                b: string
              }
            `,
            options: [options],
          },
          {
            code: dedent`
              interface Interface {
                b: string
                a: string
              }
            `,
            options: [options],
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): works with ts index signature`,
      rule,
      {
        invalid: [
          {
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
          },
        ],
        valid: [
          {
            code: dedent`
              interface Interface {
                [key in Object]: string
                a: 'a'
              }
            `,
            options: [options],
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): works with method and construct signatures`,
      rule,
      {
        invalid: [
          {
            errors: [
              {
                data: {
                  right: 'c',
                  left: 'a',
                },
                messageId: 'unexpectedInterfacePropertiesOrder',
              },
            ],
            output: dedent`
              interface Interface {
                b: () => void
                c(): number
                d: string
                a: number
                e()
              }
            `,
            code: dedent`
              interface Interface {
                b: () => void
                d: string
                a: number
                c(): number
                e()
              }
            `,
            options: [options],
          },
        ],
        valid: [
          {
            code: dedent`
              interface Interface {
                b: () => void
                c(): number
                a: number
                d: string
                e()
              }
            `,
            options: [options],
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): works with empty properties with empty values`,
      rule,
      {
        invalid: [
          {
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
          },
        ],
        valid: [
          {
            code: dedent`
              interface Interface {
                a: 10 | 20 | 30
                [...other]
                [v in V]?
                b: string
                [d in D]
              }
            `,
            options: [options],
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): does not break interface docs`,
      rule,
      {
        invalid: [
          {
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
          },
        ],
        valid: [],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): sorts interfaces with comments on the same line`,
      rule,
      {
        invalid: [
          {
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
          },
        ],
        valid: [],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): sorts interfaces with semi and comments on the same line`,
      rule,
      {
        invalid: [
          {
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
          },
        ],
        valid: [],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): does not sort call signature declarations`,
      rule,
      {
        valid: [
          {
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
          },
        ],
        invalid: [],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): allows to set groups for sorting`,
      rule,
      {
        invalid: [
          {
            errors: [
              {
                data: {
                  rightGroup: 'multiline',
                  leftGroup: 'unknown',
                  right: 'd',
                  left: 'c',
                },
                messageId: 'unexpectedInterfacePropertiesGroupOrder',
              },
              {
                data: {
                  leftGroup: 'multiline',
                  rightGroup: 'g',
                  right: 'g',
                  left: 'd',
                },
                messageId: 'unexpectedInterfacePropertiesGroupOrder',
              },
            ],
            output: dedent`
              interface Interface {
                g: 'g'
                d: {
                  e: 'e'
                  f: 'f'
                }
                a: 'aaa'
                b: 'bb'
                c: 'c'
              }
            `,
            code: dedent`
              interface Interface {
                a: 'aaa'
                b: 'bb'
                c: 'c'
                d: {
                  e: 'e'
                  f: 'f'
                }
                g: 'g'
              }
            `,
            options: [
              {
                ...options,
                customGroups: {
                  g: 'g',
                },
                groups: ['g', 'multiline', 'unknown'],
              },
            ],
          },
        ],
        valid: [
          {
            code: dedent`
              interface Interface {
                g: 'g'
                d: {
                  e: 'e'
                  f: 'f'
                }
                a: 'aaa'
                b: 'bb'
                c: 'c'
              }
            `,
            options: [
              {
                ...options,
                customGroups: {
                  g: 'g',
                },
                groups: ['g', 'multiline', 'unknown'],
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): allows to use new line as partition`,
      rule,
      {
        invalid: [
          {
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
          },
        ],
        valid: [
          {
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
          },
        ],
      },
    )

    ruleTester.run(`${ruleName}(${type}): sorts interface properties`, rule, {
      invalid: [
        {
          errors: [
            {
              data: {
                right: 'c',
                left: 'b',
              },
              messageId: 'unexpectedInterfacePropertiesOrder',
            },
          ],
          output: dedent`
            interface Interface {
              a?: string
              c?: string
              d?: string
              e?(): void
              b: string
            }
          `,
          code: dedent`
            interface Interface {
              a?: string
              b: string
              c?: string
              d?: string
              e?(): void
            }
          `,
          options: [
            {
              ...options,
              groupKind: 'optional-first',
            },
          ],
        },
      ],
      valid: [
        {
          code: dedent`
            interface Interface {
              a?: string
              [index: number]: string
            }
          `,
          options: [
            {
              ...options,
              groupKind: 'optional-first',
            },
          ],
        },
      ],
    })

    ruleTester.run(`${ruleName}(${type}): sorts interface properties`, rule, {
      invalid: [
        {
          errors: [
            {
              data: {
                left: 'backgroundColor',
                right: 'label',
              },
              messageId: 'unexpectedInterfacePropertiesOrder',
            },
            {
              data: {
                left: 'primary',
                right: 'size',
              },
              messageId: 'unexpectedInterfacePropertiesOrder',
            },
          ],
          output: dedent`
            interface ButtonProps {
              label: string
              size?: 'large' | 'medium' | 'small'
              backgroundColor?: string
              primary?: boolean
              onClick?(): void
            }
          `,
          code: dedent`
            interface ButtonProps {
              backgroundColor?: string
              label: string
              primary?: boolean
              size?: 'large' | 'medium' | 'small'
              onClick?(): void
            }
          `,
          options: [
            {
              ...options,
              groupKind: 'required-first',
            },
          ],
        },
      ],
      valid: [
        {
          code: dedent`
            interface X {
              [index: number]: string
              a?: string
            }
          `,
          options: [
            {
              ...options,
              groupKind: 'required-first',
            },
          ],
        },
      ],
    })

    ruleTester.run(
      `${ruleName}(${type}): allows to set groups for sorting`,
      rule,
      {
        invalid: [
          {
            errors: [
              {
                data: {
                  left: 'backgroundColor',
                  right: 'label',
                },
                messageId: 'unexpectedInterfacePropertiesOrder',
              },
              {
                data: {
                  left: 'primary',
                  right: 'size',
                },
                messageId: 'unexpectedInterfacePropertiesOrder',
              },
            ],
            output: dedent`
              interface ButtonProps {
                label: string
                size?: 'large' | 'medium' | 'small'
                backgroundColor?: string
                primary?: boolean
                onClick?(): void
              }
            `,
            code: dedent`
              interface ButtonProps {
                backgroundColor?: string
                label: string
                primary?: boolean
                size?: 'large' | 'medium' | 'small'
                onClick?(): void
              }
            `,
            options: [
              {
                ...options,
                customGroups: {
                  callback: '^on.+',
                },
                groups: ['unknown', 'callback'],
                groupKind: 'required-first',
              },
            ],
          },
        ],
        valid: [],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): allows to use new line as partition`,
      rule,
      {
        invalid: [
          {
            errors: [
              {
                data: {
                  left: 'firstName',
                  right: 'id',
                },
                messageId: 'unexpectedInterfacePropertiesOrder',
              },
              {
                data: {
                  right: 'password',
                  left: 'lastName',
                },
                messageId: 'unexpectedInterfacePropertiesOrder',
              },
              {
                data: {
                  right: 'createdAt',
                  left: 'avatarUrl',
                },
                messageId: 'unexpectedInterfacePropertiesOrder',
              },
            ],
            output: dedent`
              interface User {
                password: string
                username: string
                email: string
                id: number
                firstName?: string
                lastName?: string

                createdAt: Date
                updatedAt: Date
                biography?: string
                avatarUrl?: string
              }
            `,
            code: dedent`
              interface User {
                email: string
                firstName?: string
                id: number
                lastName?: string
                password: string
                username: string

                biography?: string
                avatarUrl?: string
                createdAt: Date
                updatedAt: Date
              }
            `,
            options: [
              {
                ...options,
                groupKind: 'required-first',
                partitionByNewLine: true,
              },
            ],
          },
        ],
        valid: [],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): allows to use partition comments`,
      rule,
      {
        invalid: [
          {
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
          },
        ],
        valid: [],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): allows to use all comments as parts`,
      rule,
      {
        valid: [
          {
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
          },
        ],
        invalid: [],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): allows to use multiple partition comments`,
      rule,
      {
        invalid: [
          {
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
          },
        ],
        valid: [],
      },
    )

    ruleTester.run(`${ruleName}(${type}): allows to use method group`, rule, {
      valid: [
        {
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
        },
      ],
      invalid: [],
    })

    ruleTester.run(
      `${ruleName}(${type}): handles "fallbackSort" option`,
      rule,
      {
        invalid: [
          {
            errors: [
              {
                data: {
                  right: 'bb',
                  left: 'a',
                },
                messageId: 'unexpectedInterfacePropertiesOrder',
              },
            ],
            options: [
              {
                ...options,
                fallbackSort: {
                  type: 'alphabetical',
                },
              },
            ],
            output: dedent`
              interface Interface {
                bb: string;
                c: string;
                a: string;
              }
            `,
            code: dedent`
              interface Interface {
                a: string;
                bb: string;
                c: string;
              }
            `,
          },
          {
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
                fallbackSort: {
                  type: 'alphabetical',
                  order: 'asc',
                },
              },
            ],
            output: dedent`
              interface Interface {
                bb: string;
                a: string;
                c: string;
              }
            `,
            code: dedent`
              interface Interface {
                c: string;
                bb: string;
                a: string;
              }
            `,
          },
          {
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
                fallbackSort: {
                  type: 'alphabetical',
                  sortBy: 'value',
                },
              },
            ],
            output: dedent`
              interface Interface {
                bb: string;
                c: boolean;
                a: number;
              }
            `,
            code: dedent`
              interface Interface {
                c: boolean;
                bb: string;
                a: number;
              }
            `,
          },
        ],
        valid: [],
      },
    )
  })

  describe(`${ruleName}: unsorted type`, () => {
    let type = 'unsorted'

    let options = {
      type: 'unsorted',
      order: 'asc',
    } as const

    ruleTester.run(`${ruleName}(${type}): does not enforce sorting`, rule, {
      valid: [
        {
          code: dedent`
            interface Interface {
              b: string;
              c: string;
              a: string;
            }
          `,
          options: [options],
        },
      ],
      invalid: [],
    })

    ruleTester.run(`${ruleName}(${type}): enforces grouping`, rule, {
      invalid: [
        {
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
        },
      ],
      valid: [],
    })

    ruleTester.run(`${ruleName}(${type}): enforces newlines between`, rule, {
      invalid: [
        {
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
              newlinesBetween: 'always',
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
        },
      ],
      valid: [],
    })
  })

  describe(`${ruleName}: validating group configuration`, () => {
    ruleTester.run(
      `${ruleName}: allows predefined groups and defined custom groups`,
      rule,
      {
        valid: [
          {
            options: [
              {
                customGroups: {
                  myCustomGroup: 'x',
                },
                groups: ['multiline', 'unknown', 'myCustomGroup'],
              },
            ],
            code: dedent`
              interface Interface {
                a: string
                b: 'b1' | 'b2',
                c: string
              }
            `,
          },
        ],
        invalid: [],
      },
    )
  })

  describe(`${ruleName}: misc`, () => {
    it('validates the JSON schema', async () => {
      await expect(
        validateRuleJsonSchema(rule.meta.schema),
      ).resolves.not.toThrow()
    })
    ruleTester.run(
      `${ruleName}: sets alphabetical asc sorting as default`,
      rule,
      {
        invalid: [
          {
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
          },
        ],
        valid: [
          dedent`
            interface Interface {
              a: string
              b: string
            }
          `,
          {
            code: dedent`
              interface Calculator {
                log: (x: number) => number,
                log10: (x: number) => number,
                log1p: (x: number) => number,
                log2: (x: number) => number,
              }
            `,
            options: [{}],
          },
        ],
      },
    )

    ruleTester.run(`${ruleName}: allows to ignore interfaces`, rule, {
      valid: [
        {
          options: [
            {
              ignorePattern: ['Ignore'],
              type: 'line-length',
              order: 'desc',
            },
          ],
          code: dedent`
            interface IgnoreInterface {
              b: 'b'
              a: 'aaa'
            }
          `,
        },
      ],
      invalid: [],
    })

    let eslintDisableRuleTesterName = `${ruleName}: supports 'eslint-disable' for individual nodes`
    ruleTester.run(eslintDisableRuleTesterName, rule, {
      invalid: [
        {
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
        },
        {
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
        },
        {
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
        },
        {
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
        },
        {
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
        },
        {
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
        },
        {
          output: dedent`
            interface Interface {
              b: string
              c: string
              // eslint-disable-next-line @rule-tester/${eslintDisableRuleTesterName}
              a: string
            }
          `,
          code: dedent`
            interface Interface {
              c: string
              b: string
              // eslint-disable-next-line @rule-tester/${eslintDisableRuleTesterName}
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
        },
        {
          output: dedent`
            interface Interface {
              b: string
              c: string
              a: string // eslint-disable-line @rule-tester/${eslintDisableRuleTesterName}
            }
          `,
          code: dedent`
            interface Interface {
              c: string
              b: string
              a: string // eslint-disable-line @rule-tester/${eslintDisableRuleTesterName}
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
        },
        {
          output: dedent`
            interface Interface {
              b: string
              c: string
              /* eslint-disable-next-line @rule-tester/${eslintDisableRuleTesterName} */
              a: string
            }
          `,
          code: dedent`
            interface Interface {
              c: string
              b: string
              /* eslint-disable-next-line @rule-tester/${eslintDisableRuleTesterName} */
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
        },
        {
          output: dedent`
            interface Interface {
              b: string
              c: string
              a: string /* eslint-disable-line @rule-tester/${eslintDisableRuleTesterName} */
            }
          `,
          code: dedent`
            interface Interface {
              c: string
              b: string
              a: string /* eslint-disable-line @rule-tester/${eslintDisableRuleTesterName} */
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
        },
        {
          output: dedent`
            interface Interface {
              a: string
              d: string
              /* eslint-disable @rule-tester/${eslintDisableRuleTesterName} */
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
              /* eslint-disable @rule-tester/${eslintDisableRuleTesterName} */
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
        },
      ],
      valid: [
        {
          code: dedent`
            interface Interface {
              b: string;
              c: string;
              // eslint-disable-next-line
              a: string;
            }
          `,
        },
      ],
    })
  })
})
