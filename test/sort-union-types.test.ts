import { ESLintUtils } from '@typescript-eslint/utils'
import { describe, it } from 'vitest'
import { dedent } from 'ts-dedent'

import rule, { RULE_NAME } from '../rules/sort-union-types'
import { SortOrder, SortType } from '../typings'

describe(RULE_NAME, () => {
  let ruleTester = new ESLintUtils.RuleTester({
    parser: '@typescript-eslint/parser',
  })

  describe(`${RULE_NAME}: sorting by alphabetical order`, () => {
    let type = 'alphabetical-order'

    let options = {
      type: SortType.alphabetical,
      order: SortOrder.asc,
      'ignore-case': false,
    }

    it(`${RULE_NAME}(${type}: sorts union types`, () => {
      ruleTester.run(RULE_NAME, rule, {
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
    })

    it(`${RULE_NAME}: works with generics`, () => {
      ruleTester.run(RULE_NAME, rule, {
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
    })

    it(`${RULE_NAME}: works with type references`, () => {
      ruleTester.run(RULE_NAME, rule, {
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
    })

    it(`${RULE_NAME}: sorts unions with parentheses`, () => {
      ruleTester.run(RULE_NAME, rule, {
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
    })
  })

  describe(`${RULE_NAME}: sorting by natural order`, () => {
    let type = 'natural-order'

    let options = {
      type: SortType.alphabetical,
      order: SortOrder.asc,
      'ignore-case': false,
    }

    it(`${RULE_NAME}(${type}: sorts union types`, () => {
      ruleTester.run(RULE_NAME, rule, {
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
    })

    it(`${RULE_NAME}: works with generics`, () => {
      ruleTester.run(RULE_NAME, rule, {
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
    })

    it(`${RULE_NAME}: works with type references`, () => {
      ruleTester.run(RULE_NAME, rule, {
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
    })

    it(`${RULE_NAME}: sorts unions with parentheses`, () => {
      ruleTester.run(RULE_NAME, rule, {
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
    })
  })

  describe(`${RULE_NAME}: sorting by line length`, () => {
    let type = 'line-length-order'

    let options = {
      type: SortType['line-length'],
      order: SortOrder.desc,
    }

    it(`${RULE_NAME}(${type}: sorts union types`, () => {
      ruleTester.run(RULE_NAME, rule, {
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
              type Eternity = 'Parona' | 'Joaan' | 'Fushi' | 'Gugu'
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
    })

    it(`${RULE_NAME}: works with generics`, () => {
      ruleTester.run(RULE_NAME, rule, {
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
    })

    it(`${RULE_NAME}: works with type references`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [
          {
            code: 'type DemonSlayer = Tanjiro | Zenitsu | Inosuke',
            options: [options],
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
    })

    it(`${RULE_NAME}: sorts unions with parentheses`, () => {
      ruleTester.run(RULE_NAME, rule, {
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
    })
  })

  describe(`${RULE_NAME}: misc`, () => {
    it(`${RULE_NAME}: sets alphabetical asc sorting as default`, () => {
      ruleTester.run(RULE_NAME, rule, {
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
      })
    })
  })
})
