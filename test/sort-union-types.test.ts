import { RuleTester } from '@typescript-eslint/rule-tester'
import { afterAll, describe, it } from 'vitest'
import { dedent } from 'ts-dedent'

import rule, { RULE_NAME } from '../rules/sort-union-types'
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
      ignoreCase: false,
    }

    ruleTester.run(`${RULE_NAME}(${type}: sorts union types`, rule, {
      valid: [
        {
          code: dedent`
            type Eternity = 'Fushi' | 'Gugu' | 'Joaan' | 'Parona'
          `,
          options: [options],
        },
      ],
      invalid: [
        {
          code: dedent`
            type Eternity = 'Fushi' | 'Joaan' | 'Parona' | 'Gugu'
          `,
          output: dedent`
            type Eternity = 'Fushi' | 'Gugu' | 'Joaan' | 'Parona'
          `,
          options: [options],
          errors: [
            {
              messageId: 'unexpectedUnionTypesOrder',
              data: {
                left: "'Parona'",
                right: "'Gugu'",
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(`${RULE_NAME}: sorts keyword union types`, rule, {
      valid: [],
      invalid: [
        {
          code: dedent`
            type Value =
              | boolean
              | number
              | string
              | any
              | unknown
              | null
              | undefined
              | never
              | void
              | bigint
          `,
          output: dedent`
            type Value =
              | any
              | bigint
              | boolean
              | never
              | null
              | number
              | string
              | undefined
              | unknown
              | void
          `,
          options: [options],
          errors: [
            {
              messageId: 'unexpectedUnionTypesOrder',
              data: {
                left: 'string',
                right: 'any',
              },
            },
            {
              messageId: 'unexpectedUnionTypesOrder',
              data: {
                left: 'unknown',
                right: 'null',
              },
            },
            {
              messageId: 'unexpectedUnionTypesOrder',
              data: {
                left: 'undefined',
                right: 'never',
              },
            },
            {
              messageId: 'unexpectedUnionTypesOrder',
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
          code: "Omit<Arataka, 'psychic-abilities' | 'power'>",
          output: "Omit<Arataka, 'power' | 'psychic-abilities'>",
          options: [options],
          errors: [
            {
              messageId: 'unexpectedUnionTypesOrder',
              data: {
                left: "'psychic-abilities'",
                right: "'power'",
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
          code: 'type DemonSlayer = Tanjiro | Zenitsu | Inosuke',
          output: 'type DemonSlayer = Inosuke | Tanjiro | Zenitsu',
          options: [options],
          errors: [
            {
              messageId: 'unexpectedUnionTypesOrder',
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
              | { name: 'Intelligent Titan', status: 'titan' }
              | { name: 'Eren Yeager', species: 'human' }
          `,
          output: dedent`
            type Character =
              | { name: 'Eren Yeager', species: 'human' }
              | { name: 'Intelligent Titan', status: 'titan' }
          `,
          options: [options],
          errors: [
            {
              messageId: 'unexpectedUnionTypesOrder',
              data: {
                left: "{ name: 'Intelligent Titan', status: 'titan' }",
                right: "{ name: 'Eren Yeager', species: 'human' }",
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(`${RULE_NAME}: sorts unions with parentheses`, rule, {
      valid: [],
      invalid: [
        {
          code: dedent`
            type HeroAssociation = {
              team:
                | Saitama
                | ((
                    superstrike: () => void,
                  ) => Hero[] | Saitama)
                | Hero[]
            }
          `,
          output: dedent`
            type HeroAssociation = {
              team:
                | ((
                    superstrike: () => void,
                  ) => Hero[] | Saitama)
                | Hero[]
                | Saitama
            }
          `,
          options: [options],
          errors: [
            {
              messageId: 'unexpectedUnionTypesOrder',
              data: {
                left: 'Saitama',
                right: '( superstrike: () => void, ) => Hero[] | Saitama',
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(`${RULE_NAME}: sorts unions with comment at the end`, rule, {
      valid: [],
      invalid: [
        {
          code: dedent`
            type Step = 1 | 2 | 4 | 3 | 5 | 100; // Exam step. Example: 3
          `,
          output: dedent`
            type Step = 1 | 100 | 2 | 3 | 4 | 5; // Exam step. Example: 3
          `,
          options: [options],
          errors: [
            {
              messageId: 'unexpectedUnionTypesOrder',
              data: {
                left: '4',
                right: '3',
              },
            },
            {
              messageId: 'unexpectedUnionTypesOrder',
              data: {
                left: '5',
                right: '100',
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(`${RULE_NAME}: can put nullable types to the end`, rule, {
      valid: [],
      invalid: [
        {
          code: dedent`
            type Enemy = 'null' | null | 'r-team' | undefined | unknown
          `,
          output: dedent`
            type Enemy = 'null' | 'r-team' | unknown | null | undefined
          `,
          options: [
            {
              ...options,
              nullableLast: true,
            },
          ],
          errors: [
            {
              messageId: 'unexpectedUnionTypesOrder',
              data: {
                left: 'null',
                right: "'r-team'",
              },
            },
            {
              messageId: 'unexpectedUnionTypesOrder',
              data: {
                left: 'undefined',
                right: 'unknown',
              },
            },
          ],
        },
      ],
    })
  })

  describe(`${RULE_NAME}: sorting by natural order`, () => {
    let type = 'natural-order'

    let options = {
      type: SortType.alphabetical,
      order: SortOrder.asc,
      ignoreCase: false,
    }

    ruleTester.run(`${RULE_NAME}(${type}: sorts union types`, rule, {
      valid: [
        {
          code: dedent`
            type Eternity = 'Fushi' | 'Gugu' | 'Joaan' | 'Parona'
          `,
          options: [options],
        },
      ],
      invalid: [
        {
          code: dedent`
            type Eternity = 'Fushi' | 'Joaan' | 'Parona' | 'Gugu'
          `,
          output: dedent`
            type Eternity = 'Fushi' | 'Gugu' | 'Joaan' | 'Parona'
          `,
          options: [options],
          errors: [
            {
              messageId: 'unexpectedUnionTypesOrder',
              data: {
                left: "'Parona'",
                right: "'Gugu'",
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(`${RULE_NAME}: sorts keyword union types`, rule, {
      valid: [],
      invalid: [
        {
          code: dedent`
            type Value =
              | boolean
              | number
              | string
              | any
              | unknown
              | null
              | undefined
              | never
              | void
              | bigint
          `,
          output: dedent`
            type Value =
              | any
              | bigint
              | boolean
              | never
              | null
              | number
              | string
              | undefined
              | unknown
              | void
          `,
          options: [options],
          errors: [
            {
              messageId: 'unexpectedUnionTypesOrder',
              data: {
                left: 'string',
                right: 'any',
              },
            },
            {
              messageId: 'unexpectedUnionTypesOrder',
              data: {
                left: 'unknown',
                right: 'null',
              },
            },
            {
              messageId: 'unexpectedUnionTypesOrder',
              data: {
                left: 'undefined',
                right: 'never',
              },
            },
            {
              messageId: 'unexpectedUnionTypesOrder',
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
          code: "Omit<Arataka, 'psychic-abilities' | 'power'>",
          output: "Omit<Arataka, 'power' | 'psychic-abilities'>",
          options: [options],
          errors: [
            {
              messageId: 'unexpectedUnionTypesOrder',
              data: {
                left: "'psychic-abilities'",
                right: "'power'",
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
          code: 'type DemonSlayer = Tanjiro | Zenitsu | Inosuke',
          output: 'type DemonSlayer = Inosuke | Tanjiro | Zenitsu',
          options: [options],
          errors: [
            {
              messageId: 'unexpectedUnionTypesOrder',
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
              | { name: 'Intelligent Titan', status: 'titan' }
              | { name: 'Eren Yeager', species: 'human' }
          `,
          output: dedent`
            type Character =
              | { name: 'Eren Yeager', species: 'human' }
              | { name: 'Intelligent Titan', status: 'titan' }
          `,
          options: [options],
          errors: [
            {
              messageId: 'unexpectedUnionTypesOrder',
              data: {
                left: "{ name: 'Intelligent Titan', status: 'titan' }",
                right: "{ name: 'Eren Yeager', species: 'human' }",
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(`${RULE_NAME}: sorts unions with parentheses`, rule, {
      valid: [],
      invalid: [
        {
          code: dedent`
            type HeroAssociation = {
              team:
                | Saitama
                | ((
                    superstrike: () => void,
                  ) => Hero[] | Saitama)
                | Hero[]
            }
          `,
          output: dedent`
            type HeroAssociation = {
              team:
                | ((
                    superstrike: () => void,
                  ) => Hero[] | Saitama)
                | Hero[]
                | Saitama
            }
          `,
          options: [options],
          errors: [
            {
              messageId: 'unexpectedUnionTypesOrder',
              data: {
                left: 'Saitama',
                right: '( superstrike: () => void, ) => Hero[] | Saitama',
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(`${RULE_NAME}: sorts unions with comment at the end`, rule, {
      valid: [],
      invalid: [
        {
          code: dedent`
            type Step = 1 | 2 | 4 | 3 | 5 | 100; // Exam step. Example: 3
          `,
          output: dedent`
            type Step = 1 | 100 | 2 | 3 | 4 | 5; // Exam step. Example: 3
          `,
          options: [options],
          errors: [
            {
              messageId: 'unexpectedUnionTypesOrder',
              data: {
                left: '4',
                right: '3',
              },
            },
            {
              messageId: 'unexpectedUnionTypesOrder',
              data: {
                left: '5',
                right: '100',
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(`${RULE_NAME}: can put nullable types to the end`, rule, {
      valid: [],
      invalid: [
        {
          code: dedent`
            type Enemy = 'null' | null | 'r-team' | undefined | unknown
          `,
          output: dedent`
            type Enemy = 'null' | 'r-team' | unknown | null | undefined
          `,
          options: [
            {
              ...options,
              nullableLast: true,
            },
          ],
          errors: [
            {
              messageId: 'unexpectedUnionTypesOrder',
              data: {
                left: 'null',
                right: "'r-team'",
              },
            },
            {
              messageId: 'unexpectedUnionTypesOrder',
              data: {
                left: 'undefined',
                right: 'unknown',
              },
            },
          ],
        },
      ],
    })
  })

  describe(`${RULE_NAME}: sorting by line length`, () => {
    let type = 'line-length-order'

    let options = {
      type: SortType['line-length'],
      order: SortOrder.desc,
    }

    ruleTester.run(`${RULE_NAME}(${type}: sorts union types`, rule, {
      valid: [
        {
          code: dedent`
              type Eternity = 'Parona' | 'Joaan' | 'Fushi' | 'Gugu'
            `,
          options: [options],
        },
      ],
      invalid: [
        {
          code: dedent`
            type Eternity = 'Fushi' | 'Joaan' | 'Parona' | 'Gugu'
          `,
          output: dedent`
            type Eternity = 'Parona' | 'Fushi' | 'Joaan' | 'Gugu'
          `,
          options: [options],
          errors: [
            {
              messageId: 'unexpectedUnionTypesOrder',
              data: {
                left: "'Joaan'",
                right: "'Parona'",
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(`${RULE_NAME}: sorts keyword union types`, rule, {
      valid: [],
      invalid: [
        {
          code: dedent`
            type Value =
              | boolean
              | number
              | string
              | any
              | unknown
              | null
              | undefined
              | never
              | void
              | bigint
          `,
          output: dedent`
            type Value =
              | undefined
              | boolean
              | unknown
              | number
              | string
              | bigint
              | never
              | null
              | void
              | any
          `,
          options: [options],
          errors: [
            {
              messageId: 'unexpectedUnionTypesOrder',
              data: {
                left: 'any',
                right: 'unknown',
              },
            },
            {
              messageId: 'unexpectedUnionTypesOrder',
              data: {
                left: 'null',
                right: 'undefined',
              },
            },
            {
              messageId: 'unexpectedUnionTypesOrder',
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
          code: "Omit<Arataka, 'power' | 'psychic-abilities'>",
          output: "Omit<Arataka, 'psychic-abilities' | 'power'>",
          options: [options],
          errors: [
            {
              messageId: 'unexpectedUnionTypesOrder',
              data: {
                left: "'power'",
                right: "'psychic-abilities'",
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(`${RULE_NAME}: works with type references`, rule, {
      valid: [
        {
          code: 'type DemonSlayer = Tanjiro | Zenitsu | Inosuke',
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
              | { name: 'Eren Yeager', species: 'human' }
              | { name: 'Intelligent Titan', status: 'titan' }
          `,
          output: dedent`
            type Character =
              | { name: 'Intelligent Titan', status: 'titan' }
              | { name: 'Eren Yeager', species: 'human' }
          `,
          options: [options],
          errors: [
            {
              messageId: 'unexpectedUnionTypesOrder',
              data: {
                left: "{ name: 'Eren Yeager', species: 'human' }",
                right: "{ name: 'Intelligent Titan', status: 'titan' }",
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(`${RULE_NAME}: sorts unions with parentheses`, rule, {
      valid: [],
      invalid: [
        {
          code: dedent`
            type HeroAssociation = {
              team:
                | Saitama
                | ((
                    superstrike: () => void,
                  ) => Hero[] | Saitama)
                | Hero[]
            }
          `,
          output: dedent`
            type HeroAssociation = {
              team:
                | ((
                    superstrike: () => void,
                  ) => Hero[] | Saitama)
                | Saitama
                | Hero[]
            }
          `,
          options: [options],
          errors: [
            {
              messageId: 'unexpectedUnionTypesOrder',
              data: {
                left: 'Saitama',
                right: '( superstrike: () => void, ) => Hero[] | Saitama',
              },
            },
            {
              messageId: 'unexpectedUnionTypesOrder',
              data: {
                left: 'Hero[]',
                right: 'Saitama',
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(`${RULE_NAME}: sorts unions with comment at the end`, rule, {
      valid: [],
      invalid: [
        {
          code: dedent`
            type Step = 1 | 2 | 4 | 3 | 5 | 100; // Exam step. Example: 3
          `,
          output: dedent`
            type Step = 100 | 1 | 2 | 4 | 3 | 5; // Exam step. Example: 3
          `,
          options: [options],
          errors: [
            {
              messageId: 'unexpectedUnionTypesOrder',
              data: {
                left: '5',
                right: '100',
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(`${RULE_NAME}: can put nullable types to the end`, rule, {
      valid: [],
      invalid: [
        {
          code: dedent`
            type Enemy = 'null' | null | 'r-team' | undefined | unknown
          `,
          output: dedent`
            type Enemy = 'r-team' | unknown | 'null' | undefined | null
          `,
          options: [
            {
              ...options,
              nullableLast: true,
            },
          ],
          errors: [
            {
              messageId: 'unexpectedUnionTypesOrder',
              data: {
                left: 'null',
                right: "'r-team'",
              },
            },
            {
              messageId: 'unexpectedUnionTypesOrder',
              data: {
                left: 'undefined',
                right: 'unknown',
              },
            },
          ],
        },
      ],
    })
  })

  describe(`${RULE_NAME}: misc`, () => {
    ruleTester.run(
      `${RULE_NAME}: sets alphabetical asc sorting as default`,
      rule,
      {
        valid: [
          dedent`
            type SupportedNumberBase = NumberBase.BASE_10 | NumberBase.BASE_16 | NumberBase.BASE_2
          `,
          {
            code: dedent`
              type SupportedNumberBase = NumberBase.BASE_10 | NumberBase.BASE_16 | NumberBase.BASE_2
            `,
            options: [{}],
          },
        ],
        invalid: [
          {
            code: dedent`
              type SupportedNumberBase = NumberBase.BASE_2 | NumberBase.BASE_10 | NumberBase.BASE_16
            `,
            output: dedent`
              type SupportedNumberBase = NumberBase.BASE_10 | NumberBase.BASE_16 | NumberBase.BASE_2
            `,
            errors: [
              {
                messageId: 'unexpectedUnionTypesOrder',
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
