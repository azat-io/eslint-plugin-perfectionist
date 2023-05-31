import { ESLintUtils } from '@typescript-eslint/utils'
import { describe, it } from 'vitest'
import { dedent } from 'ts-dedent'

import rule, { RULE_NAME } from '../rules/sort-object-keys'
import { SortType, SortOrder } from '../typings'

describe(RULE_NAME, () => {
  let ruleTester = new ESLintUtils.RuleTester({
    parser: '@typescript-eslint/parser',
  })

  describe(`${RULE_NAME}: sorting by alphabetical order`, () => {
    let type = 'alphabetical-order'

    it(`${RULE_NAME}(${type}): sorts object with identifier and literal keys`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [
          {
            code: dedent`
              let wisewolf = {
                age: undefined,
                'eye-color': '#f00',
                [hometown]: 'Yoitsu',
                name: 'Holo',
              }
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
              let wisewolf = {
                age: undefined,
                [hometown]: 'Yoitsu',
                'eye-color': '#f00',
                name: 'Holo',
              }
            `,
            output: dedent`
              let wisewolf = {
                age: undefined,
                'eye-color': '#f00',
                [hometown]: 'Yoitsu',
                name: 'Holo',
              }
            `,
            options: [
              {
                type: SortType.alphabetical,
                order: SortOrder.asc,
              },
            ],
            errors: [
              {
                messageId: 'unexpectedObjectKeysOrder',
                data: {
                  first: 'hometown',
                  second: 'eye-color',
                },
              },
            ],
          },
        ],
      })
    })

    it(`${RULE_NAME}(${type}): sorting does not break object`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [
          {
            code: dedent`
              let bebop = {
                dog: 'Ein',
                hunter: 'Spike Spiegel',
                ...teamMembers,
                hacker: 'Ed',
              }
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
              let bebop = {
                hunter: 'Spike Spiegel',
                dog: 'Ein',
                ...teamMembers,
                hacker: 'Ed',
              }
            `,
            output: dedent`
              let bebop = {
                dog: 'Ein',
                hunter: 'Spike Spiegel',
                ...teamMembers,
                hacker: 'Ed',
              }
            `,
            options: [
              {
                type: SortType.alphabetical,
                order: SortOrder.asc,
              },
            ],
            errors: [
              {
                messageId: 'unexpectedObjectKeysOrder',
                data: {
                  first: 'hunter',
                  second: 'dog',
                },
              },
            ],
          },
        ],
      })
    })

    it(`${RULE_NAME}(${type}): sorts objects in objects`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [
          {
            code: dedent`
              let enforcers = {
                'akane-tsunemori': {
                  age: 20,
                  'crime-coefficient': 28,
                },
                'nobuchika-ginoza': {
                  age: 28,
                  'crime-coefficient': 86.3,
                },
                'shinya-kogami': {
                  age: 28,
                  'crime-coefficient': 282.6,
                },
              }
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
              let enforcers = {
                'akane-tsunemori': {
                  'crime-coefficient': 28,
                  age: 20,
                },
                'shinya-kogami': {
                  'crime-coefficient': 282.6,
                  age: 28,
                },
                'nobuchika-ginoza': {
                  'crime-coefficient': 86.3,
                  age: 28,
                },
              }
            `,
            output: dedent`
              let enforcers = {
                'akane-tsunemori': {
                  'crime-coefficient': 28,
                  age: 20,
                },
                'nobuchika-ginoza': {
                  'crime-coefficient': 86.3,
                  age: 28,
                },
                'shinya-kogami': {
                  'crime-coefficient': 282.6,
                  age: 28,
                },
              }
            `,
            options: [
              {
                type: SortType.alphabetical,
                order: SortOrder.asc,
              },
            ],
            errors: [
              {
                messageId: 'unexpectedObjectKeysOrder',
                data: {
                  first: 'crime-coefficient',
                  second: 'age',
                },
              },
              {
                messageId: 'unexpectedObjectKeysOrder',
                data: {
                  first: 'crime-coefficient',
                  second: 'age',
                },
              },
              {
                messageId: 'unexpectedObjectKeysOrder',
                data: {
                  first: 'shinya-kogami',
                  second: 'nobuchika-ginoza',
                },
              },
              {
                messageId: 'unexpectedObjectKeysOrder',
                data: {
                  first: 'crime-coefficient',
                  second: 'age',
                },
              },
            ],
          },
        ],
      })
    })

    it(`${RULE_NAME}(${type}): sorts objects computed keys`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [
          {
            code: dedent`
              let robots = {
                'eva-02': 'Asuka Langley Sohryu',
                [getTestEva()]: 'Yui Ikari',
                [robots[1]]: 'Rei Ayanami',
              }
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
              let robots = {
                [robots[1]]: 'Rei Ayanami',
                [getTestEva()]: 'Yui Ikari',
                'eva-02': 'Asuka Langley Sohryu',
              }
            `,
            output: dedent`
              let robots = {
                'eva-02': 'Asuka Langley Sohryu',
                [getTestEva()]: 'Yui Ikari',
                [robots[1]]: 'Rei Ayanami',
              }
            `,
            options: [
              {
                type: SortType.alphabetical,
                order: SortOrder.asc,
              },
            ],
            errors: [
              {
                messageId: 'unexpectedObjectKeysOrder',
                data: {
                  first: 'robots[1]',
                  second: 'getTestEva()',
                },
              },
              {
                messageId: 'unexpectedObjectKeysOrder',
                data: {
                  first: 'getTestEva()',
                  second: 'eva-02',
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

    it(`${RULE_NAME}(${type}): sorts object with identifier and literal keys`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [
          {
            code: dedent`
              let wisewolf = {
                age: undefined,
                'eye-color': '#f00',
                [hometown]: 'Yoitsu',
                name: 'Holo',
              }
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
              let wisewolf = {
                age: undefined,
                [hometown]: 'Yoitsu',
                'eye-color': '#f00',
                name: 'Holo',
              }
            `,
            output: dedent`
              let wisewolf = {
                age: undefined,
                'eye-color': '#f00',
                [hometown]: 'Yoitsu',
                name: 'Holo',
              }
            `,
            options: [
              {
                type: SortType.natural,
                order: SortOrder.asc,
              },
            ],
            errors: [
              {
                messageId: 'unexpectedObjectKeysOrder',
                data: {
                  first: 'hometown',
                  second: 'eye-color',
                },
              },
            ],
          },
        ],
      })
    })

    it(`${RULE_NAME}(${type}): sorting does not break object`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [
          {
            code: dedent`
              let bebop = {
                dog: 'Ein',
                hunter: 'Spike Spiegel',
                ...teamMembers,
                hacker: 'Ed',
              }
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
              let bebop = {
                hunter: 'Spike Spiegel',
                dog: 'Ein',
                ...teamMembers,
                hacker: 'Ed',
              }
            `,
            output: dedent`
              let bebop = {
                dog: 'Ein',
                hunter: 'Spike Spiegel',
                ...teamMembers,
                hacker: 'Ed',
              }
            `,
            options: [
              {
                type: SortType.natural,
                order: SortOrder.asc,
              },
            ],
            errors: [
              {
                messageId: 'unexpectedObjectKeysOrder',
                data: {
                  first: 'hunter',
                  second: 'dog',
                },
              },
            ],
          },
        ],
      })
    })

    it(`${RULE_NAME}(${type}): sorts objects in objects`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [
          {
            code: dedent`
              let enforcers = {
                'akane-tsunemori': {
                  age: 20,
                  'crime-coefficient': 28,
                },
                'nobuchika-ginoza': {
                  age: 28,
                  'crime-coefficient': 86.3,
                },
                'shinya-kogami': {
                  age: 28,
                  'crime-coefficient': 282.6,
                },
              }
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
              let enforcers = {
                'akane-tsunemori': {
                  'crime-coefficient': 28,
                  age: 20,
                },
                'shinya-kogami': {
                  'crime-coefficient': 282.6,
                  age: 28,
                },
                'nobuchika-ginoza': {
                  'crime-coefficient': 86.3,
                  age: 28,
                },
              }
            `,
            output: dedent`
              let enforcers = {
                'akane-tsunemori': {
                  'crime-coefficient': 28,
                  age: 20,
                },
                'nobuchika-ginoza': {
                  'crime-coefficient': 86.3,
                  age: 28,
                },
                'shinya-kogami': {
                  'crime-coefficient': 282.6,
                  age: 28,
                },
              }
            `,
            options: [
              {
                type: SortType.natural,
                order: SortOrder.asc,
              },
            ],
            errors: [
              {
                messageId: 'unexpectedObjectKeysOrder',
                data: {
                  first: 'crime-coefficient',
                  second: 'age',
                },
              },
              {
                messageId: 'unexpectedObjectKeysOrder',
                data: {
                  first: 'crime-coefficient',
                  second: 'age',
                },
              },
              {
                messageId: 'unexpectedObjectKeysOrder',
                data: {
                  first: 'shinya-kogami',
                  second: 'nobuchika-ginoza',
                },
              },
              {
                messageId: 'unexpectedObjectKeysOrder',
                data: {
                  first: 'crime-coefficient',
                  second: 'age',
                },
              },
            ],
          },
        ],
      })
    })

    it(`${RULE_NAME}(${type}): sorts objects computed keys`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [
          {
            code: dedent`
              let robots = {
                'eva-02': 'Asuka Langley Sohryu',
                [getTestEva()]: 'Yui Ikari',
                [robots[1]]: 'Rei Ayanami',
              }
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
              let robots = {
                [robots[1]]: 'Rei Ayanami',
                [getTestEva()]: 'Yui Ikari',
                'eva-02': 'Asuka Langley Sohryu',
              }
            `,
            output: dedent`
              let robots = {
                'eva-02': 'Asuka Langley Sohryu',
                [getTestEva()]: 'Yui Ikari',
                [robots[1]]: 'Rei Ayanami',
              }
            `,
            options: [
              {
                type: SortType.natural,
                order: SortOrder.asc,
              },
            ],
            errors: [
              {
                messageId: 'unexpectedObjectKeysOrder',
                data: {
                  first: 'robots[1]',
                  second: 'getTestEva()',
                },
              },
              {
                messageId: 'unexpectedObjectKeysOrder',
                data: {
                  first: 'getTestEva()',
                  second: 'eva-02',
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

    it(`${RULE_NAME}(${type}): sorts object with identifier and literal keys`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [
          {
            code: dedent`
              let wisewolf = {
                [hometown]: 'Yoitsu',
                'eye-color': '#f00',
                age: undefined,
                name: 'Holo',
              }
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
              let wisewolf = {
                age: undefined,
                [hometown]: 'Yoitsu',
                'eye-color': '#f00',
                name: 'Holo',
              }
            `,
            output: dedent`
              let wisewolf = {
                [hometown]: 'Yoitsu',
                'eye-color': '#f00',
                age: undefined,
                name: 'Holo',
              }
            `,
            options: [
              {
                type: SortType['line-length'],
                order: SortOrder.desc,
              },
            ],
            errors: [
              {
                messageId: 'unexpectedObjectKeysOrder',
                data: {
                  first: 'age',
                  second: 'hometown',
                },
              },
            ],
          },
        ],
      })
    })

    it(`${RULE_NAME}(${type}): sorting does not break object`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [
          {
            code: dedent`
              let bebop = {
                hunter: 'Spike Spiegel',
                dog: 'Ein',
                ...teamMembers,
                hacker: 'Ed',
              }
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
              let bebop = {
                dog: 'Ein',
                hunter: 'Spike Spiegel',
                ...teamMembers,
                hacker: 'Ed',
              }
            `,
            output: dedent`
              let bebop = {
                hunter: 'Spike Spiegel',
                dog: 'Ein',
                ...teamMembers,
                hacker: 'Ed',
              }
            `,
            options: [
              {
                type: SortType['line-length'],
                order: SortOrder.desc,
              },
            ],
            errors: [
              {
                messageId: 'unexpectedObjectKeysOrder',
                data: {
                  first: 'dog',
                  second: 'hunter',
                },
              },
            ],
          },
        ],
      })
    })

    it(`${RULE_NAME}(${type}): sorts objects in objects`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [
          {
            code: dedent`
              let enforcers = {
                'nobuchika-ginoza': {
                  'crime-coefficient': 86.3,
                  age: 28,
                },
                'shinya-kogami': {
                  'crime-coefficient': 282.6,
                  age: 28,
                },
                'akane-tsunemori': {
                  'crime-coefficient': 28,
                  age: 20,
                },
              }
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
              let enforcers = {
                'shinya-kogami': {
                  age: 28,
                  'crime-coefficient': 282.6,
                },
                'akane-tsunemori': {
                  age: 20,
                  'crime-coefficient': 28,
                },
                'nobuchika-ginoza': {
                  age: 28,
                  'crime-coefficient': 86.3,
                },
              }
            `,
            output: dedent`
              let enforcers = {
                'nobuchika-ginoza': {
                  age: 28,
                  'crime-coefficient': 86.3,
                },
                'shinya-kogami': {
                  age: 28,
                  'crime-coefficient': 282.6,
                },
                'akane-tsunemori': {
                  age: 20,
                  'crime-coefficient': 28,
                },
              }
            `,
            options: [
              {
                type: SortType['line-length'],
                order: SortOrder.desc,
              },
            ],
            errors: [
              {
                messageId: 'unexpectedObjectKeysOrder',
                data: {
                  first: 'age',
                  second: 'crime-coefficient',
                },
              },
              {
                messageId: 'unexpectedObjectKeysOrder',
                data: {
                  first: 'age',
                  second: 'crime-coefficient',
                },
              },
              {
                messageId: 'unexpectedObjectKeysOrder',
                data: {
                  first: 'akane-tsunemori',
                  second: 'nobuchika-ginoza',
                },
              },
              {
                messageId: 'unexpectedObjectKeysOrder',
                data: {
                  first: 'age',
                  second: 'crime-coefficient',
                },
              },
            ],
          },
        ],
      })
    })

    it(`${RULE_NAME}(${type}): sorts objects computed keys`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [
          {
            code: dedent`
              let robots = {
                'eva-02': 'Asuka Langley Sohryu',
                [getTestEva()]: 'Yui Ikari',
                [robots[1]]: 'Rei Ayanami',
              }
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
              let robots = {
                [robots[1]]: 'Rei Ayanami',
                [getTestEva()]: 'Yui Ikari',
                'eva-02': 'Asuka Langley Sohryu',
              }
            `,
            output: dedent`
              let robots = {
                'eva-02': 'Asuka Langley Sohryu',
                [getTestEva()]: 'Yui Ikari',
                [robots[1]]: 'Rei Ayanami',
              }
            `,
            options: [
              {
                type: SortType['line-length'],
                order: SortOrder.desc,
              },
            ],
            errors: [
              {
                messageId: 'unexpectedObjectKeysOrder',
                data: {
                  first: 'robots[1]',
                  second: 'getTestEva()',
                },
              },
              {
                messageId: 'unexpectedObjectKeysOrder',
                data: {
                  first: 'getTestEva()',
                  second: 'eva-02',
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
            let family = {
              dad: 'Loid Forger',
              daughter: 'Anya Forger',
              mom: 'Yor Forger',
            }
          `,
        ],
        invalid: [
          {
            code: dedent`
              let family = {
                dad: 'Loid Forger',
                mom: 'Yor Forger',
                daughter: 'Anya Forger',
              }
            `,
            output: dedent`
              let family = {
                dad: 'Loid Forger',
                daughter: 'Anya Forger',
                mom: 'Yor Forger',
              }
            `,
            errors: [
              {
                messageId: 'unexpectedObjectKeysOrder',
                data: {
                  first: 'mom',
                  second: 'daughter',
                },
              },
            ],
          },
        ],
      })
    })
  })
})
