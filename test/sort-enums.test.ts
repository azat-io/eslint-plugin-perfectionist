import { RuleTester } from '@typescript-eslint/rule-tester'
import { afterAll, describe, it } from 'vitest'
import { dedent } from 'ts-dedent'

import rule, { RULE_NAME } from '../rules/sort-enums'
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

    ruleTester.run(`${RULE_NAME}(${type}): sorts enum members`, rule, {
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
          options: [options],
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
          options: [options],
          errors: [
            {
              messageId: 'unexpectedEnumsOrder',
              data: {
                left: 'Sonozaki Shion',
                right: 'Ryūgū Rena',
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(
      `${RULE_NAME}(${type}): sorts enum members with number keys`,
      rule,
      {
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
            options: [options],
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
            options: [options],
            errors: [
              {
                messageId: 'unexpectedEnumsOrder',
                data: {
                  left: '8',
                  right: '12',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(
      `${RULE_NAME}(${type}): doesn't sorts enum members without initializer`,
      rule,
      {
        valid: [
          {
            code: dedent`
              enum TokyoGodfathers {
                Gin,
                Hana = 'Hana',
                Miyuki,
              }
            `,
            options: [options],
          },
        ],
        invalid: [],
      },
    )

    ruleTester.run(
      `${RULE_NAME}(${type}): sorts enum members with boolean ids`,
      rule,
      {
        valid: [
          {
            code: dedent`
              enum ChainsawMan {
                false = 'Pochita',
                true = 'Denji',
              }
            `,
            options: [options],
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
            options: [options],
            errors: [
              {
                messageId: 'unexpectedEnumsOrder',
                data: {
                  left: 'true',
                  right: 'false',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(
      `${RULE_NAME}(${type}): does not break interface docs`,
      rule,
      {
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
            options: [options],
            errors: [
              {
                messageId: 'unexpectedEnumsOrder',
                data: {
                  left: 'Yuu',
                  right: 'Chi-Chii',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(
      `${RULE_NAME}(${type}): does not sort enums with implicit values`,
      rule,
      {
        valid: [
          {
            code: dedent`
              export enum KessokuBand {
                HitoriGotou, // implicit value: 0
                NijikaIjichi, // implicit value: 1
                RyouYamada, // implicit value: 2
                IkuyoKita, // implicit value: 3
              }
            `,
            options: [options],
          },
        ],
        invalid: [],
      },
    )
  })

  describe(`${RULE_NAME}: sorting by natural order`, () => {
    let type = 'natural-order'

    let options = {
      type: SortType.natural,
      order: SortOrder.asc,
      'ignore-case': false,
    }

    ruleTester.run(`${RULE_NAME}(${type}): sorts enum members`, rule, {
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
          options: [options],
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
          options: [options],
          errors: [
            {
              messageId: 'unexpectedEnumsOrder',
              data: {
                left: 'Sonozaki Shion',
                right: 'Ryūgū Rena',
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(
      `${RULE_NAME}(${type}): sorts enum members with number keys`,
      rule,
      {
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
            options: [options],
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
            options: [options],
            errors: [
              {
                messageId: 'unexpectedEnumsOrder',
                data: {
                  left: '12',
                  right: '2',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(
      `${RULE_NAME}(${type}): doesn't sorts enum members without initializer`,
      rule,
      {
        valid: [
          {
            code: dedent`
              enum TokyoGodfathers {
                Gin,
                Hana = 'Hana',
                Miyuki,
              }
            `,
            options: [options],
          },
        ],
        invalid: [],
      },
    )

    ruleTester.run(
      `${RULE_NAME}(${type}): sorts enum members with boolean ids`,
      rule,
      {
        valid: [
          {
            code: dedent`
              enum ChainsawMan {
                false = 'Pochita',
                true = 'Denji',
              }
            `,
            options: [options],
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
            options: [options],
            errors: [
              {
                messageId: 'unexpectedEnumsOrder',
                data: {
                  left: 'true',
                  right: 'false',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(
      `${RULE_NAME}(${type}): does not break interface docs`,
      rule,
      {
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
            options: [options],
            errors: [
              {
                messageId: 'unexpectedEnumsOrder',
                data: {
                  left: 'Yuu',
                  right: 'Chi-Chii',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(
      `${RULE_NAME}(${type}): does not sort enums with implicit values`,
      rule,
      {
        valid: [
          {
            code: dedent`
              export enum KessokuBand {
                HitoriGotou, // implicit value: 0
                NijikaIjichi, // implicit value: 1
                RyouYamada, // implicit value: 2
                IkuyoKita, // implicit value: 3
              }
            `,
            options: [options],
          },
        ],
        invalid: [],
      },
    )
  })

  describe(`${RULE_NAME}: sorting by line length`, () => {
    let type = 'line-length-order'

    let options = {
      type: SortType['line-length'],
      order: SortOrder.desc,
    }

    ruleTester.run(`${RULE_NAME}(${type}): sorts enum members`, rule, {
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
          options: [options],
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
          options: [options],
          errors: [
            {
              messageId: 'unexpectedEnumsOrder',
              data: {
                left: 'Furude Rika',
                right: 'Sonozaki Mion',
              },
            },
            {
              messageId: 'unexpectedEnumsOrder',
              data: {
                left: 'Sonozaki Mion',
                right: 'Sonozaki Shion',
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(
      `${RULE_NAME}(${type}): sorts enum members with number keys`,
      rule,
      {
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
            options: [options],
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
            options: [options],
            errors: [
              {
                messageId: 'unexpectedEnumsOrder',
                data: {
                  left: '1',
                  right: '12',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(
      `${RULE_NAME}(${type}): doesn't sorts enum members without initializer`,
      rule,
      {
        valid: [
          {
            code: dedent`
              enum TokyoGodfathers {
                Hana = 'Hana',
                Miyuki,
                Gin,
              }
            `,
            options: [options],
          },
        ],
        invalid: [],
      },
    )

    ruleTester.run(
      `${RULE_NAME}(${type}): sorts enum members with boolean ids`,
      rule,
      {
        valid: [
          {
            code: dedent`
              enum ChainsawMan {
                false = 'Pochita',
                true = 'Denji',
              }
            `,
            options: [options],
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
            options: [options],
            errors: [
              {
                messageId: 'unexpectedEnumsOrder',
                data: {
                  left: 'true',
                  right: 'false',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(
      `${RULE_NAME}(${type}): does not break interface docs`,
      rule,
      {
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
            options: [options],
            errors: [
              {
                messageId: 'unexpectedEnumsOrder',
                data: {
                  left: 'Yuu',
                  right: 'Chi-Chii',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(
      `${RULE_NAME}(${type}): does not sort enums with implicit values`,
      rule,
      {
        valid: [
          {
            code: dedent`
              export enum KessokuBand {
                HitoriGotou, // implicit value: 0
                NijikaIjichi, // implicit value: 1
                RyouYamada, // implicit value: 2
                IkuyoKita, // implicit value: 3
              }
            `,
            options: [options],
          },
        ],
        invalid: [],
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
            enum SummerTime {
              'Mio Kofune' = 'Mio Kofune',
              'Shinpei Ajiro' = 'Shinpei Ajiro',
              'Ushio Kofune' = 'Ushio Kofune',
            }
          `,
          {
            code: dedent`
              enum NumberBase {
                BASE_10 = 10,
                BASE_16 = 16,
                BASE_2 = 2,
                BASE_8 = 8
              }
            `,
            options: [{}],
          },
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
                  left: 'Ushio Kofune',
                  right: 'Mio Kofune',
                },
              },
            ],
          },
        ],
      },
    )
  })
})
