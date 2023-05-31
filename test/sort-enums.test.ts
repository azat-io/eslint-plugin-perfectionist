import { ESLintUtils } from '@typescript-eslint/utils'
import { describe, it } from 'vitest'
import { dedent } from 'ts-dedent'

import rule, { RULE_NAME } from '../rules/sort-enums'
import { SortType, SortOrder } from '../typings'

describe(RULE_NAME, () => {
  let ruleTester = new ESLintUtils.RuleTester({
    parser: '@typescript-eslint/parser',
  })

  describe(`${RULE_NAME}: sorting by alphabetical order`, () => {
    let type = 'alphabetical-order'

    it(`${RULE_NAME}(${type}): sorts enum members`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [
          {
            code: dedent`
              enum Hinamizawa {
                'Furude Rika' = 'Furude Rika',
                'Ryūgū Rena' = 'Ryūgū Rena',
                'Sonozaki Mion' = 'Sonozaki Mion',
                'Sonozaki Shion' = 'Sonozaki Shion',
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
              enum Hinamizawa {
                'Furude Rika' = 'Furude Rika',
                'Sonozaki Mion' = 'Sonozaki Mion',
                'Sonozaki Shion' = 'Sonozaki Shion',
                'Ryūgū Rena' = 'Ryūgū Rena',
              }
            `,
            output: dedent`
              enum Hinamizawa {
                'Furude Rika' = 'Furude Rika',
                'Ryūgū Rena' = 'Ryūgū Rena',
                'Sonozaki Mion' = 'Sonozaki Mion',
                'Sonozaki Shion' = 'Sonozaki Shion',
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
                messageId: 'unexpectedEnumsOrder',
                data: {
                  first: 'Sonozaki Shion',
                  second: 'Ryūgū Rena',
                },
              },
            ],
          },
        ],
      })
    })

    it(`${RULE_NAME}(${type}): sorts enum members with number keys`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [
          {
            code: dedent`
              enum Kuroko {
                1 = 'Riko Aida',
                12 = 'Tetsuya Kuroko',
                2 = 'Teppei Kiyoshi',
                8 = 'Daiki Aomine',
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
              enum Kuroko {
                1 = 'Riko Aida',
                2 = 'Teppei Kiyoshi',
                8 = 'Daiki Aomine',
                12 = 'Tetsuya Kuroko',
              }
            `,
            output: dedent`
              enum Kuroko {
                1 = 'Riko Aida',
                12 = 'Tetsuya Kuroko',
                2 = 'Teppei Kiyoshi',
                8 = 'Daiki Aomine',
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
                messageId: 'unexpectedEnumsOrder',
                data: {
                  first: '8',
                  second: '12',
                },
              },
            ],
          },
        ],
      })
    })

    it(`${RULE_NAME}(${type}): sorts enum members without initializer`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [
          {
            code: dedent`
              enum TokyoGodfathers {
                Gin,
                Hana = 'Hana',
                Miyuki,
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
              enum TokyoGodfathers {
                Gin,
                Miyuki,
                Hana = 'Hana',
              }
            `,
            output: dedent`
              enum TokyoGodfathers {
                Gin,
                Hana = 'Hana',
                Miyuki,
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
                messageId: 'unexpectedEnumsOrder',
                data: {
                  first: 'Miyuki',
                  second: 'Hana',
                },
              },
            ],
          },
        ],
      })
    })

    it(`${RULE_NAME}(${type}): sorts enum members with boolean ids`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [
          {
            code: dedent`
              enum ChainsawMan {
                false = 'Pochita',
                true = 'Denji',
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
              enum ChainsawMan {
                true = 'Denji',
                false = 'Pochita',
              }
            `,
            output: dedent`
              enum ChainsawMan {
                false = 'Pochita',
                true = 'Denji',
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
                messageId: 'unexpectedEnumsOrder',
                data: {
                  first: 'true',
                  second: 'false',
                },
              },
            ],
          },
        ],
      })
    })

    it(`${RULE_NAME}(${type}): does not break interface docs`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [],
        invalid: [
          {
            code: dedent`
              enum LastTourGirls {
                /**
                 * Yuuri is a care-free, fun-loving girl. She is the direct foil and companion of Chito. She carries an Arisaka type 38 rifle and loves food more than anything else in the world.
                 */
                Yuu = 'Yuuri',
                /**
                 * She travels with Yuuri on their Kettenkrad. She can read and write in the current language, but not in kanji or Latin alphabets, because they became old languages in this world. She loves reading and collecting books she finds during traveling.
                 */
                'Chi-Chii' = 'Chito',
              }
            `,
            output: dedent`
              enum LastTourGirls {
                /**
                 * She travels with Yuuri on their Kettenkrad. She can read and write in the current language, but not in kanji or Latin alphabets, because they became old languages in this world. She loves reading and collecting books she finds during traveling.
                 */
                'Chi-Chii' = 'Chito',
                /**
                 * Yuuri is a care-free, fun-loving girl. She is the direct foil and companion of Chito. She carries an Arisaka type 38 rifle and loves food more than anything else in the world.
                 */
                Yuu = 'Yuuri',
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
                messageId: 'unexpectedEnumsOrder',
                data: {
                  first: 'Yuu',
                  second: 'Chi-Chii',
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

    it(`${RULE_NAME}(${type}): sorts enum members`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [
          {
            code: dedent`
              enum Hinamizawa {
                'Furude Rika' = 'Furude Rika',
                'Ryūgū Rena' = 'Ryūgū Rena',
                'Sonozaki Mion' = 'Sonozaki Mion',
                'Sonozaki Shion' = 'Sonozaki Shion',
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
              enum Hinamizawa {
                'Furude Rika' = 'Furude Rika',
                'Sonozaki Mion' = 'Sonozaki Mion',
                'Sonozaki Shion' = 'Sonozaki Shion',
                'Ryūgū Rena' = 'Ryūgū Rena',
              }
            `,
            output: dedent`
              enum Hinamizawa {
                'Furude Rika' = 'Furude Rika',
                'Ryūgū Rena' = 'Ryūgū Rena',
                'Sonozaki Mion' = 'Sonozaki Mion',
                'Sonozaki Shion' = 'Sonozaki Shion',
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
                messageId: 'unexpectedEnumsOrder',
                data: {
                  first: 'Sonozaki Shion',
                  second: 'Ryūgū Rena',
                },
              },
            ],
          },
        ],
      })
    })

    it(`${RULE_NAME}(${type}): sorts enum members with number keys`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [
          {
            code: dedent`
              enum Kuroko {
                1 = 'Riko Aida',
                2 = 'Teppei Kiyoshi',
                8 = 'Daiki Aomine',
                12 = 'Tetsuya Kuroko',
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
              enum Kuroko {
                1 = 'Riko Aida',
                12 = 'Tetsuya Kuroko',
                2 = 'Teppei Kiyoshi',
                8 = 'Daiki Aomine',
              }
            `,
            output: dedent`
              enum Kuroko {
                1 = 'Riko Aida',
                2 = 'Teppei Kiyoshi',
                8 = 'Daiki Aomine',
                12 = 'Tetsuya Kuroko',
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
                messageId: 'unexpectedEnumsOrder',
                data: {
                  first: '12',
                  second: '2',
                },
              },
            ],
          },
        ],
      })
    })

    it(`${RULE_NAME}(${type}): sorts enum members without initializer`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [
          {
            code: dedent`
              enum TokyoGodfathers {
                Gin,
                Hana = 'Hana',
                Miyuki,
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
              enum TokyoGodfathers {
                Gin,
                Miyuki,
                Hana = 'Hana',
              }
            `,
            output: dedent`
              enum TokyoGodfathers {
                Gin,
                Hana = 'Hana',
                Miyuki,
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
                messageId: 'unexpectedEnumsOrder',
                data: {
                  first: 'Miyuki',
                  second: 'Hana',
                },
              },
            ],
          },
        ],
      })
    })

    it(`${RULE_NAME}(${type}): sorts enum members with boolean ids`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [
          {
            code: dedent`
              enum ChainsawMan {
                false = 'Pochita',
                true = 'Denji',
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
              enum ChainsawMan {
                true = 'Denji',
                false = 'Pochita',
              }
            `,
            output: dedent`
              enum ChainsawMan {
                false = 'Pochita',
                true = 'Denji',
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
                messageId: 'unexpectedEnumsOrder',
                data: {
                  first: 'true',
                  second: 'false',
                },
              },
            ],
          },
        ],
      })
    })

    it(`${RULE_NAME}(${type}): does not break interface docs`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [],
        invalid: [
          {
            code: dedent`
              enum LastTourGirls {
                /**
                 * Yuuri is a care-free, fun-loving girl. She is the direct foil and companion of Chito. She carries an Arisaka type 38 rifle and loves food more than anything else in the world.
                 */
                Yuu = 'Yuuri',
                /**
                 * She travels with Yuuri on their Kettenkrad. She can read and write in the current language, but not in kanji or Latin alphabets, because they became old languages in this world. She loves reading and collecting books she finds during traveling.
                 */
                'Chi-Chii' = 'Chito',
              }
            `,
            output: dedent`
              enum LastTourGirls {
                /**
                 * She travels with Yuuri on their Kettenkrad. She can read and write in the current language, but not in kanji or Latin alphabets, because they became old languages in this world. She loves reading and collecting books she finds during traveling.
                 */
                'Chi-Chii' = 'Chito',
                /**
                 * Yuuri is a care-free, fun-loving girl. She is the direct foil and companion of Chito. She carries an Arisaka type 38 rifle and loves food more than anything else in the world.
                 */
                Yuu = 'Yuuri',
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
                messageId: 'unexpectedEnumsOrder',
                data: {
                  first: 'Yuu',
                  second: 'Chi-Chii',
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

    it(`${RULE_NAME}(${type}): sorts enum members`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [
          {
            code: dedent`
              enum Hinamizawa {
                'Sonozaki Shion' = 'Sonozaki Shion',
                'Sonozaki Mion' = 'Sonozaki Mion',
                'Furude Rika' = 'Furude Rika',
                'Ryūgū Rena' = 'Ryūgū Rena',
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
              enum Hinamizawa {
                'Furude Rika' = 'Furude Rika',
                'Sonozaki Mion' = 'Sonozaki Mion',
                'Sonozaki Shion' = 'Sonozaki Shion',
                'Ryūgū Rena' = 'Ryūgū Rena',
              }
            `,
            output: dedent`
              enum Hinamizawa {
                'Sonozaki Shion' = 'Sonozaki Shion',
                'Sonozaki Mion' = 'Sonozaki Mion',
                'Furude Rika' = 'Furude Rika',
                'Ryūgū Rena' = 'Ryūgū Rena',
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
                messageId: 'unexpectedEnumsOrder',
                data: {
                  first: 'Furude Rika',
                  second: 'Sonozaki Mion',
                },
              },
              {
                messageId: 'unexpectedEnumsOrder',
                data: {
                  first: 'Sonozaki Mion',
                  second: 'Sonozaki Shion',
                },
              },
            ],
          },
        ],
      })
    })

    it(`${RULE_NAME}(${type}): sorts enum members with number keys`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [
          {
            code: dedent`
              enum Kuroko {
                12 = 'Tetsuya Kuroko',
                2 = 'Teppei Kiyoshi',
                8 = 'Daiki Aomine',
                1 = 'Riko Aida',
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
              enum Kuroko {
                1 = 'Riko Aida',
                12 = 'Tetsuya Kuroko',
                2 = 'Teppei Kiyoshi',
                8 = 'Daiki Aomine',
              }
            `,
            output: dedent`
              enum Kuroko {
                12 = 'Tetsuya Kuroko',
                2 = 'Teppei Kiyoshi',
                8 = 'Daiki Aomine',
                1 = 'Riko Aida',
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
                messageId: 'unexpectedEnumsOrder',
                data: {
                  first: '1',
                  second: '12',
                },
              },
            ],
          },
        ],
      })
    })

    it(`${RULE_NAME}(${type}): sorts enum members without initializer`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [
          {
            code: dedent`
              enum TokyoGodfathers {
                Hana = 'Hana',
                Miyuki,
                Gin,
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
              enum TokyoGodfathers {
                Gin,
                Miyuki,
                Hana = 'Hana',
              }
            `,
            output: dedent`
              enum TokyoGodfathers {
                Hana = 'Hana',
                Miyuki,
                Gin,
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
                messageId: 'unexpectedEnumsOrder',
                data: {
                  first: 'Gin',
                  second: 'Miyuki',
                },
              },
              {
                messageId: 'unexpectedEnumsOrder',
                data: {
                  first: 'Miyuki',
                  second: 'Hana',
                },
              },
            ],
          },
        ],
      })
    })

    it(`${RULE_NAME}(${type}): sorts enum members with boolean ids`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [
          {
            code: dedent`
              enum ChainsawMan {
                false = 'Pochita',
                true = 'Denji',
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
              enum ChainsawMan {
                true = 'Denji',
                false = 'Pochita',
              }
            `,
            output: dedent`
              enum ChainsawMan {
                false = 'Pochita',
                true = 'Denji',
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
                messageId: 'unexpectedEnumsOrder',
                data: {
                  first: 'true',
                  second: 'false',
                },
              },
            ],
          },
        ],
      })
    })

    it(`${RULE_NAME}(${type}): does not break interface docs`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [],
        invalid: [
          {
            code: dedent`
              enum LastTourGirls {
                /**
                 * Yuuri is a care-free, fun-loving girl. She is the direct foil and companion of Chito. She carries an Arisaka type 38 rifle and loves food more than anything else in the world.
                 */
                Yuu = 'Yuuri',
                /**
                 * She travels with Yuuri on their Kettenkrad. She can read and write in the current language, but not in kanji or Latin alphabets, because they became old languages in this world. She loves reading and collecting books she finds during traveling.
                 */
                'Chi-Chii' = 'Chito',
              }
            `,
            output: dedent`
              enum LastTourGirls {
                /**
                 * She travels with Yuuri on their Kettenkrad. She can read and write in the current language, but not in kanji or Latin alphabets, because they became old languages in this world. She loves reading and collecting books she finds during traveling.
                 */
                'Chi-Chii' = 'Chito',
                /**
                 * Yuuri is a care-free, fun-loving girl. She is the direct foil and companion of Chito. She carries an Arisaka type 38 rifle and loves food more than anything else in the world.
                 */
                Yuu = 'Yuuri',
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
                messageId: 'unexpectedEnumsOrder',
                data: {
                  first: 'Yuu',
                  second: 'Chi-Chii',
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
            enum SummerTime {
              'Mio Kofune' = 'Mio Kofune',
              'Shinpei Ajiro' = 'Shinpei Ajiro',
              'Ushio Kofune' = 'Ushio Kofune',
            }
          `,
        ],
        invalid: [
          {
            code: dedent`
              enum SummerTime {
                'Shinpei Ajiro' = 'Shinpei Ajiro',
                'Ushio Kofune' = 'Ushio Kofune',
                'Mio Kofune' = 'Mio Kofune'
              }
            `,
            output: dedent`
              enum SummerTime {
                'Mio Kofune' = 'Mio Kofune',
                'Shinpei Ajiro' = 'Shinpei Ajiro',
                'Ushio Kofune' = 'Ushio Kofune'
              }
            `,
            errors: [
              {
                messageId: 'unexpectedEnumsOrder',
                data: {
                  first: 'Ushio Kofune',
                  second: 'Mio Kofune',
                },
              },
            ],
          },
        ],
      })
    })
  })
})
