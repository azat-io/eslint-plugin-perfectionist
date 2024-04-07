import { RuleTester } from '@typescript-eslint/rule-tester'
import { afterAll, describe, it } from 'vitest'
import { dedent } from 'ts-dedent'

import rule, { RULE_NAME } from '../rules/sort-intersection-types'
import { SortOrder, SortType } from '../typings'

describe(RULE_NAME, () => {
  RuleTester.describeSkip = describe.skip
  RuleTester.afterAll = afterAll
  RuleTester.describe = describe
  RuleTester.itOnly = it.only
  RuleTester.itSkip = it.skip
  RuleTester.it = it

  let ruleTester = new RuleTester({
    parser: '@typescript-eslint/parser',
  })

  describe(`${RULE_NAME}: sorting by alphabetical order`, () => {
    let type = 'alphabetical-order'

    let options = {
      type: SortType.alphabetical,
      order: SortOrder.asc,
      'ignore-case': false,
    }

    ruleTester.run(`${RULE_NAME}(${type}: sorts intersection types`, rule, {
      valid: [
        {
          code: dedent`
            type Eternity = { label: Fushi } & { label: Gugu } & { label: Joaan } & { label: Parona }
          `,
          options: [options],
        },
      ],
      invalid: [
        {
          code: dedent`
            type Eternity = { label: Fushi } & { label: Joaan } & { label: Parona } & { label: Gugu }
          `,
          output: dedent`
            type Eternity = { label: Fushi } & { label: Gugu } & { label: Joaan } & { label: Parona }
          `,
          options: [options],
          errors: [
            {
              messageId: 'unexpectedIntersectionTypesOrder',
              data: {
                left: '{ label: Parona }',
                right: '{ label: Gugu }',
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(`${RULE_NAME}: sorts keyword intersection types`, rule, {
      valid: [],
      invalid: [
        {
          code: dedent`
            type Value =
              & { booleanValue: boolean }
              & { numberValue: number }
              & { stringValue: string }
              & { anyValue: any }
              & { unknownValue: unknown }
              & { nullValue: null }
              & { undefinedValue: undefined }
              & { neverValue: never }
              & { voidValue: void }
              & { bigintValue: bigint }
          `,
          output: dedent`
            type Value =
              & { anyValue: any }
              & { bigintValue: bigint }
              & { booleanValue: boolean }
              & { neverValue: never }
              & { nullValue: null }
              & { numberValue: number }
              & { stringValue: string }
              & { undefinedValue: undefined }
              & { unknownValue: unknown }
              & { voidValue: void }
          `,
          options: [options],
          errors: [
            {
              messageId: 'unexpectedIntersectionTypesOrder',
              data: {
                left: '{ stringValue: string }',
                right: '{ anyValue: any }',
              },
            },
            {
              messageId: 'unexpectedIntersectionTypesOrder',
              data: {
                left: '{ unknownValue: unknown }',
                right: '{ nullValue: null }',
              },
            },
            {
              messageId: 'unexpectedIntersectionTypesOrder',
              data: {
                left: '{ undefinedValue: undefined }',
                right: '{ neverValue: never }',
              },
            },
            {
              messageId: 'unexpectedIntersectionTypesOrder',
              data: {
                left: '{ voidValue: void }',
                right: '{ bigintValue: bigint }',
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(`${RULE_NAME}: works with generics`, rule, {
      valid: [],
      invalid: [
        {
          code: 'Omit<Arataka, PsychicAbilities & Power>',
          output: 'Omit<Arataka, Power & PsychicAbilities>',
          options: [options],
          errors: [
            {
              messageId: 'unexpectedIntersectionTypesOrder',
              data: {
                left: 'PsychicAbilities',
                right: 'Power',
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(`${RULE_NAME}: works with type references`, rule, {
      valid: [],
      invalid: [
        {
          code: 'type DemonSlayer = Tanjiro & Zenitsu & Inosuke',
          output: 'type DemonSlayer = Inosuke & Tanjiro & Zenitsu',
          options: [options],
          errors: [
            {
              messageId: 'unexpectedIntersectionTypesOrder',
              data: {
                left: 'Zenitsu',
                right: 'Inosuke',
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(`${RULE_NAME}: works with type references`, rule, {
      valid: [],
      invalid: [
        {
          code: dedent`
            type Character =
              & { name: IntelligentTitan, status: 'titan' }
              & { name: ErenYeager, species: 'human' }
          `,
          output: dedent`
            type Character =
              & { name: ErenYeager, species: 'human' }
              & { name: IntelligentTitan, status: 'titan' }
          `,
          options: [options],
          errors: [
            {
              messageId: 'unexpectedIntersectionTypesOrder',
              data: {
                left: "{ name: IntelligentTitan, status: 'titan' }",
                right: "{ name: ErenYeager, species: 'human' }",
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(`${RULE_NAME}: sorts intersections with parentheses`, rule, {
      valid: [],
      invalid: [
        {
          code: dedent`
            type HeroAssociation = {
              team:
                & Saitama
                & ((
                    superstrike: () => void,
                  ) => Hero & Saitama)
                & Hero
            }
          `,
          output: dedent`
            type HeroAssociation = {
              team:
                & ((
                    superstrike: () => void,
                  ) => Hero & Saitama)
                & Hero
                & Saitama
            }
          `,
          options: [options],
          errors: [
            {
              messageId: 'unexpectedIntersectionTypesOrder',
              data: {
                left: 'Saitama',
                right: '( superstrike: () => void, ) => Hero & Saitama',
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(
      `${RULE_NAME}: sorts intersections with comment at the end`,
      rule,
      {
        valid: [],
        invalid: [
          {
            code: dedent`
            type Step =  { value1: 1 } & { value2: 2 } & { value4: 4 } & { value3: 3 } & { value5: 5 } & { value100: 100 }; // Exam step. Example: 3
          `,
            output: dedent`
            type Step =  { value1: 1 } & { value100: 100 } & { value2: 2 } & { value3: 3 } & { value4: 4 } & { value5: 5 }; // Exam step. Example: 3
          `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedIntersectionTypesOrder',
                data: {
                  left: '{ value4: 4 }',
                  right: '{ value3: 3 }',
                },
              },
              {
                messageId: 'unexpectedIntersectionTypesOrder',
                data: {
                  left: '{ value5: 5 }',
                  right: '{ value100: 100 }',
                },
              },
            ],
          },
        ],
      },
    )
  })

  describe(`${RULE_NAME}: sorting by natural order`, () => {
    let type = 'natural-order'

    let options = {
      type: SortType.alphabetical,
      order: SortOrder.asc,
      'ignore-case': false,
    }

    ruleTester.run(`${RULE_NAME}(${type}: sorts intersection types`, rule, {
      valid: [
        {
          code: dedent`
            type Eternity = Fushi & Gugu & Joaan & Parona
          `,
          options: [options],
        },
      ],
      invalid: [
        {
          code: dedent`
            type Eternity = Fushi & Joaan & Parona & Gugu
          `,
          output: dedent`
            type Eternity = Fushi & Gugu & Joaan & Parona
          `,
          options: [options],
          errors: [
            {
              messageId: 'unexpectedIntersectionTypesOrder',
              data: {
                left: 'Parona',
                right: 'Gugu',
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(`${RULE_NAME}: sorts keyword intersection types`, rule, {
      valid: [],
      invalid: [
        {
          code: dedent`
            type Value =
              & boolean
              & number
              & string
              & any
              & unknown
              & null
              & undefined
              & never
              & void
              & bigint
          `,
          output: dedent`
            type Value =
              & any
              & bigint
              & boolean
              & never
              & null
              & number
              & string
              & undefined
              & unknown
              & void
          `,
          options: [options],
          errors: [
            {
              messageId: 'unexpectedIntersectionTypesOrder',
              data: {
                left: 'string',
                right: 'any',
              },
            },
            {
              messageId: 'unexpectedIntersectionTypesOrder',
              data: {
                left: 'unknown',
                right: 'null',
              },
            },
            {
              messageId: 'unexpectedIntersectionTypesOrder',
              data: {
                left: 'undefined',
                right: 'never',
              },
            },
            {
              messageId: 'unexpectedIntersectionTypesOrder',
              data: {
                left: 'void',
                right: 'bigint',
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(`${RULE_NAME}: works with generics`, rule, {
      valid: [],
      invalid: [
        {
          code: 'Omit<Arataka, PsychicAbilities & Power>',
          output: 'Omit<Arataka, Power & PsychicAbilities>',
          options: [options],
          errors: [
            {
              messageId: 'unexpectedIntersectionTypesOrder',
              data: {
                left: 'PsychicAbilities',
                right: 'Power',
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(`${RULE_NAME}: works with type references`, rule, {
      valid: [],
      invalid: [
        {
          code: 'type DemonSlayer = Tanjiro & Zenitsu & Inosuke',
          output: 'type DemonSlayer = Inosuke & Tanjiro & Zenitsu',
          options: [options],
          errors: [
            {
              messageId: 'unexpectedIntersectionTypesOrder',
              data: {
                left: 'Zenitsu',
                right: 'Inosuke',
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(`${RULE_NAME}: works with type references`, rule, {
      valid: [],
      invalid: [
        {
          code: dedent`
            type Character =
              & { name: IntelligentTitan, status: 'titan' }
              & { name: ErenYeager, species: 'human' }
          `,
          output: dedent`
            type Character =
              & { name: ErenYeager, species: 'human' }
              & { name: IntelligentTitan, status: 'titan' }
          `,
          options: [options],
          errors: [
            {
              messageId: 'unexpectedIntersectionTypesOrder',
              data: {
                left: "{ name: IntelligentTitan, status: 'titan' }",
                right: "{ name: ErenYeager, species: 'human' }",
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(`${RULE_NAME}: sorts intersections with parentheses`, rule, {
      valid: [],
      invalid: [
        {
          code: dedent`
            type HeroAssociation = {
              team:
                & Saitama
                & ((
                    superstrike: () => void,
                  ) => Hero & Saitama)
                & Hero
            }
          `,
          output: dedent`
            type HeroAssociation = {
              team:
                & ((
                    superstrike: () => void,
                  ) => Hero & Saitama)
                & Hero
                & Saitama
            }
          `,
          options: [options],
          errors: [
            {
              messageId: 'unexpectedIntersectionTypesOrder',
              data: {
                left: 'Saitama',
                right: '( superstrike: () => void, ) => Hero & Saitama',
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(
      `${RULE_NAME}: sorts intersections with comment at the end`,
      rule,
      {
        valid: [],
        invalid: [
          {
            code: dedent`
            type Step = { value1: 1 } & { value2: 2 } & { value4: 4 } & { value3: 3 } & { value5: 5 } & { value100: 100 }; // Exam step. Example: 3
          `,
            output: dedent`
            type Step = { value1: 1 } & { value100: 100 } & { value2: 2 } & { value3: 3 } & { value4: 4 } & { value5: 5 }; // Exam step. Example: 3
          `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedIntersectionTypesOrder',
                data: {
                  left: '{ value4: 4 }',
                  right: '{ value3: 3 }',
                },
              },
              {
                messageId: 'unexpectedIntersectionTypesOrder',
                data: {
                  left: '{ value5: 5 }',
                  right: '{ value100: 100 }',
                },
              },
            ],
          },
        ],
      },
    )
  })

  describe(`${RULE_NAME}: sorting by line length`, () => {
    let type = 'line-length-order'

    let options = {
      type: SortType['line-length'],
      order: SortOrder.desc,
    }

    ruleTester.run(`${RULE_NAME}(${type}: sorts intersection types`, rule, {
      valid: [
        {
          code: dedent`
              type Eternity = Parona & Joaan & Fushi & Gugu
            `,
          options: [options],
        },
      ],
      invalid: [
        {
          code: dedent`
            type Eternity = Fushi & Joaan & Parona & Gugu
          `,
          output: dedent`
            type Eternity = Parona & Fushi & Joaan & Gugu
          `,
          options: [options],
          errors: [
            {
              messageId: 'unexpectedIntersectionTypesOrder',
              data: {
                left: 'Joaan',
                right: 'Parona',
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(`${RULE_NAME}: sorts keyword intersection types`, rule, {
      valid: [],
      invalid: [
        {
          code: dedent`
            type Value =
              & boolean
              & number
              & string
              & any
              & unknown
              & null
              & undefined
              & never
              & void
              & bigint
          `,
          output: dedent`
            type Value =
              & undefined
              & boolean
              & unknown
              & number
              & string
              & bigint
              & never
              & null
              & void
              & any
          `,
          options: [options],
          errors: [
            {
              messageId: 'unexpectedIntersectionTypesOrder',
              data: {
                left: 'any',
                right: 'unknown',
              },
            },
            {
              messageId: 'unexpectedIntersectionTypesOrder',
              data: {
                left: 'null',
                right: 'undefined',
              },
            },
            {
              messageId: 'unexpectedIntersectionTypesOrder',
              data: {
                left: 'void',
                right: 'bigint',
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(`${RULE_NAME}: works with generics`, rule, {
      valid: [],
      invalid: [
        {
          code: 'Omit<Arataka, Power & PsychicAbilities>',
          output: 'Omit<Arataka, PsychicAbilities & Power>',
          options: [options],
          errors: [
            {
              messageId: 'unexpectedIntersectionTypesOrder',
              data: {
                left: 'Power',
                right: 'PsychicAbilities',
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(`${RULE_NAME}: works with type references`, rule, {
      valid: [
        {
          code: 'type DemonSlayer = Tanjiro & Zenitsu & Inosuke',
          options: [options],
        },
      ],
      invalid: [],
    })

    ruleTester.run(`${RULE_NAME}: works with type references`, rule, {
      valid: [],
      invalid: [
        {
          code: dedent`
            type Character =
              & { name: ErenYeager, species: 'human' }
              & { name: IntelligentTitan, status: 'titan' }
          `,
          output: dedent`
            type Character =
              & { name: IntelligentTitan, status: 'titan' }
              & { name: ErenYeager, species: 'human' }
          `,
          options: [options],
          errors: [
            {
              messageId: 'unexpectedIntersectionTypesOrder',
              data: {
                left: "{ name: ErenYeager, species: 'human' }",
                right: "{ name: IntelligentTitan, status: 'titan' }",
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(`${RULE_NAME}: sorts intersections with parentheses`, rule, {
      valid: [],
      invalid: [
        {
          code: dedent`
            type HeroAssociation = {
              team:
                & Saitama
                & ((
                    superstrike: () => void,
                  ) => Hero & Saitama)
                & Hero
            }
          `,
          output: dedent`
            type HeroAssociation = {
              team:
                & ((
                    superstrike: () => void,
                  ) => Hero & Saitama)
                & Saitama
                & Hero
            }
          `,
          options: [options],
          errors: [
            {
              messageId: 'unexpectedIntersectionTypesOrder',
              data: {
                left: 'Saitama',
                right: '( superstrike: () => void, ) => Hero & Saitama',
              },
            },
            {
              messageId: 'unexpectedIntersectionTypesOrder',
              data: {
                left: 'Hero',
                right: 'Saitama',
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(
      `${RULE_NAME}: sorts intersections with comment at the end`,
      rule,
      {
        valid: [],
        invalid: [
          {
            code: dedent`
            type Step = { value1: 1 } & { value2: 2 } & { value4: 4 } & { value3: 3 } & { value5: 5 } & { value100: 100 }; // Exam step. Example: 3
          `,
            output: dedent`
            type Step = { value100: 100 } & { value1: 1 } & { value2: 2 } & { value4: 4 } & { value3: 3 } & { value5: 5 }; // Exam step. Example: 3
          `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedIntersectionTypesOrder',
                data: {
                  left: '{ value5: 5 }',
                  right: '{ value100: 100 }',
                },
              },
            ],
          },
        ],
      },
    )
  })

  describe(`${RULE_NAME}: misc`, () => {
    ruleTester.run(
      `${RULE_NAME}: sets alphabetical asc sorting as default`,
      rule,
      {
        valid: [
          dedent`
            type SupportedNumberBase = NumberBase.BASE_10 & NumberBase.BASE_16 & NumberBase.BASE_2
          `,
          {
            code: dedent`
              type SupportedNumberBase = NumberBase.BASE_10 & NumberBase.BASE_16 & NumberBase.BASE_2
            `,
            options: [{}],
          },
        ],
        invalid: [
          {
            code: dedent`
              type SupportedNumberBase = NumberBase.BASE_2 & NumberBase.BASE_10 & NumberBase.BASE_16
            `,
            output: dedent`
              type SupportedNumberBase = NumberBase.BASE_10 & NumberBase.BASE_16 & NumberBase.BASE_2
            `,
            errors: [
              {
                messageId: 'unexpectedIntersectionTypesOrder',
                data: {
                  left: 'NumberBase.BASE_2',
                  right: 'NumberBase.BASE_10',
                },
              },
            ],
          },
        ],
      },
    )
  })
})
