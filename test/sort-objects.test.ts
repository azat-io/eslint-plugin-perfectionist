import { ESLintUtils } from '@typescript-eslint/utils'
import { describe, it } from 'vitest'
import { dedent } from 'ts-dedent'

import rule, { RULE_NAME } from '../rules/sort-objects'
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
                messageId: 'unexpectedObjectsOrder',
                data: {
                  left: 'hometown',
                  right: 'eye-color',
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
                messageId: 'unexpectedObjectsOrder',
                data: {
                  left: 'hunter',
                  right: 'dog',
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
                messageId: 'unexpectedObjectsOrder',
                data: {
                  left: 'crime-coefficient',
                  right: 'age',
                },
              },
              {
                messageId: 'unexpectedObjectsOrder',
                data: {
                  left: 'crime-coefficient',
                  right: 'age',
                },
              },
              {
                messageId: 'unexpectedObjectsOrder',
                data: {
                  left: 'shinya-kogami',
                  right: 'nobuchika-ginoza',
                },
              },
              {
                messageId: 'unexpectedObjectsOrder',
                data: {
                  left: 'crime-coefficient',
                  right: 'age',
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
                messageId: 'unexpectedObjectsOrder',
                data: {
                  left: 'robots[1]',
                  right: 'getTestEva()',
                },
              },
              {
                messageId: 'unexpectedObjectsOrder',
                data: {
                  left: 'getTestEva()',
                  right: 'eva-02',
                },
              },
            ],
          },
        ],
      })
    })

    it(`${RULE_NAME}(${type}): allows to set priority keys`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [
          {
            code: dedent`
              let terrorInResonance = {
                name: 'Terror in Resonance',
                id: 'de4d12c2-200c-49bf-a2c8-14f5b4576299',
                episodes: 11,
                genres: ['drama', 'mystery', 'psychological', 'thriller'],
                romaji: 'Zankyou no Terror',
                studio: 'Mappa'
              }
            `,
            options: [
              {
                'always-on-top': ['name', 'id'],
                type: SortType.alphabetical,
                order: SortOrder.asc,
              },
            ],
          },
        ],
        invalid: [
          {
            code: dedent`
              let terrorInResonance = {
                episodes: 11,
                genres: ['drama', 'mystery', 'psychological', 'thriller'],
                id: 'de4d12c2-200c-49bf-a2c8-14f5b4576299',
                name: 'Terror in Resonance',
                romaji: 'Zankyou no Terror',
                studio: 'Mappa'
              }
            `,
            output: dedent`
              let terrorInResonance = {
                name: 'Terror in Resonance',
                id: 'de4d12c2-200c-49bf-a2c8-14f5b4576299',
                episodes: 11,
                genres: ['drama', 'mystery', 'psychological', 'thriller'],
                romaji: 'Zankyou no Terror',
                studio: 'Mappa'
              }
            `,
            options: [
              {
                'always-on-top': ['name', 'id'],
                type: SortType.alphabetical,
                order: SortOrder.asc,
              },
            ],
            errors: [
              {
                messageId: 'unexpectedObjectsOrder',
                data: {
                  left: 'genres',
                  right: 'id',
                },
              },
              {
                messageId: 'unexpectedObjectsOrder',
                data: {
                  left: 'id',
                  right: 'name',
                },
              },
            ],
          },
        ],
      })
    })

    it(`${RULE_NAME}(${type}): sorts with comments on the same line`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [
          {
            code: dedent`
              let yokokawaFamily = {
                brother: 'Seita', // Seita is responsible, mature, and tough
                'mrs-yokokawa': 'Mrs. Yokokawa', // Seita's and Setsuko's mother
                sister: 'Setsuko' // Setsuko completely adores her older brother Seita
              }
            `,
            options: [
              {
                'always-on-top': ['name', 'id'],
                type: SortType.alphabetical,
                order: SortOrder.asc,
              },
            ],
          },
        ],
        invalid: [
          {
            code: dedent`
              let yokokawaFamily = {
                sister: 'Setsuko', // Setsuko completely adores her older brother Seita
                'mrs-yokokawa': 'Mrs. Yokokawa', // Seita's and Setsuko's mother
                brother: 'Seita', // Seita is responsible, mature, and tough
              }
            `,
            output: dedent`
              let yokokawaFamily = {
                brother: 'Seita', // Seita is responsible, mature, and tough
                'mrs-yokokawa': 'Mrs. Yokokawa', // Seita's and Setsuko's mother
                sister: 'Setsuko', // Setsuko completely adores her older brother Seita
              }
            `,
            options: [
              {
                'always-on-top': ['name', 'id'],
                type: SortType.alphabetical,
                order: SortOrder.asc,
              },
            ],
            errors: [
              {
                messageId: 'unexpectedObjectsOrder',
                data: {
                  left: 'sister',
                  right: 'mrs-yokokawa',
                },
              },
              {
                messageId: 'unexpectedObjectsOrder',
                data: {
                  left: 'mrs-yokokawa',
                  right: 'brother',
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
                messageId: 'unexpectedObjectsOrder',
                data: {
                  left: 'hometown',
                  right: 'eye-color',
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
                messageId: 'unexpectedObjectsOrder',
                data: {
                  left: 'hunter',
                  right: 'dog',
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
                messageId: 'unexpectedObjectsOrder',
                data: {
                  left: 'crime-coefficient',
                  right: 'age',
                },
              },
              {
                messageId: 'unexpectedObjectsOrder',
                data: {
                  left: 'crime-coefficient',
                  right: 'age',
                },
              },
              {
                messageId: 'unexpectedObjectsOrder',
                data: {
                  left: 'shinya-kogami',
                  right: 'nobuchika-ginoza',
                },
              },
              {
                messageId: 'unexpectedObjectsOrder',
                data: {
                  left: 'crime-coefficient',
                  right: 'age',
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
                messageId: 'unexpectedObjectsOrder',
                data: {
                  left: 'robots[1]',
                  right: 'getTestEva()',
                },
              },
              {
                messageId: 'unexpectedObjectsOrder',
                data: {
                  left: 'getTestEva()',
                  right: 'eva-02',
                },
              },
            ],
          },
        ],
      })
    })

    it(`${RULE_NAME}(${type}): allows to set priority keys`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [
          {
            code: dedent`
              let terrorInResonance = {
                name: 'Terror in Resonance',
                id: 'de4d12c2-200c-49bf-a2c8-14f5b4576299',
                episodes: 11,
                genres: ['drama', 'mystery', 'psychological', 'thriller'],
                romaji: 'Zankyou no Terror',
                studio: 'Mappa'
              }
            `,
            options: [
              {
                'always-on-top': ['name', 'id'],
                type: SortType.natural,
                order: SortOrder.asc,
              },
            ],
          },
        ],
        invalid: [
          {
            code: dedent`
              let terrorInResonance = {
                episodes: 11,
                genres: ['drama', 'mystery', 'psychological', 'thriller'],
                id: 'de4d12c2-200c-49bf-a2c8-14f5b4576299',
                name: 'Terror in Resonance',
                romaji: 'Zankyou no Terror',
                studio: 'Mappa'
              }
            `,
            output: dedent`
              let terrorInResonance = {
                name: 'Terror in Resonance',
                id: 'de4d12c2-200c-49bf-a2c8-14f5b4576299',
                episodes: 11,
                genres: ['drama', 'mystery', 'psychological', 'thriller'],
                romaji: 'Zankyou no Terror',
                studio: 'Mappa'
              }
            `,
            options: [
              {
                'always-on-top': ['name', 'id'],
                type: SortType.natural,
                order: SortOrder.asc,
              },
            ],
            errors: [
              {
                messageId: 'unexpectedObjectsOrder',
                data: {
                  left: 'genres',
                  right: 'id',
                },
              },
              {
                messageId: 'unexpectedObjectsOrder',
                data: {
                  left: 'id',
                  right: 'name',
                },
              },
            ],
          },
        ],
      })
    })

    it(`${RULE_NAME}(${type}): sorts with comments on the same line`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [
          {
            code: dedent`
              let yokokawaFamily = {
                brother: 'Seita', // Seita is responsible, mature, and tough
                'mrs-yokokawa': 'Mrs. Yokokawa', // Seita's and Setsuko's mother
                sister: 'Setsuko' // Setsuko completely adores her older brother Seita
              }
            `,
            options: [
              {
                'always-on-top': ['name', 'id'],
                type: SortType.alphabetical,
                order: SortOrder.asc,
              },
            ],
          },
        ],
        invalid: [
          {
            code: dedent`
              let yokokawaFamily = {
                sister: 'Setsuko', // Setsuko completely adores her older brother Seita
                'mrs-yokokawa': 'Mrs. Yokokawa', // Seita's and Setsuko's mother
                brother: 'Seita', // Seita is responsible, mature, and tough
              }
            `,
            output: dedent`
              let yokokawaFamily = {
                brother: 'Seita', // Seita is responsible, mature, and tough
                'mrs-yokokawa': 'Mrs. Yokokawa', // Seita's and Setsuko's mother
                sister: 'Setsuko', // Setsuko completely adores her older brother Seita
              }
            `,
            options: [
              {
                'always-on-top': ['name', 'id'],
                type: SortType.natural,
                order: SortOrder.asc,
              },
            ],
            errors: [
              {
                messageId: 'unexpectedObjectsOrder',
                data: {
                  left: 'sister',
                  right: 'mrs-yokokawa',
                },
              },
              {
                messageId: 'unexpectedObjectsOrder',
                data: {
                  left: 'mrs-yokokawa',
                  right: 'brother',
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
                messageId: 'unexpectedObjectsOrder',
                data: {
                  left: 'age',
                  right: 'hometown',
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
                messageId: 'unexpectedObjectsOrder',
                data: {
                  left: 'dog',
                  right: 'hunter',
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
                messageId: 'unexpectedObjectsOrder',
                data: {
                  left: 'age',
                  right: 'crime-coefficient',
                },
              },
              {
                messageId: 'unexpectedObjectsOrder',
                data: {
                  left: 'age',
                  right: 'crime-coefficient',
                },
              },
              {
                messageId: 'unexpectedObjectsOrder',
                data: {
                  left: 'akane-tsunemori',
                  right: 'nobuchika-ginoza',
                },
              },
              {
                messageId: 'unexpectedObjectsOrder',
                data: {
                  left: 'age',
                  right: 'crime-coefficient',
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
                messageId: 'unexpectedObjectsOrder',
                data: {
                  left: 'robots[1]',
                  right: 'getTestEva()',
                },
              },
              {
                messageId: 'unexpectedObjectsOrder',
                data: {
                  left: 'getTestEva()',
                  right: 'eva-02',
                },
              },
            ],
          },
        ],
      })
    })

    it(`${RULE_NAME}(${type}): allows to set priority keys`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [
          {
            code: dedent`
              let terrorInResonance = {
                name: 'Terror in Resonance',
                id: 'de4d12c2-200c-49bf-a2c8-14f5b4576299',
                genres: ['drama', 'mystery', 'psychological', 'thriller'],
                romaji: 'Zankyou no Terror',
                studio: 'Mappa',
                episodes: 11,
              }
            `,
            options: [
              {
                'always-on-top': ['name', 'id'],
                type: SortType['line-length'],
                order: SortOrder.desc,
              },
            ],
          },
        ],
        invalid: [
          {
            code: dedent`
              let terrorInResonance = {
                episodes: 11,
                genres: ['drama', 'mystery', 'psychological', 'thriller'],
                id: 'de4d12c2-200c-49bf-a2c8-14f5b4576299',
                name: 'Terror in Resonance',
                romaji: 'Zankyou no Terror',
                studio: 'Mappa'
              }
            `,
            output: dedent`
              let terrorInResonance = {
                name: 'Terror in Resonance',
                id: 'de4d12c2-200c-49bf-a2c8-14f5b4576299',
                genres: ['drama', 'mystery', 'psychological', 'thriller'],
                romaji: 'Zankyou no Terror',
                studio: 'Mappa',
                episodes: 11
              }
            `,
            options: [
              {
                'always-on-top': ['name', 'id'],
                type: SortType['line-length'],
                order: SortOrder.desc,
              },
            ],
            errors: [
              {
                messageId: 'unexpectedObjectsOrder',
                data: {
                  left: 'episodes',
                  right: 'genres',
                },
              },
              {
                messageId: 'unexpectedObjectsOrder',
                data: {
                  left: 'genres',
                  right: 'id',
                },
              },
              {
                messageId: 'unexpectedObjectsOrder',
                data: {
                  left: 'id',
                  right: 'name',
                },
              },
            ],
          },
        ],
      })
    })

    it(`${RULE_NAME}(${type}): sorts with comments on the same line`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [
          {
            code: dedent`
              let yokokawaFamily = {
                'mrs-yokokawa': 'Mrs. Yokokawa', // Seita's and Setsuko's mother
                sister: 'Setsuko', // Setsuko completely adores her older brother Seita
                brother: 'Seita', // Seita is responsible, mature, and tough
              }
            `,
            options: [
              {
                'always-on-top': ['name', 'id'],
                type: SortType['line-length'],
                order: SortOrder.desc,
              },
            ],
          },
        ],
        invalid: [
          {
            code: dedent`
              let yokokawaFamily = {
                sister: 'Setsuko', // Setsuko completely adores her older brother Seita
                'mrs-yokokawa': 'Mrs. Yokokawa', // Seita's and Setsuko's mother
                brother: 'Seita', // Seita is responsible, mature, and tough
              }
            `,
            output: dedent`
              let yokokawaFamily = {
                'mrs-yokokawa': 'Mrs. Yokokawa', // Seita's and Setsuko's mother
                sister: 'Setsuko', // Setsuko completely adores her older brother Seita
                brother: 'Seita', // Seita is responsible, mature, and tough
              }
            `,
            options: [
              {
                'always-on-top': ['name', 'id'],
                type: SortType['line-length'],
                order: SortOrder.desc,
              },
            ],
            errors: [
              {
                messageId: 'unexpectedObjectsOrder',
                data: {
                  left: 'sister',
                  right: 'mrs-yokokawa',
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
                messageId: 'unexpectedObjectsOrder',
                data: {
                  left: 'mom',
                  right: 'daughter',
                },
              },
            ],
          },
        ],
      })
    })
  })
})
