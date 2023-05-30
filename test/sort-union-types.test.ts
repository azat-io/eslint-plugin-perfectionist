import { ESLintUtils } from '@typescript-eslint/utils'
import { describe, it } from 'vitest'
import { dedent } from 'ts-dedent'

import rule, { RULE_NAME } from '~/rules/sort-union-types'
import { SortType, SortOrder } from '~/typings'

describe(RULE_NAME, () => {
  let ruleTester = new ESLintUtils.RuleTester({
    parser: '@typescript-eslint/parser',
  })

  describe(`${RULE_NAME}: sorting by alphabetical order`, () => {
    let type = 'alphabetical-order'

    it(`${RULE_NAME}(${type}: sorts union types`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [
          {
            code: dedent`
              type Eternity = 'Fushi' | 'Gugu' | 'Joaan' | 'Parona'
            `,
            options: [
              {
                type: SortType.alphabetical,
                order: SortOrder.asc,
              },
            ],
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
            options: [
              {
                type: SortType.alphabetical,
                order: SortOrder.asc,
              },
            ],
            errors: [
              {
                messageId: 'unexpectedUnionTypesOrder',
                data: {
                  first: "'Parona'",
                  second: "'Gugu'",
                },
              },
            ],
          },
        ],
      })
    })

    it(`${RULE_NAME}: sorts keyword union types`, () => {
      ruleTester.run(RULE_NAME, rule, {
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
            options: [
              {
                type: SortType.alphabetical,
                order: SortOrder.asc,
              },
            ],
            errors: [
              {
                messageId: 'unexpectedUnionTypesOrder',
                data: {
                  first: 'string',
                  second: 'any',
                },
              },
              {
                messageId: 'unexpectedUnionTypesOrder',
                data: {
                  first: 'unknown',
                  second: 'null',
                },
              },
              {
                messageId: 'unexpectedUnionTypesOrder',
                data: {
                  first: 'undefined',
                  second: 'never',
                },
              },
              {
                messageId: 'unexpectedUnionTypesOrder',
                data: {
                  first: 'void',
                  second: 'bigint',
                },
              },
            ],
          },
        ],
      })
    })

    it(`${RULE_NAME}: works with generics`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [],
        invalid: [
          {
            code: "Omit<Arataka, 'psychic-abilities' | 'power'>",
            output: "Omit<Arataka, 'power' | 'psychic-abilities'>",
            options: [
              {
                type: SortType.alphabetical,
                order: SortOrder.asc,
              },
            ],
            errors: [
              {
                messageId: 'unexpectedUnionTypesOrder',
                data: {
                  first: "'psychic-abilities'",
                  second: "'power'",
                },
              },
            ],
          },
        ],
      })
    })

    it(`${RULE_NAME}: works with type references`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [],
        invalid: [
          {
            code: 'type DemonSlayer = Tanjiro | Zenitsu | Inosuke',
            output: 'type DemonSlayer = Inosuke | Tanjiro | Zenitsu',
            options: [
              {
                type: SortType.alphabetical,
                order: SortOrder.asc,
              },
            ],
            errors: [
              {
                messageId: 'unexpectedUnionTypesOrder',
                data: {
                  first: 'Zenitsu',
                  second: 'Inosuke',
                },
              },
            ],
          },
        ],
      })
    })

    it(`${RULE_NAME}: works with type references`, () => {
      ruleTester.run(RULE_NAME, rule, {
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
            options: [
              {
                type: SortType.alphabetical,
                order: SortOrder.asc,
              },
            ],
            errors: [
              {
                messageId: 'unexpectedUnionTypesOrder',
                data: {
                  first: "{ name: 'Intelligent Titan', status: 'titan' }",
                  second: "{ name: 'Eren Yeager', species: 'human' }",
                },
              },
            ],
          },
        ],
      })
    })
  })

  describe(`${RULE_NAME}: sorting by natural order`, () => {
    let type = 'natural-order'

    it(`${RULE_NAME}(${type}: sorts union types`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [
          {
            code: dedent`
              type Eternity = 'Fushi' | 'Gugu' | 'Joaan' | 'Parona'
            `,
            options: [
              {
                type: SortType.natural,
                order: SortOrder.asc,
              },
            ],
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
            options: [
              {
                type: SortType.natural,
                order: SortOrder.asc,
              },
            ],
            errors: [
              {
                messageId: 'unexpectedUnionTypesOrder',
                data: {
                  first: "'Parona'",
                  second: "'Gugu'",
                },
              },
            ],
          },
        ],
      })
    })

    it(`${RULE_NAME}: sorts keyword union types`, () => {
      ruleTester.run(RULE_NAME, rule, {
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
            options: [
              {
                type: SortType.natural,
                order: SortOrder.asc,
              },
            ],
            errors: [
              {
                messageId: 'unexpectedUnionTypesOrder',
                data: {
                  first: 'string',
                  second: 'any',
                },
              },
              {
                messageId: 'unexpectedUnionTypesOrder',
                data: {
                  first: 'unknown',
                  second: 'null',
                },
              },
              {
                messageId: 'unexpectedUnionTypesOrder',
                data: {
                  first: 'undefined',
                  second: 'never',
                },
              },
              {
                messageId: 'unexpectedUnionTypesOrder',
                data: {
                  first: 'void',
                  second: 'bigint',
                },
              },
            ],
          },
        ],
      })
    })

    it(`${RULE_NAME}: works with generics`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [],
        invalid: [
          {
            code: "Omit<Arataka, 'psychic-abilities' | 'power'>",
            output: "Omit<Arataka, 'power' | 'psychic-abilities'>",
            options: [
              {
                type: SortType.natural,
                order: SortOrder.asc,
              },
            ],
            errors: [
              {
                messageId: 'unexpectedUnionTypesOrder',
                data: {
                  first: "'psychic-abilities'",
                  second: "'power'",
                },
              },
            ],
          },
        ],
      })
    })

    it(`${RULE_NAME}: works with type references`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [],
        invalid: [
          {
            code: 'type DemonSlayer = Tanjiro | Zenitsu | Inosuke',
            output: 'type DemonSlayer = Inosuke | Tanjiro | Zenitsu',
            options: [
              {
                type: SortType.natural,
                order: SortOrder.asc,
              },
            ],
            errors: [
              {
                messageId: 'unexpectedUnionTypesOrder',
                data: {
                  first: 'Zenitsu',
                  second: 'Inosuke',
                },
              },
            ],
          },
        ],
      })
    })

    it(`${RULE_NAME}: works with type references`, () => {
      ruleTester.run(RULE_NAME, rule, {
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
            options: [
              {
                type: SortType.natural,
                order: SortOrder.asc,
              },
            ],
            errors: [
              {
                messageId: 'unexpectedUnionTypesOrder',
                data: {
                  first: "{ name: 'Intelligent Titan', status: 'titan' }",
                  second: "{ name: 'Eren Yeager', species: 'human' }",
                },
              },
            ],
          },
        ],
      })
    })
  })

  describe(`${RULE_NAME}: sorting by line length`, () => {
    let type = 'line-length-order'

    it(`${RULE_NAME}(${type}: sorts union types`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [
          {
            code: dedent`
              type Eternity = 'Parona' | 'Joaan' | 'Fushi' | 'Gugu'
            `,
            options: [
              {
                type: SortType['line-length'],
                order: SortOrder.desc,
              },
            ],
          },
        ],
        invalid: [
          {
            code: dedent`
              type Eternity = 'Fushi' | 'Joaan' | 'Parona' | 'Gugu'
            `,
            output: dedent`
              type Eternity = 'Parona' | 'Joaan' | 'Fushi' | 'Gugu'
            `,
            options: [
              {
                type: SortType['line-length'],
                order: SortOrder.desc,
              },
            ],
            errors: [
              {
                messageId: 'unexpectedUnionTypesOrder',
                data: {
                  first: "'Joaan'",
                  second: "'Parona'",
                },
              },
            ],
          },
        ],
      })
    })

    it(`${RULE_NAME}: sorts keyword union types`, () => {
      ruleTester.run(RULE_NAME, rule, {
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
                | unknown
                | boolean
                | bigint
                | string
                | number
                | never
                | void
                | null
                | any
            `,
            options: [
              {
                type: SortType['line-length'],
                order: SortOrder.desc,
              },
            ],
            errors: [
              {
                messageId: 'unexpectedUnionTypesOrder',
                data: {
                  first: 'any',
                  second: 'unknown',
                },
              },
              {
                messageId: 'unexpectedUnionTypesOrder',
                data: {
                  first: 'null',
                  second: 'undefined',
                },
              },
              {
                messageId: 'unexpectedUnionTypesOrder',
                data: {
                  first: 'void',
                  second: 'bigint',
                },
              },
            ],
          },
        ],
      })
    })

    it(`${RULE_NAME}: works with generics`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [],
        invalid: [
          {
            code: "Omit<Arataka, 'power' | 'psychic-abilities'>",
            output: "Omit<Arataka, 'psychic-abilities' | 'power'>",
            options: [
              {
                type: SortType['line-length'],
                order: SortOrder.desc,
              },
            ],
            errors: [
              {
                messageId: 'unexpectedUnionTypesOrder',
                data: {
                  first: "'power'",
                  second: "'psychic-abilities'",
                },
              },
            ],
          },
        ],
      })
    })

    it(`${RULE_NAME}: works with type references`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [
          {
            code: 'type DemonSlayer = Tanjiro | Zenitsu | Inosuke',
            options: [
              {
                type: SortType['line-length'],
                order: SortOrder.desc,
              },
            ],
          },
        ],
        invalid: [],
      })
    })

    it(`${RULE_NAME}: works with type references`, () => {
      ruleTester.run(RULE_NAME, rule, {
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
            options: [
              {
                type: SortType['line-length'],
                order: SortOrder.desc,
              },
            ],
            errors: [
              {
                messageId: 'unexpectedUnionTypesOrder',
                data: {
                  first: "{ name: 'Eren Yeager', species: 'human' }",
                  second: "{ name: 'Intelligent Titan', status: 'titan' }",
                },
              },
            ],
          },
        ],
      })
    })
  })
})
