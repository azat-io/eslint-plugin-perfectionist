import { RuleTester } from '@typescript-eslint/rule-tester'
import { afterAll, describe, it } from 'vitest'
import { dedent } from 'ts-dedent'

import rule from '../rules/sort-object-types'
import { Alphabet } from '../utils/alphabet'

let ruleName = 'sort-object-types'

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

    let options = {
      type: 'alphabetical',
      ignoreCase: true,
      order: 'asc',
    } as const

    ruleTester.run(`${ruleName}(${type}): sorts type members`, rule, {
      invalid: [
        {
          errors: [
            {
              data: {
                right: 'b',
                left: 'c',
              },
              messageId: 'unexpectedObjectTypesOrder',
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
        },
      ],
      valid: [
        {
          code: dedent`
            type Type = {
              a: 'aaa'
              b: 'bb'
              c: 'c'
            }
          `,
          options: [options],
        },
      ],
    })

    ruleTester.run(
      `${ruleName}(${type}): sorts type members in function args`,
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
                messageId: 'unexpectedObjectTypesOrder',
              },
            ],
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
            options: [options],
          },
        ],
        valid: [
          {
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
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): sorts type members with computed keys`,
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
          },
        ],
        valid: [
          {
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
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): sorts type members with any key types`,
      rule,
      {
        invalid: [
          {
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
                data: {
                  right: 'arrowFunc',
                  left: 'func',
                },
                messageId: 'unexpectedObjectTypesOrder',
              },
            ],
            options: [options],
          },
        ],
        valid: [
          {
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
          },
        ],
      },
    )

    ruleTester.run(`${ruleName}(${type}): sorts inline type members`, rule, {
      invalid: [
        {
          errors: [
            {
              data: {
                right: 'a',
                left: 'b',
              },
              messageId: 'unexpectedObjectTypesOrder',
            },
          ],
          output: dedent`
            func<{ a: 'aa'; b: 'b'; }>(/* ... */)
          `,
          code: dedent`
            func<{ b: 'b'; a: 'aa' }>(/* ... */)
          `,
          options: [options],
        },
      ],
      valid: [
        {
          code: dedent`
            func<{ a: 'aa'; b: 'b' }>(/* ... */)
          `,
          options: [options],
        },
      ],
    })

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
                messageId: 'unexpectedObjectTypesGroupOrder',
              },
              {
                data: {
                  rightGroup: 'optional-multiline',
                  leftGroup: 'index-signature',
                  left: '[key: string]',
                  right: 'b',
                },
                messageId: 'unexpectedObjectTypesGroupOrder',
              },
              {
                data: {
                  leftGroup: 'optional-multiline',
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
                  'optional-multiline',
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
                  messageId: 'unexpectedObjectTypesGroupOrder',
                },
              ],
              output: dedent`
                type Type = {
                  [key: string]: string;
                  multilineProperty: {
                    a: string
                  }
                }
              `,
              code: dedent`
                type Type = {
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
                  messageId: 'unexpectedObjectTypesGroupOrder',
                },
              ],
              output: dedent`
                type Type = {
                  method(): string
                  multilineProperty: {
                    a: string
                  }
                }
              `,
              code: dedent`
                type Type = {
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
                  messageId: 'unexpectedObjectTypesGroupOrder',
                },
              ],
              output: dedent`
                type Type = {
                  multilineProperty: {
                    a: string
                  }
                  property: string
                }
              `,
              code: dedent`
                type Type = {
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
                messageId: 'unexpectedObjectTypesGroupOrder',
              },
              {
                data: {
                  leftGroup: 'multiline',
                  rightGroup: 'g',
                  right: 'g',
                  left: 'd',
                },
                messageId: 'unexpectedObjectTypesGroupOrder',
              },
            ],
            output: dedent`
              type Type = {
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
              type Type = {
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
              type Type = {
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
          },
        ],
        valid: [],
      })

      ruleTester.run(`${ruleName}: filters on elementNamePattern`, rule, {
        invalid: [
          {
            options: [
              {
                customGroups: [
                  {
                    groupName: 'propertiesStartingWithHello',
                    elementNamePattern: 'hello*',
                    selector: 'property',
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
          },
        ],
        valid: [],
      })

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
                  messageId: 'unexpectedObjectTypesOrder',
                },
                {
                  data: {
                    right: 'ccc',
                    left: 'bb',
                  },
                  messageId: 'unexpectedObjectTypesOrder',
                },
                {
                  data: {
                    right: 'dddd',
                    left: 'ccc',
                  },
                  messageId: 'unexpectedObjectTypesOrder',
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
                messageId: 'unexpectedObjectTypesGroupOrder',
              },
              {
                data: {
                  right: '[key: string]',
                  left: 'e',
                },
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
              type Type = {
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
              type T = {
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
      `${ruleName}(${type}): allows to use in class methods`,
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
                messageId: 'unexpectedObjectTypesOrder',
              },
            ],
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
            options: [options],
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
                  right: 'd',
                  left: 'e',
                },
                messageId: 'unexpectedObjectTypesOrder',
              },
              {
                data: {
                  right: 'a',
                  left: 'b',
                },
                messageId: 'unexpectedObjectTypesOrder',
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
          },
        ],
        valid: [
          {
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
          },
        ],
      },
    )

    describe(`${ruleName}(${type}): partition comments`, () => {
      ruleTester.run(
        `${ruleName}(${type}): allows to use partition comments`,
        rule,
        {
          invalid: [
            {
              errors: [
                {
                  data: {
                    right: 'bbb',
                    left: 'd',
                  },
                  messageId: 'unexpectedObjectTypesOrder',
                },
                {
                  data: {
                    right: 'fff',
                    left: 'gg',
                  },
                  messageId: 'unexpectedObjectTypesOrder',
                },
              ],
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
              options: [
                {
                  ...options,
                  partitionByComment: '^Part*',
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
                  data: {
                    right: 'bb',
                    left: 'c',
                  },
                  messageId: 'unexpectedObjectTypesOrder',
                },
              ],
              options: [
                {
                  ...options,
                  partitionByComment: ['Partition Comment', 'Part: *', 'Other'],
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
            },
          ],
          invalid: [],
        },
      )
    })

    ruleTester.run(
      `${ruleName}(${type}): allows to sort required values first`,
      rule,
      {
        invalid: [
          {
            errors: [
              {
                data: {
                  left: 'bbbb',
                  right: 'ccc',
                },
                messageId: 'unexpectedObjectTypesOrder',
              },
              {
                data: {
                  left: 'dd',
                  right: 'e',
                },
                messageId: 'unexpectedObjectTypesOrder',
              },
            ],
            output: dedent`
              type Type = {
                ccc: string
                e: string
                aaaaa?: string
                bbbb?: string
                dd?: string
              }
            `,
            code: dedent`
              type Type = {
                aaaaa?: string
                bbbb?: string
                ccc: string
                dd?: string
                e: string
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
              type Type = {
                ccc: string
                e: string
                aaaaa?: string
                bbbb?: string
                dd?: string
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
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): allows to sort optional values first`,
      rule,
      {
        invalid: [
          {
            errors: [
              {
                data: {
                  left: 'ccc',
                  right: 'dd',
                },
                messageId: 'unexpectedObjectTypesOrder',
              },
            ],
            output: dedent`
              type Type = {
                aaaaa?: string
                bbbb?: string
                dd?: string
                ccc: string
                e: string
              }
            `,
            code: dedent`
              type Type = {
                aaaaa?: string
                bbbb?: string
                ccc: string
                dd?: string
                e: string
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
              type Type = {
                aaaaa?: string
                bbbb?: string
                dd?: string
                ccc: string
                e: string
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
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): allows to trim special characters`,
      rule,
      {
        valid: [
          {
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
          },
        ],
        invalid: [],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): allows to remove special characters`,
      rule,
      {
        valid: [
          {
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
          },
        ],
        invalid: [],
      },
    )

    ruleTester.run(`${ruleName}(${type}): allows to use locale`, rule, {
      valid: [
        {
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
        },
      ],
      invalid: [],
    })

    ruleTester.run(`${ruleName}(${type}): allows to use method group`, rule, {
      valid: [
        {
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
        },
      ],
      invalid: [],
    })

    describe(`${ruleName}: newlinesBetween`, () => {
      ruleTester.run(
        `${ruleName}(${type}): removes newlines when never`,
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
                  messageId: 'extraSpacingBetweenObjectTypeMembers',
                },
                {
                  data: {
                    right: 'b',
                    left: 'z',
                  },
                  messageId: 'unexpectedObjectTypesOrder',
                },
                {
                  data: {
                    right: 'b',
                    left: 'z',
                  },
                  messageId: 'extraSpacingBetweenObjectTypeMembers',
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
                  newlinesBetween: 'never',
                },
              ],
            },
          ],
          valid: [],
        },
      )

      ruleTester.run(
        `${ruleName}(${type}): keeps one newline when always`,
        rule,
        {
          invalid: [
            {
              errors: [
                {
                  data: {
                    right: 'z',
                    left: 'a',
                  },
                  messageId: 'extraSpacingBetweenObjectTypeMembers',
                },
                {
                  data: {
                    right: 'y',
                    left: 'z',
                  },
                  messageId: 'unexpectedObjectTypesOrder',
                },
                {
                  data: {
                    right: 'b',
                    left: 'y',
                  },
                  messageId: 'missedSpacingBetweenObjectTypeMembers',
                },
              ],
              output: dedent`
                type Type = {
                  a: () => null,

                 y: "y",
                z: "z",

                    b: {
                      // Newline stuff
                    },
                }
                `,
              code: dedent`
                type Type = {
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
                  newlinesBetween: 'always',
                },
              ],
            },
          ],
          valid: [],
        },
      )
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
                messageId: 'unexpectedObjectTypesOrder',
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
          },
          {
            errors: [
              {
                data: {
                  right: 'a',
                  left: 'b',
                },
                messageId: 'unexpectedObjectTypesOrder',
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
          },
          {
            errors: [
              {
                data: {
                  right: 'a',
                  left: 'b',
                },
                messageId: 'unexpectedObjectTypesOrder',
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
              type Type = {
                new (value: number | string): number;
                new (value: number): unknown;
              }
            `,
            options: [options],
          },
          {
            code: dedent`
              type Type = {
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

    describe(`${ruleName}(${type}): allows to use 'useConfigurationIf'`, () => {
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
                    allNamesMatchPattern: '^r|g|b$',
                  },
                  groups: ['r', 'g', 'b'],
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
            },
          ],
          valid: [],
        },
      )

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
                      declarationMatchesPattern: '^Type$',
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
                    messageId: 'unexpectedObjectTypesOrder',
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
              },
            ],
            valid: [
              {
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
              },
            ],
          },
        )

        ruleTester.run(
          `${ruleName}(${type}): does not match configuration if no declaration name`,
          rule,
          {
            invalid: [
              {
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
                    data: {
                      right: 'b',
                      left: 'c',
                    },
                    messageId: 'unexpectedObjectTypesOrder',
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
              },
            ],
            valid: [],
          },
        )
      })
    })
  })

  describe(`${ruleName}: sorting by natural order`, () => {
    let type = 'natural-order'

    let options = {
      ignoreCase: true,
      type: 'natural',
      order: 'asc',
    } as const

    ruleTester.run(`${ruleName}(${type}): sorts type members`, rule, {
      invalid: [
        {
          errors: [
            {
              data: {
                right: 'b',
                left: 'c',
              },
              messageId: 'unexpectedObjectTypesOrder',
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
        },
      ],
      valid: [
        {
          code: dedent`
            type Type = {
              a: 'aaa'
              b: 'bb'
              c: 'c'
            }
          `,
          options: [options],
        },
      ],
    })

    ruleTester.run(
      `${ruleName}(${type}): sorts type members in function args`,
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
                messageId: 'unexpectedObjectTypesOrder',
              },
            ],
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
            options: [options],
          },
        ],
        valid: [
          {
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
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): sorts type members with computed keys`,
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
          },
        ],
        valid: [
          {
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
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): sorts type members with any key types`,
      rule,
      {
        invalid: [
          {
            errors: [
              {
                data: {
                  left: '[name in v]',
                  right: '8',
                },
                messageId: 'unexpectedObjectTypesOrder',
              },
              {
                data: {
                  right: 'arrowFunc',
                  left: 'func',
                },
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
          },
        ],
        valid: [
          {
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
          },
        ],
      },
    )

    ruleTester.run(`${ruleName}(${type}): sorts inline type members`, rule, {
      invalid: [
        {
          errors: [
            {
              data: {
                right: 'a',
                left: 'b',
              },
              messageId: 'unexpectedObjectTypesOrder',
            },
          ],
          output: dedent`
            func<{ a: 'aa'; b: 'b'; }>(/* ... */)
          `,
          code: dedent`
            func<{ b: 'b'; a: 'aa' }>(/* ... */)
          `,
          options: [options],
        },
      ],
      valid: [
        {
          code: dedent`
            func<{ a: 'aa'; b: 'b' }>(/* ... */)
          `,
          options: [options],
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
                  leftGroup: 'unknown',
                  rightGroup: 'b',
                  right: 'b',
                  left: 'a',
                },
                messageId: 'unexpectedObjectTypesGroupOrder',
              },
              {
                data: {
                  right: 'e',
                  left: 'f',
                },
                messageId: 'unexpectedObjectTypesOrder',
              },
            ],
            output: [
              dedent`
                type Type = {
                  b: 'bb'
                  a: 'aaa'
                  c: 'c'
                  d: {
                    e: 'ee'
                    f: 'f'
                  }
                }
              `,
            ],
            code: dedent`
              type Type = {
                a: 'aaa'
                b: 'bb'
                c: 'c'
                d: {
                  f: 'f'
                  e: 'ee'
                }
              }
            `,
            options: [
              {
                ...options,
                customGroups: {
                  b: 'b',
                },
                groups: ['b', 'unknown', 'multiline'],
              },
            ],
          },
        ],
        valid: [
          {
            code: dedent`
              type Type = {
                b: 'bb'
                a: 'aaa'
                c: 'c'
                d: {
                  e: 'ee'
                  f: 'f'
                }
              }
            `,
            options: [
              {
                ...options,
                customGroups: {
                  b: 'b',
                },
                groups: ['b', 'unknown', 'multiline'],
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
                  right: 'd',
                  left: 'e',
                },
                messageId: 'unexpectedObjectTypesOrder',
              },
              {
                data: {
                  right: 'a',
                  left: 'b',
                },
                messageId: 'unexpectedObjectTypesOrder',
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
          },
        ],
        valid: [
          {
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
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): allows to sort required values first`,
      rule,
      {
        invalid: [
          {
            errors: [
              {
                data: {
                  left: 'bbbb',
                  right: 'ccc',
                },
                messageId: 'unexpectedObjectTypesOrder',
              },
              {
                data: {
                  left: 'dd',
                  right: 'e',
                },
                messageId: 'unexpectedObjectTypesOrder',
              },
            ],
            output: dedent`
              type Type = {
                ccc: string
                e: string
                aaaaa?: string
                bbbb?: string
                dd?: string
              }
            `,
            code: dedent`
              type Type = {
                aaaaa?: string
                bbbb?: string
                ccc: string
                dd?: string
                e: string
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
              type Type = {
                ccc: string
                e: string
                aaaaa?: string
                bbbb?: string
                dd?: string
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
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): allows to sort optional values first`,
      rule,
      {
        invalid: [
          {
            errors: [
              {
                data: {
                  left: 'ccc',
                  right: 'dd',
                },
                messageId: 'unexpectedObjectTypesOrder',
              },
            ],
            output: dedent`
              type Type = {
                aaaaa?: string
                bbbb?: string
                dd?: string
                ccc: string
                e: string
              }
            `,
            code: dedent`
              type Type = {
                aaaaa?: string
                bbbb?: string
                ccc: string
                dd?: string
                e: string
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
              type Type = {
                aaaaa?: string
                bbbb?: string
                dd?: string
                ccc: string
                e: string
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
      },
    )

    ruleTester.run(`${ruleName}(${type}): allows to use method group`, rule, {
      valid: [
        {
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

    ruleTester.run(`${ruleName}(${type}): sorts type members`, rule, {
      invalid: [
        {
          errors: [
            {
              data: {
                right: 'b',
                left: 'c',
              },
              messageId: 'unexpectedObjectTypesOrder',
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
        },
      ],
      valid: [
        {
          code: dedent`
            type Type = {
              a: 'aaa'
              b: 'bb'
              c: 'c'
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

    ruleTester.run(`${ruleName}(${type}): sorts type members`, rule, {
      invalid: [
        {
          errors: [
            {
              data: {
                right: 'b',
                left: 'c',
              },
              messageId: 'unexpectedObjectTypesOrder',
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
        },
      ],
      valid: [
        {
          code: dedent`
            type Type = {
              a: 'aaa'
              b: 'bb'
              c: 'c'
            }
          `,
          options: [options],
        },
      ],
    })

    ruleTester.run(
      `${ruleName}(${type}): sorts type members in function args`,
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
                messageId: 'unexpectedObjectTypesOrder',
              },
            ],
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
            options: [options],
          },
        ],
        valid: [
          {
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
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): sorts type members with computed keys`,
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
                messageId: 'unexpectedObjectTypesOrder',
              },
              {
                data: {
                  right: 'value',
                  left: 'b',
                },
                messageId: 'unexpectedObjectTypesOrder',
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
          },
        ],
        valid: [
          {
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
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): sorts type members with any key types`,
      rule,
      {
        invalid: [
          {
            errors: [
              {
                data: {
                  left: '[...values]',
                  right: '[[data]]',
                },
                messageId: 'unexpectedObjectTypesOrder',
              },
              {
                data: {
                  right: 'func',
                  left: '8',
                },
                messageId: 'unexpectedObjectTypesOrder',
              },
              {
                data: {
                  right: 'arrowFunc',
                  left: 'func',
                },
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
          },
        ],
        valid: [
          {
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
          },
        ],
      },
    )

    ruleTester.run(`${ruleName}(${type}): sorts inline type members`, rule, {
      invalid: [
        {
          errors: [
            {
              data: {
                right: 'a',
                left: 'b',
              },
              messageId: 'unexpectedObjectTypesOrder',
            },
          ],
          output: dedent`
            func<{ a: 'aa'; b: 'b'; }>(/* ... */)
          `,
          code: dedent`
            func<{ b: 'b'; a: 'aa' }>(/* ... */)
          `,
          options: [options],
        },
      ],
      valid: [
        {
          code: dedent`
            func<{ a: 'aa'; b: 'b' }>(/* ... */)
          `,
          options: [options],
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
                  leftGroup: 'unknown',
                  rightGroup: 'b',
                  right: 'b',
                  left: 'a',
                },
                messageId: 'unexpectedObjectTypesGroupOrder',
              },
              {
                data: {
                  right: 'e',
                  left: 'f',
                },
                messageId: 'unexpectedObjectTypesOrder',
              },
            ],
            output: [
              dedent`
                type Type = {
                  b: 'bb'
                  a: 'aaa'
                  c: 'c'
                  d: {
                    e: 'ee'
                    f: 'f'
                  }
                }
              `,
            ],
            code: dedent`
              type Type = {
                a: 'aaa'
                b: 'bb'
                c: 'c'
                d: {
                  f: 'f'
                  e: 'ee'
                }
              }
            `,
            options: [
              {
                ...options,
                customGroups: {
                  b: 'b',
                },
                groups: ['b', 'unknown', 'multiline'],
              },
            ],
          },
        ],
        valid: [
          {
            code: dedent`
              type Type = {
                b: 'bb'
                a: 'aaa'
                c: 'c'
                d: {
                  e: 'ee'
                  f: 'f'
                }
              }
            `,
            options: [
              {
                ...options,
                customGroups: {
                  b: 'b',
                },
                groups: ['b', 'unknown', 'multiline'],
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
                  right: 'd',
                  left: 'e',
                },
                messageId: 'unexpectedObjectTypesOrder',
              },
              {
                data: {
                  right: 'a',
                  left: 'b',
                },
                messageId: 'unexpectedObjectTypesOrder',
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
          },
        ],
        valid: [
          {
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
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): allows to sort required values first`,
      rule,
      {
        invalid: [
          {
            errors: [
              {
                data: {
                  left: 'bbbb',
                  right: 'ccc',
                },
                messageId: 'unexpectedObjectTypesOrder',
              },
              {
                data: {
                  left: 'dd',
                  right: 'e',
                },
                messageId: 'unexpectedObjectTypesOrder',
              },
            ],
            output: dedent`
              type Type = {
                ccc: string
                e: string
                aaaaa?: string
                bbbb?: string
                dd?: string
              }
            `,
            code: dedent`
              type Type = {
                aaaaa?: string
                bbbb?: string
                ccc: string
                dd?: string
                e: string
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
              type Type = {
                ccc: string
                e: string
                aaaaa?: string
                bbbb?: string
                dd?: string
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
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): allows to sort optional values first`,
      rule,
      {
        invalid: [
          {
            errors: [
              {
                data: {
                  left: 'ccc',
                  right: 'dd',
                },
                messageId: 'unexpectedObjectTypesOrder',
              },
            ],
            output: dedent`
              type Type = {
                aaaaa?: string
                bbbb?: string
                dd?: string
                ccc: string
                e: string
              }
            `,
            code: dedent`
              type Type = {
                aaaaa?: string
                bbbb?: string
                ccc: string
                dd?: string
                e: string
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
              type Type = {
                aaaaa?: string
                bbbb?: string
                dd?: string
                ccc: string
                e: string
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
      },
    )

    ruleTester.run(`${ruleName}(${type}): allows to use method group`, rule, {
      valid: [
        {
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
        },
      ],
      invalid: [],
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
                groups: ['multiline', 'method', 'unknown', 'myCustomGroup'],
              },
            ],
            code: dedent`
            type Type = {
              a: 'aaa'
              b: 'bb'
              c: 'c'
            }
          `,
          },
        ],
        invalid: [],
      },
    )
  })

  describe('misc', () => {
    ruleTester.run(`${ruleName}: allows to use "unsorted" as type`, rule, {
      valid: [
        {
          code: dedent`
            type Type = {
              b: string;
              c: string;
              a: string;
            }
          `,
          options: [
            {
              type: 'unsorted',
            },
          ],
        },
      ],
      invalid: [],
    })

    ruleTester.run(`${ruleName}: ignores semi at the end of value`, rule, {
      valid: [
        dedent`
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
      ],
      invalid: [],
    })

    ruleTester.run(
      `${ruleName}: sets alphabetical asc sorting as default`,
      rule,
      {
        invalid: [
          {
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
                data: {
                  right: 'log10',
                  left: 'log2',
                },
                messageId: 'unexpectedObjectTypesOrder',
              },
            ],
          },
        ],
        valid: [
          dedent`
            type Calculator = {
              log: (x: number) => number,
              log10: (x: number) => number,
              log1p: (x: number) => number,
              log2: (x: number) => number,
            }
          `,
          {
            code: dedent`
              type Calculator = {
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

    ruleTester.run(`${ruleName}: allows to ignore object types`, rule, {
      valid: [
        {
          code: dedent`
            type IgnoreType = {
              b: 'b'
              a: 'a'
            }
          `,
          options: [
            {
              ignorePattern: ['Ignore'],
            },
          ],
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
              messageId: 'unexpectedObjectTypesOrder',
            },
          ],
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
          options: [{}],
        },
        {
          errors: [
            {
              data: {
                right: 'c',
                left: 'd',
              },
              messageId: 'unexpectedObjectTypesOrder',
            },
            {
              data: {
                right: 'b',
                left: 'a',
              },
              messageId: 'unexpectedObjectTypesOrder',
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
        },
        {
          errors: [
            {
              data: {
                right: 'b',
                left: 'c',
              },
              messageId: 'unexpectedObjectTypesOrder',
            },
          ],
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
          options: [{}],
        },
        {
          errors: [
            {
              data: {
                right: 'b',
                left: 'c',
              },
              messageId: 'unexpectedObjectTypesOrder',
            },
          ],
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
          options: [{}],
        },
        {
          errors: [
            {
              data: {
                right: 'b',
                left: 'c',
              },
              messageId: 'unexpectedObjectTypesOrder',
            },
          ],
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
          options: [{}],
        },
        {
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
              data: {
                right: 'a',
                left: 'b',
              },
              messageId: 'unexpectedObjectTypesOrder',
            },
          ],
          options: [{}],
        },
        {
          output: dedent`
            type Type = {
              b: string
              c: string
              // eslint-disable-next-line @rule-tester/${eslintDisableRuleTesterName}
              a: string
            }
          `,
          code: dedent`
            type Type = {
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
              messageId: 'unexpectedObjectTypesOrder',
            },
          ],
          options: [{}],
        },
        {
          output: dedent`
            type Type = {
              b: string
              c: string
              a: string // eslint-disable-line @rule-tester/${eslintDisableRuleTesterName}
            }
          `,
          code: dedent`
            type Type = {
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
              messageId: 'unexpectedObjectTypesOrder',
            },
          ],
          options: [{}],
        },
        {
          output: dedent`
            type Type = {
              b: string
              c: string
              /* eslint-disable-next-line @rule-tester/${eslintDisableRuleTesterName} */
              a: string
            }
          `,
          code: dedent`
            type Type = {
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
              messageId: 'unexpectedObjectTypesOrder',
            },
          ],
          options: [{}],
        },
        {
          output: dedent`
            type Type = {
              b: string
              c: string
              a: string /* eslint-disable-line @rule-tester/${eslintDisableRuleTesterName} */
            }
          `,
          code: dedent`
            type Type = {
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
              messageId: 'unexpectedObjectTypesOrder',
            },
          ],
          options: [{}],
        },
        {
          output: dedent`
            type Type = {
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
            type Type = {
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
              messageId: 'unexpectedObjectTypesOrder',
            },
          ],
          options: [{}],
        },
      ],
      valid: [],
    })
  })
})
