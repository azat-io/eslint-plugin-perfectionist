import { ESLintUtils } from '@typescript-eslint/utils'
import { describe, it } from 'vitest'
import { dedent } from 'ts-dedent'

import rule, { RULE_NAME } from '../rules/sort-objects'
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
            options: [options],
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
            options: [options],
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
            options: [options],
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
            options: [options],
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
            options: [options],
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
            options: [options],
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
            options: [options],
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
            options: [options],
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
                id: 'de4d12c2-200c-49bf-a2c8-14f5b4576299',
                name: 'Terror in Resonance',
                episodes: 11,
                genres: ['drama', 'mystery', 'psychological', 'thriller'],
                romaji: 'Zankyou no Terror',
                studio: 'Mappa'
              }
            `,
            options: [
              {
                ...options,
                'custom-groups': { top: ['name', 'id'] },
                groups: ['top', 'unknown'],
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
                id: 'de4d12c2-200c-49bf-a2c8-14f5b4576299',
                name: 'Terror in Resonance',
                episodes: 11,
                genres: ['drama', 'mystery', 'psychological', 'thriller'],
                romaji: 'Zankyou no Terror',
                studio: 'Mappa'
              }
            `,
            options: [
              {
                ...options,
                'custom-groups': { top: ['name', 'id'] },
                groups: ['top', 'unknown'],
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
                ...options,
                'custom-groups': { top: ['name', 'id'] },
                groups: ['top', 'unknown'],
              },
            ],
          },
        ],
        invalid: [
          {
            code: dedent`
              let yokokawaFamily = {
                sister: 'Setsuko',// Setsuko completely adores her older brother Seita
                'mrs-yokokawa': 'Mrs. Yokokawa', // Seita's and Setsuko's mother
                brother: 'Seita', // Seita is responsible, mature, and tough
              }
            `,
            output: dedent`
              let yokokawaFamily = {
                brother: 'Seita', // Seita is responsible, mature, and tough
                'mrs-yokokawa': 'Mrs. Yokokawa', // Seita's and Setsuko's mother
                sister: 'Setsuko',// Setsuko completely adores her older brother Seita
              }
            `,
            options: [
              {
                ...options,
                'custom-groups': { top: ['name', 'id'] },
                groups: ['top', 'unknown'],
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

    it(`${RULE_NAME}(${type}): do not sorts objects without a comma and with a comment in the last element`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [],
        invalid: [
          {
            code: dedent`
              let daddies = {
                rei: 'Rei Suwa', // daddy #1
                kazuki: 'Kazuki Kurusu' // daddy #2
              }
            `,
            output: dedent`
              let daddies = {
                kazuki: 'Kazuki Kurusu', // daddy #2
                rei: 'Rei Suwa' // daddy #1
              }
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedObjectsOrder',
                data: {
                  left: 'rei',
                  right: 'kazuki',
                },
              },
            ],
          },
        ],
      })
    })

    it(`${RULE_NAME}(${type}): sorts destructured object`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [],
        invalid: [
          {
            code: dedent`
              let startTerrorInResonance = ({
                name = 'Nine',
                bombType,
                placeToAttack
              }) => {
                // ...
              }
            `,
            output: dedent`
              let startTerrorInResonance = ({
                bombType,
                name = 'Nine',
                placeToAttack
              }) => {
                // ...
              }
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedObjectsOrder',
                data: {
                  left: 'name',
                  right: 'bombType',
                },
              },
            ],
          },
        ],
      })
    })

    it(`${RULE_NAME}(${type}): does not sort keys if the right value depends on the left value`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [],
        invalid: [
          {
            code: dedent`
              let getPartiallyParasite = ({
                parasite,
                name = parasite,
                school = 'West Heigh',
                gender,
              }) => {
                // ...
              }
            `,
            output: dedent`
              let getPartiallyParasite = ({
                gender,
                parasite,
                name = parasite,
                school = 'West Heigh',
              }) => {
                // ...
              }
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedObjectsOrder',
                data: {
                  left: 'school',
                  right: 'gender',
                },
              },
            ],
          },
        ],
      })
    })

    it(`${RULE_NAME}(${type}): works with complex dependencies`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [],
        invalid: [
          {
            code: dedent`
              let countPrisonSchoolGrade = ({
                biology,
                finalScore = biology + math + naturalScience,
                math,
                naturalScience,
              }) => {
                // ...
              }
            `,
            output: dedent`
              let countPrisonSchoolGrade = ({
                biology,
                math,
                naturalScience,
                finalScore = biology + math + naturalScience,
              }) => {
                // ...
              }
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedObjectsOrder',
                data: {
                  left: 'finalScore',
                  right: 'math',
                },
              },
            ],
          },
          {
            code: dedent`
              let countPrisonSchoolGrade = ({
                biology,
                finalScore = () => biology + math,
                math,
                naturalScience,
              }) => {
                // ...
              }
            `,
            output: dedent`
              let countPrisonSchoolGrade = ({
                biology,
                math,
                finalScore = () => biology + math,
                naturalScience,
              }) => {
                // ...
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
                  left: 'finalScore',
                  right: 'math',
                },
              },
            ],
          },
          {
            code: dedent`
              let countPrisonSchoolGrade = ({
                biology,
                finalScore = 1 === 1 ? 1 === 1 ? math : biology : biology,
                math,
                naturalScience,
              }) => {
                // ...
              }
            `,
            output: dedent`
              let countPrisonSchoolGrade = ({
                biology,
                math,
                finalScore = 1 === 1 ? 1 === 1 ? math : biology : biology,
                naturalScience,
              }) => {
                // ...
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
                  left: 'finalScore',
                  right: 'math',
                },
              },
            ],
          },
          {
            code: dedent`
              let countPrisonSchoolGrade = ({
                biology,
                finalScore = ['a', 'b', 'c'].includes(naturalScience, math, biology),
                math,
                naturalScience,
              }) => {
                // ...
              }
            `,
            output: dedent`
              let countPrisonSchoolGrade = ({
                biology,
                math,
                naturalScience,
                finalScore = ['a', 'b', 'c'].includes(naturalScience, math, biology),
              }) => {
                // ...
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
                  left: 'finalScore',
                  right: 'math',
                },
              },
            ],
          },
          {
            code: dedent`
              let countPrisonSchoolGrade = ({
                biology,
                finalScore = math || biology,
                math,
                naturalScience,
              }) => {
                // ...
              }
            `,
            output: dedent`
              let countPrisonSchoolGrade = ({
                biology,
                math,
                finalScore = math || biology,
                naturalScience,
              }) => {
                // ...
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
                  left: 'finalScore',
                  right: 'math',
                },
              },
            ],
          },
          {
            code: dedent`
              let countPrisonSchoolGrade = ({
                biology,
                finalScore = 1 === 1 ? math : biology,
                math,
                naturalScience,
              }) => {
                // ...
              }
            `,
            output: dedent`
              let countPrisonSchoolGrade = ({
                biology,
                math,
                finalScore = 1 === 1 ? math : biology,
                naturalScience,
              }) => {
                // ...
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
                  left: 'finalScore',
                  right: 'math',
                },
              },
            ],
          },
        ],
      })
    })

    it(`${RULE_NAME}(${type}): allows to use partition comments`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [],
        invalid: [
          {
            code: dedent`
              let heroAssociation = {
                // Part: S-Class
                blast: 'Blast',
                tatsumaki: 'Tatsumaki',
                // Atomic Samurai
                kamikaze: 'Kamikaze',
                // Part: A-Class
                sweet: 'Sweet Mask',
                iaian: 'Iaian',
                // Part: B-Class
                'mountain-ape': 'Mountain Ape',
                // Member of the Blizzard Group
                eyelashes: 'Eyelashes',
              }
            `,
            output: dedent`
              let heroAssociation = {
                // Part: S-Class
                blast: 'Blast',
                // Atomic Samurai
                kamikaze: 'Kamikaze',
                tatsumaki: 'Tatsumaki',
                // Part: A-Class
                iaian: 'Iaian',
                sweet: 'Sweet Mask',
                // Part: B-Class
                // Member of the Blizzard Group
                eyelashes: 'Eyelashes',
                'mountain-ape': 'Mountain Ape',
              }
            `,
            options: [
              {
                ...options,
                'partition-by-comment': 'Part**',
              },
            ],
            errors: [
              {
                messageId: 'unexpectedObjectsOrder',
                data: {
                  left: 'tatsumaki',
                  right: 'kamikaze',
                },
              },
              {
                messageId: 'unexpectedObjectsOrder',
                data: {
                  left: 'sweet',
                  right: 'iaian',
                },
              },
              {
                messageId: 'unexpectedObjectsOrder',
                data: {
                  left: 'mountain-ape',
                  right: 'eyelashes',
                },
              },
            ],
          },
        ],
      })
    })

    it(`${RULE_NAME}(${type}): allows to use all comments as parts`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [
          {
            code: dedent`
              let brothers = {
                // Older brother
                edward: 'Edward Elric',
                // Younger brother
                alphonse: 'Alphonse Elric',
              }
            `,
            options: [
              {
                ...options,
                'partition-by-comment': true,
              },
            ],
          },
        ],
        invalid: [],
      })
    })

    it(`${RULE_NAME}(${type}): allows to use multiple partition comments`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [],
        invalid: [
          {
            code: dedent`
              let psychoPass = {
                /* Public Safety Bureau */
                // Crime Coefficient: Low
                tsunemori: 'Akane Tsunemori',
                // Crime Coefficient: High
                kogami: 'Shinya Kogami',
                ginoza: 'Nobuchika Ginoza',
                masaoka: 'Tomomi Masaoka',
                /* Victims */
                makishima: 'Shogo Makishima',
              }
            `,
            output: dedent`
              let psychoPass = {
                /* Public Safety Bureau */
                // Crime Coefficient: Low
                tsunemori: 'Akane Tsunemori',
                // Crime Coefficient: High
                ginoza: 'Nobuchika Ginoza',
                kogami: 'Shinya Kogami',
                masaoka: 'Tomomi Masaoka',
                /* Victims */
                makishima: 'Shogo Makishima',
              }
            `,
            options: [
              {
                ...options,
                'partition-by-comment': [
                  'Public Safety Bureau',
                  'Crime Coefficient: *',
                  'Victims',
                ],
              },
            ],
            errors: [
              {
                messageId: 'unexpectedObjectsOrder',
                data: {
                  left: 'kogami',
                  right: 'ginoza',
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
      type: SortType.natural,
      order: SortOrder.asc,
      'ignore-case': false,
    }

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
            options: [options],
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
            options: [options],
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
            options: [options],
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
            options: [options],
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
            options: [options],
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
            options: [options],
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
            options: [options],
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
            options: [options],
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
                id: 'de4d12c2-200c-49bf-a2c8-14f5b4576299',
                name: 'Terror in Resonance',
                episodes: 11,
                genres: ['drama', 'mystery', 'psychological', 'thriller'],
                romaji: 'Zankyou no Terror',
                studio: 'Mappa'
              }
            `,
            options: [
              {
                ...options,
                'custom-groups': { top: ['name', 'id'] },
                groups: ['top', 'unknown'],
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
                id: 'de4d12c2-200c-49bf-a2c8-14f5b4576299',
                name: 'Terror in Resonance',
                episodes: 11,
                genres: ['drama', 'mystery', 'psychological', 'thriller'],
                romaji: 'Zankyou no Terror',
                studio: 'Mappa'
              }
            `,
            options: [
              {
                ...options,
                'custom-groups': { top: ['name', 'id'] },
                groups: ['top', 'unknown'],
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
                ...options,
                'custom-groups': { top: ['name', 'id'] },
                groups: ['top', 'unknown'],
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
                ...options,
                'custom-groups': { top: ['name', 'id'] },
                groups: ['top', 'unknown'],
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

    it(`${RULE_NAME}(${type}): do not sorts objects without a comma and with a comment in the last element`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [],
        invalid: [
          {
            code: dedent`
              let daddies = {
                rei: 'Rei Suwa', // daddy #1
                kazuki: 'Kazuki Kurusu' // daddy #2
              }
            `,
            output: dedent`
              let daddies = {
                kazuki: 'Kazuki Kurusu', // daddy #2
                rei: 'Rei Suwa' // daddy #1
              }
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedObjectsOrder',
                data: {
                  left: 'rei',
                  right: 'kazuki',
                },
              },
            ],
          },
        ],
      })
    })

    it(`${RULE_NAME}(${type}): sorts destructured object`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [],
        invalid: [
          {
            code: dedent`
              let startTerrorInResonance = ({
                name = 'Nine',
                bombType,
                placeToAttack
              }) => {
                // ...
              }
            `,
            output: dedent`
              let startTerrorInResonance = ({
                bombType,
                name = 'Nine',
                placeToAttack
              }) => {
                // ...
              }
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedObjectsOrder',
                data: {
                  left: 'name',
                  right: 'bombType',
                },
              },
            ],
          },
        ],
      })
    })

    it(`${RULE_NAME}(${type}): does not sort keys if the right value depends on the left value`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [],
        invalid: [
          {
            code: dedent`
              let getPartiallyParasite = ({
                parasite,
                name = parasite,
                school = 'West Heigh',
                gender,
              }) => {
                // ...
              }
            `,
            output: dedent`
              let getPartiallyParasite = ({
                gender,
                parasite,
                name = parasite,
                school = 'West Heigh',
              }) => {
                // ...
              }
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedObjectsOrder',
                data: {
                  left: 'school',
                  right: 'gender',
                },
              },
            ],
          },
        ],
      })
    })

    it(`${RULE_NAME}(${type}): works with complex dependencies`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [],
        invalid: [
          {
            code: dedent`
              let countPrisonSchoolGrade = ({
                biology,
                finalScore = biology + math + naturalScience,
                math,
                naturalScience,
              }) => {
                // ...
              }
            `,
            output: dedent`
              let countPrisonSchoolGrade = ({
                biology,
                math,
                naturalScience,
                finalScore = biology + math + naturalScience,
              }) => {
                // ...
              }
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedObjectsOrder',
                data: {
                  left: 'finalScore',
                  right: 'math',
                },
              },
            ],
          },
        ],
      })
    })

    it(`${RULE_NAME}(${type}): allows to use partition comments`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [],
        invalid: [
          {
            code: dedent`
              let heroAssociation = {
                // Part: S-Class
                blast: 'Blast',
                tatsumaki: 'Tatsumaki',
                // Atomic Samurai
                kamikaze: 'Kamikaze',
                // Part: A-Class
                sweet: 'Sweet Mask',
                iaian: 'Iaian',
                // Part: B-Class
                'mountain-ape': 'Mountain Ape',
                // Member of the Blizzard Group
                eyelashes: 'Eyelashes',
              }
            `,
            output: dedent`
              let heroAssociation = {
                // Part: S-Class
                blast: 'Blast',
                // Atomic Samurai
                kamikaze: 'Kamikaze',
                tatsumaki: 'Tatsumaki',
                // Part: A-Class
                iaian: 'Iaian',
                sweet: 'Sweet Mask',
                // Part: B-Class
                // Member of the Blizzard Group
                eyelashes: 'Eyelashes',
                'mountain-ape': 'Mountain Ape',
              }
            `,
            options: [
              {
                ...options,
                'partition-by-comment': 'Part**',
              },
            ],
            errors: [
              {
                messageId: 'unexpectedObjectsOrder',
                data: {
                  left: 'tatsumaki',
                  right: 'kamikaze',
                },
              },
              {
                messageId: 'unexpectedObjectsOrder',
                data: {
                  left: 'sweet',
                  right: 'iaian',
                },
              },
              {
                messageId: 'unexpectedObjectsOrder',
                data: {
                  left: 'mountain-ape',
                  right: 'eyelashes',
                },
              },
            ],
          },
        ],
      })
    })

    it(`${RULE_NAME}(${type}): allows to use all comments as parts`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [
          {
            code: dedent`
              let brothers = {
                // Older brother
                edward: 'Edward Elric',
                // Younger brother
                alphonse: 'Alphonse Elric',
              }
            `,
            options: [
              {
                ...options,
                'partition-by-comment': true,
              },
            ],
          },
        ],
        invalid: [],
      })
    })

    it(`${RULE_NAME}(${type}): allows to use multiple partition comments`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [],
        invalid: [
          {
            code: dedent`
              let psychoPass = {
                /* Public Safety Bureau */
                // Crime Coefficient: Low
                tsunemori: 'Akane Tsunemori',
                // Crime Coefficient: High
                kogami: 'Shinya Kogami',
                ginoza: 'Nobuchika Ginoza',
                masaoka: 'Tomomi Masaoka',
                /* Victims */
                makishima: 'Shogo Makishima',
              }
            `,
            output: dedent`
              let psychoPass = {
                /* Public Safety Bureau */
                // Crime Coefficient: Low
                tsunemori: 'Akane Tsunemori',
                // Crime Coefficient: High
                ginoza: 'Nobuchika Ginoza',
                kogami: 'Shinya Kogami',
                masaoka: 'Tomomi Masaoka',
                /* Victims */
                makishima: 'Shogo Makishima',
              }
            `,
            options: [
              {
                ...options,
                'partition-by-comment': [
                  'Public Safety Bureau',
                  'Crime Coefficient: *',
                  'Victims',
                ],
              },
            ],
            errors: [
              {
                messageId: 'unexpectedObjectsOrder',
                data: {
                  left: 'kogami',
                  right: 'ginoza',
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
            options: [options],
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
            options: [options],
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
            options: [options],
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
            options: [options],
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
            options: [options],
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
            options: [options],
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
            options: [options],
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
            options: [options],
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
                id: 'de4d12c2-200c-49bf-a2c8-14f5b4576299',
                name: 'Terror in Resonance',
                genres: ['drama', 'mystery', 'psychological', 'thriller'],
                romaji: 'Zankyou no Terror',
                studio: 'Mappa',
                episodes: 11,
              }
            `,
            options: [
              {
                ...options,
                'custom-groups': { top: ['name', 'id'] },
                groups: ['top', 'unknown'],
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
                id: 'de4d12c2-200c-49bf-a2c8-14f5b4576299',
                name: 'Terror in Resonance',
                genres: ['drama', 'mystery', 'psychological', 'thriller'],
                romaji: 'Zankyou no Terror',
                studio: 'Mappa',
                episodes: 11
              }
            `,
            options: [
              {
                ...options,
                'custom-groups': { top: ['name', 'id'] },
                groups: ['top', 'unknown'],
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
                ...options,
                'custom-groups': { top: ['name', 'id'] },
                groups: ['top', 'unknown'],
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
                ...options,
                'custom-groups': { top: ['name', 'id'] },
                groups: ['top', 'unknown'],
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

    it(`${RULE_NAME}(${type}): do not sorts objects without a comma and with a comment in the last element`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [],
        invalid: [
          {
            code: dedent`
              let daddies = {
                rei: 'Rei Suwa', // daddy #1
                kazuki: 'Kazuki Kurusu' // daddy #2
              }
            `,
            output: dedent`
              let daddies = {
                kazuki: 'Kazuki Kurusu', // daddy #2
                rei: 'Rei Suwa' // daddy #1
              }
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedObjectsOrder',
                data: {
                  left: 'rei',
                  right: 'kazuki',
                },
              },
            ],
          },
        ],
      })
    })

    it(`${RULE_NAME}(${type}): sorts destructured object`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [],
        invalid: [
          {
            code: dedent`
              let startTerrorInResonance = ({
                name = 'Nine',
                bombType,
                placeToAttack
              }) => {
                // ...
              }
            `,
            output: dedent`
              let startTerrorInResonance = ({
                name = 'Nine',
                placeToAttack,
                bombType
              }) => {
                // ...
              }
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedObjectsOrder',
                data: {
                  left: 'bombType',
                  right: 'placeToAttack',
                },
              },
            ],
          },
        ],
      })
    })

    it(`${RULE_NAME}(${type}): does not sort keys if the right value depends on the left value`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [],
        invalid: [
          {
            code: dedent`
              let getPartiallyParasite = ({
                parasite,
                name = parasite,
                school = 'West Heigh',
                gender,
              }) => {
                // ...
              }
            `,
            output: dedent`
              let getPartiallyParasite = ({
                school = 'West Heigh',
                parasite,
                name = parasite,
                gender,
              }) => {
                // ...
              }
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedObjectsOrder',
                data: {
                  left: 'name',
                  right: 'school',
                },
              },
            ],
          },
        ],
      })
    })

    it(`${RULE_NAME}(${type}): works with complex dependencies`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [],
        invalid: [
          {
            code: dedent`
              let countPrisonSchoolGrade = ({
                biology,
                finalScore = biology + math + naturalScience,
                math,
                naturalScience,
              }) => {
                // ...
              }
            `,
            output: dedent`
              let countPrisonSchoolGrade = ({
                naturalScience,
                biology,
                math,
                finalScore = biology + math + naturalScience,
              }) => {
                // ...
              }
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedObjectsOrder',
                data: {
                  left: 'finalScore',
                  right: 'math',
                },
              },
              {
                messageId: 'unexpectedObjectsOrder',
                data: {
                  left: 'math',
                  right: 'naturalScience',
                },
              },
            ],
          },
        ],
      })
    })

    it(`${RULE_NAME}(${type}): allows to use partition comments`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [],
        invalid: [
          {
            code: dedent`
              let heroAssociation = {
                // Part: S-Class
                blast: 'Blast',
                tatsumaki: 'Tatsumaki',
                // Atomic Samurai
                kamikaze: 'Kamikaze',
                // Part: A-Class
                sweet: 'Sweet Mask',
                iaian: 'Iaian',
                // Part: B-Class
                'mountain-ape': 'Mountain Ape',
                // Member of the Blizzard Group
                eyelashes: 'Eyelashes',
              }
            `,
            output: dedent`
              let heroAssociation = {
                // Part: S-Class
                tatsumaki: 'Tatsumaki',
                // Atomic Samurai
                kamikaze: 'Kamikaze',
                blast: 'Blast',
                // Part: A-Class
                sweet: 'Sweet Mask',
                iaian: 'Iaian',
                // Part: B-Class
                'mountain-ape': 'Mountain Ape',
                // Member of the Blizzard Group
                eyelashes: 'Eyelashes',
              }
            `,
            options: [
              {
                ...options,
                'partition-by-comment': 'Part**',
              },
            ],
            errors: [
              {
                messageId: 'unexpectedObjectsOrder',
                data: {
                  left: 'blast',
                  right: 'tatsumaki',
                },
              },
            ],
          },
        ],
      })
    })

    it(`${RULE_NAME}(${type}): allows to use all comments as parts`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [
          {
            code: dedent`
              let brothers = {
                // Older brother
                edward: 'Edward Elric',
                // Younger brother
                alphonse: 'Alphonse Elric',
              }
            `,
            options: [
              {
                ...options,
                'partition-by-comment': true,
              },
            ],
          },
        ],
        invalid: [],
      })
    })

    it(`${RULE_NAME}(${type}): allows to use multiple partition comments`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [],
        invalid: [
          {
            code: dedent`
              let psychoPass = {
                /* Public Safety Bureau */
                // Crime Coefficient: Low
                tsunemori: 'Akane Tsunemori',
                // Crime Coefficient: High
                kogami: 'Shinya Kogami',
                ginoza: 'Nobuchika Ginoza',
                masaoka: 'Tomomi Masaoka',
                /* Victims */
                makishima: 'Shogo Makishima',
              }
            `,
            output: dedent`
              let psychoPass = {
                /* Public Safety Bureau */
                // Crime Coefficient: Low
                tsunemori: 'Akane Tsunemori',
                // Crime Coefficient: High
                ginoza: 'Nobuchika Ginoza',
                masaoka: 'Tomomi Masaoka',
                kogami: 'Shinya Kogami',
                /* Victims */
                makishima: 'Shogo Makishima',
              }
            `,
            options: [
              {
                ...options,
                'partition-by-comment': [
                  'Public Safety Bureau',
                  'Crime Coefficient: *',
                  'Victims',
                ],
              },
            ],
            errors: [
              {
                messageId: 'unexpectedObjectsOrder',
                data: {
                  left: 'kogami',
                  right: 'ginoza',
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
          {
            code: dedent`
              const calculator = {
                log: () => undefined,
                log10: () => undefined,
                log1p: () => undefined,
                log2: () => undefined,
              }
            `,
            options: [{}],
          },
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

    it(`${RULE_NAME}: allow to disable rule for styled-components`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [
          {
            code: dedent`
              const Box = styled.div({
                background: "palevioletred",
                width: "50px",
                height: "50px",
              })
            `,
            options: [
              {
                'styled-components': false,
              },
            ],
          },
          {
            code: dedent`
              const PropsBox = styled.div((props) => ({
                background: props.background,
                height: "50px",
                width: "50px",
              }))
            `,
            options: [
              {
                'styled-components': false,
              },
            ],
          },
          {
            code: dedent`
              export default styled('div')(() => ({
                borderRadius: 0,
                borderWidth: 0,
                border: 0,
                borderBottom: hasBorder && \`1px solid \${theme.palette.divider}\`,
              }))
            `,
            options: [
              {
                'styled-components': false,
              },
            ],
          },
        ],
        invalid: [],
      })
    })
  })
})
