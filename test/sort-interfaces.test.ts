import { ESLintUtils } from '@typescript-eslint/utils'
import { describe, it } from 'vitest'
import { dedent } from 'ts-dedent'

import rule, { RULE_NAME } from '~/rules/sort-interfaces'
import { SortType, SortOrder } from '~/typings'

describe(RULE_NAME, () => {
  let ruleTester = new ESLintUtils.RuleTester({
    parser: '@typescript-eslint/parser',
  })

  describe(`${RULE_NAME}: sorting by alphabetical order`, () => {
    let type = 'alphabetical-order'

    it(`${RULE_NAME}(${type}): sorts interface properties`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [
          {
            code: dedent`
              interface DossierByTwilight {
                age: string
                country: 'Westalis' | 'Ostania',
                name: string
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
              interface DossierByTwilight {
                name: string
                age: string
                country: 'Westalis' | 'Ostania',
              }
            `,
            output: dedent`
              interface DossierByTwilight {
                age: string
                country: 'Westalis' | 'Ostania',
                name: string
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
                messageId: 'unexpectedInterfacePropertiesOrder',
                data: {
                  first: 'name',
                  second: 'age',
                },
              },
            ],
          },
        ],
      })
    })

    it(`${RULE_NAME}(${type}): works with ts index signature`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [
          {
            code: dedent`
              interface JujutsuHigh {
                [key in Sorcerer]: string
                yuuji: 'Yuuji Itadori'
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
              interface JujutsuHigh {
                yuuji: 'Yuuji Itadori'
                [key in Sorcerer]: string
              }
            `,
            output: dedent`
              interface JujutsuHigh {
                [key in Sorcerer]: string
                yuuji: 'Yuuji Itadori'
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
                messageId: 'unexpectedInterfacePropertiesOrder',
                data: {
                  first: 'yuuji',
                  second: '[key in Sorcerer]',
                },
              },
            ],
          },
        ],
      })
    })

    it(`${RULE_NAME}(${type}): sorts multi-word keys by value`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [
          {
            code: dedent`
              interface CowboyBebop {
                ein: Dog
                'faye-valentine': Hunter
                jet: Hunter
                'spike-spiegel': Hunter
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
              interface CowboyBebop {
                'spike-spiegel': Hunter
                ein: Dog
                jet: Hunter
                'faye-valentine': Hunter
              }
            `,
            output: dedent`
              interface CowboyBebop {
                ein: Dog
                'faye-valentine': Hunter
                jet: Hunter
                'spike-spiegel': Hunter
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
                messageId: 'unexpectedInterfacePropertiesOrder',
                data: {
                  first: 'spike-spiegel',
                  second: 'ein',
                },
              },
              {
                messageId: 'unexpectedInterfacePropertiesOrder',
                data: {
                  first: 'jet',
                  second: 'faye-valentine',
                },
              },
            ],
          },
        ],
      })
    })

    it(`${RULE_NAME}(${type}): works with typescript index signature`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [
          {
            code: dedent`
              interface Evangelion {
                [key: string]: string
                'evangelion-owner': string
                name: string
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
              interface Evangelion {
                'evangelion-owner': string
                [key: string]: string
                name: string
              }
            `,
            output: dedent`
              interface Evangelion {
                [key: string]: string
                'evangelion-owner': string
                name: string
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
                messageId: 'unexpectedInterfacePropertiesOrder',
                data: {
                  first: 'evangelion-owner',
                  second: '[key: string]',
                },
              },
            ],
          },
        ],
      })
    })

    it(`${RULE_NAME}(${type}): works with method and construct signatures`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [
          {
            code: dedent`
              interface Zenitsu {
                age: number
                airSpin: () => void
                godspeed(): number
                name: string
                sixfold()
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
              interface Zenitsu {
                age: number
                godspeed(): number
                airSpin: () => void
                sixfold()
                name: string
              }
            `,
            output: dedent`
              interface Zenitsu {
                age: number
                airSpin: () => void
                godspeed(): number
                name: string
                sixfold()
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
                messageId: 'unexpectedInterfacePropertiesOrder',
                data: {
                  first: 'godspeed()',
                  second: 'airSpin',
                },
              },
              {
                messageId: 'unexpectedInterfacePropertiesOrder',
                data: {
                  first: 'sixfold()',
                  second: 'name',
                },
              },
            ],
          },
        ],
      })
    })

    it(`${RULE_NAME}(${type}): works with empty properties with empty values`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [
          {
            code: dedent`
              interface SatoruFujinuma {
                [...memories]
                [days in daysDiff]
                [value in stories]?
                age: 10 | 29
                job: 'Mangaka'
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
              interface SatoruFujinuma {
                [days in daysDiff]
                age: 10 | 29
                [...memories]
                job: 'Mangaka'
                [value in stories]?
              }
            `,
            output: dedent`
              interface SatoruFujinuma {
                [...memories]
                [days in daysDiff]
                [value in stories]?
                age: 10 | 29
                job: 'Mangaka'
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
                messageId: 'unexpectedInterfacePropertiesOrder',
                data: {
                  first: 'age',
                  second: '[...memories]',
                },
              },
              {
                messageId: 'unexpectedInterfacePropertiesOrder',
                data: {
                  first: 'job',
                  second: '[value in stories]',
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
              interface SpiritsAndSuchConsultation {
                /**
                 * Ekubo is a self-proclaimed upper-class evil spirit who has aligned himself with Mob after being defeated by him.
                 *
                 * Ekubo wants to be a god. Specifically, he wants to be worshipped by all humanity.
                 */
                spirit: 'Ekubo'
                /**
                 * Mob's mentor and boss in the Mob Psycho 100 series. He owns a business exorcising ghosts and is a self-proclaimed psychic.
                 */
                owner: 'Arataka Reigen'
                // He is an extremely powerful Esper who was formerly a part of the Super 5 of Claw. He now works at the agency alongside Reigen and Mob.
                esper: 'Katsuya Serizawa'
                /* He is the assistant and disciple of Arataka Reigen. He is also the newest member of the Body Improvement Club. */
                assistant: 'Shigeo Kageyama'
              }
            `,
            output: dedent`
              interface SpiritsAndSuchConsultation {
                /* He is the assistant and disciple of Arataka Reigen. He is also the newest member of the Body Improvement Club. */
                assistant: 'Shigeo Kageyama'
                // He is an extremely powerful Esper who was formerly a part of the Super 5 of Claw. He now works at the agency alongside Reigen and Mob.
                esper: 'Katsuya Serizawa'
                /**
                 * Mob's mentor and boss in the Mob Psycho 100 series. He owns a business exorcising ghosts and is a self-proclaimed psychic.
                 */
                owner: 'Arataka Reigen'
                /**
                 * Ekubo is a self-proclaimed upper-class evil spirit who has aligned himself with Mob after being defeated by him.
                 *
                 * Ekubo wants to be a god. Specifically, he wants to be worshipped by all humanity.
                 */
                spirit: 'Ekubo'
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
                messageId: 'unexpectedInterfacePropertiesOrder',
                data: {
                  first: 'spirit',
                  second: 'owner',
                },
              },
              {
                messageId: 'unexpectedInterfacePropertiesOrder',
                data: {
                  first: 'owner',
                  second: 'esper',
                },
              },
              {
                messageId: 'unexpectedInterfacePropertiesOrder',
                data: {
                  first: 'esper',
                  second: 'assistant',
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

    it(`${RULE_NAME}(${type}): sorts interface properties`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [
          {
            code: dedent`
              interface DossierByTwilight {
                age: string
                country: 'Westalis' | 'Ostania',
                name: string
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
              interface DossierByTwilight {
                name: string
                age: string
                country: 'Westalis' | 'Ostania',
              }
            `,
            output: dedent`
              interface DossierByTwilight {
                age: string
                country: 'Westalis' | 'Ostania',
                name: string
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
                messageId: 'unexpectedInterfacePropertiesOrder',
                data: {
                  first: 'name',
                  second: 'age',
                },
              },
            ],
          },
        ],
      })
    })

    it(`${RULE_NAME}(${type}): works with ts index signature`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [
          {
            code: dedent`
              interface JujutsuHigh {
                [key in Sorcerer]: string
                yuuji: 'Yuuji Itadori'
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
              interface JujutsuHigh {
                yuuji: 'Yuuji Itadori'
                [key in Sorcerer]: string
              }
            `,
            output: dedent`
              interface JujutsuHigh {
                [key in Sorcerer]: string
                yuuji: 'Yuuji Itadori'
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
                messageId: 'unexpectedInterfacePropertiesOrder',
                data: {
                  first: 'yuuji',
                  second: '[key in Sorcerer]',
                },
              },
            ],
          },
        ],
      })
    })

    it(`${RULE_NAME}(${type}): sorts multi-word keys by value`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [
          {
            code: dedent`
              interface CowboyBebop {
                ein: Dog
                'faye-valentine': Hunter
                jet: Hunter
                'spike-spiegel': Hunter
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
              interface CowboyBebop {
                'spike-spiegel': Hunter
                ein: Dog
                jet: Hunter
                'faye-valentine': Hunter
              }
            `,
            output: dedent`
              interface CowboyBebop {
                ein: Dog
                'faye-valentine': Hunter
                jet: Hunter
                'spike-spiegel': Hunter
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
                messageId: 'unexpectedInterfacePropertiesOrder',
                data: {
                  first: 'spike-spiegel',
                  second: 'ein',
                },
              },
              {
                messageId: 'unexpectedInterfacePropertiesOrder',
                data: {
                  first: 'jet',
                  second: 'faye-valentine',
                },
              },
            ],
          },
        ],
      })
    })

    it(`${RULE_NAME}(${type}): works with typescript index signature`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [
          {
            code: dedent`
              interface Evangelion {
                [key: string]: string
                'evangelion-owner': string
                name: string
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
              interface Evangelion {
                'evangelion-owner': string
                [key: string]: string
                name: string
              }
            `,
            output: dedent`
              interface Evangelion {
                [key: string]: string
                'evangelion-owner': string
                name: string
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
                messageId: 'unexpectedInterfacePropertiesOrder',
                data: {
                  first: 'evangelion-owner',
                  second: '[key: string]',
                },
              },
            ],
          },
        ],
      })
    })

    it(`${RULE_NAME}(${type}): works with method and construct signatures`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [
          {
            code: dedent`
              interface Zenitsu {
                age: number
                airSpin: () => void
                godspeed(): number
                name: string
                sixfold()
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
              interface Zenitsu {
                age: number
                godspeed(): number
                airSpin: () => void
                sixfold()
                name: string
              }
            `,
            output: dedent`
              interface Zenitsu {
                age: number
                airSpin: () => void
                godspeed(): number
                name: string
                sixfold()
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
                messageId: 'unexpectedInterfacePropertiesOrder',
                data: {
                  first: 'godspeed()',
                  second: 'airSpin',
                },
              },
              {
                messageId: 'unexpectedInterfacePropertiesOrder',
                data: {
                  first: 'sixfold()',
                  second: 'name',
                },
              },
            ],
          },
        ],
      })
    })

    it(`${RULE_NAME}(${type}): works with empty properties with empty values`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [
          {
            code: dedent`
              interface SatoruFujinuma {
                [...memories]
                [days in daysDiff]
                [value in stories]?
                age: 10 | 29
                job: 'Mangaka'
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
              interface SatoruFujinuma {
                [days in daysDiff]
                age: 10 | 29
                [...memories]
                job: 'Mangaka'
                [value in stories]?
              }
            `,
            output: dedent`
              interface SatoruFujinuma {
                [...memories]
                [days in daysDiff]
                [value in stories]?
                age: 10 | 29
                job: 'Mangaka'
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
                messageId: 'unexpectedInterfacePropertiesOrder',
                data: {
                  first: 'age',
                  second: '[...memories]',
                },
              },
              {
                messageId: 'unexpectedInterfacePropertiesOrder',
                data: {
                  first: 'job',
                  second: '[value in stories]',
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
              interface SpiritsAndSuchConsultation {
                /**
                 * Ekubo is a self-proclaimed upper-class evil spirit who has aligned himself with Mob after being defeated by him.
                 *
                 * Ekubo wants to be a god. Specifically, he wants to be worshipped by all humanity.
                 */
                spirit: 'Ekubo'
                /**
                 * Mob's mentor and boss in the Mob Psycho 100 series. He owns a business exorcising ghosts and is a self-proclaimed psychic.
                 */
                owner: 'Arataka Reigen'
                // He is an extremely powerful Esper who was formerly a part of the Super 5 of Claw. He now works at the agency alongside Reigen and Mob.
                esper: 'Katsuya Serizawa'
                /* He is the assistant and disciple of Arataka Reigen. He is also the newest member of the Body Improvement Club. */
                assistant: 'Shigeo Kageyama'
              }
            `,
            output: dedent`
              interface SpiritsAndSuchConsultation {
                /* He is the assistant and disciple of Arataka Reigen. He is also the newest member of the Body Improvement Club. */
                assistant: 'Shigeo Kageyama'
                // He is an extremely powerful Esper who was formerly a part of the Super 5 of Claw. He now works at the agency alongside Reigen and Mob.
                esper: 'Katsuya Serizawa'
                /**
                 * Mob's mentor and boss in the Mob Psycho 100 series. He owns a business exorcising ghosts and is a self-proclaimed psychic.
                 */
                owner: 'Arataka Reigen'
                /**
                 * Ekubo is a self-proclaimed upper-class evil spirit who has aligned himself with Mob after being defeated by him.
                 *
                 * Ekubo wants to be a god. Specifically, he wants to be worshipped by all humanity.
                 */
                spirit: 'Ekubo'
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
                messageId: 'unexpectedInterfacePropertiesOrder',
                data: {
                  first: 'spirit',
                  second: 'owner',
                },
              },
              {
                messageId: 'unexpectedInterfacePropertiesOrder',
                data: {
                  first: 'owner',
                  second: 'esper',
                },
              },
              {
                messageId: 'unexpectedInterfacePropertiesOrder',
                data: {
                  first: 'esper',
                  second: 'assistant',
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

    it(`${RULE_NAME}(${type}): sorts interface properties`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [
          {
            code: dedent`
              interface DossierByTwilight {
                country: 'Westalis' | 'Ostania'
                name: string
                age: string
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
              interface DossierByTwilight {
                name: string
                age: string
                country: 'Westalis' | 'Ostania'
              }
            `,
            output: dedent`
              interface DossierByTwilight {
                country: 'Westalis' | 'Ostania'
                name: string
                age: string
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
                messageId: 'unexpectedInterfacePropertiesOrder',
                data: {
                  first: 'age',
                  second: 'country',
                },
              },
            ],
          },
        ],
      })
    })

    it(`${RULE_NAME}(${type}): takes into account the presence of an optional operator`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [
          {
            code: dedent`
              interface TotoroMessage {
                color: 'purple' | 'blue' | 'green'
                align: 'left' | 'center' | 'right'
              }
            `,
            options: [
              {
                type: SortType['line-length'],
                order: SortOrder.desc,
              },
            ],
          },
          {
            code: dedent`
              interface TotoroMessage {
                align: 'left' | 'center' | 'right'
                color: 'purple' | 'blue' | 'green'
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
              interface TotoroMessage {
                color: 'purple' | 'blue' | 'green'
                align?: 'left' | 'center' | 'right'
              }
            `,
            output: dedent`
              interface TotoroMessage {
                align?: 'left' | 'center' | 'right'
                color: 'purple' | 'blue' | 'green'
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
                messageId: 'unexpectedInterfacePropertiesOrder',
                data: {
                  first: 'color',
                  second: 'align',
                },
              },
            ],
          },
        ],
      })
    })

    it(`${RULE_NAME}(${type}): works with ts index signature`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [
          {
            code: dedent`
              interface JujutsuHigh {
                [key in Sorcerer]: string
                yuuji: 'Yuuji Itadori'
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
              interface JujutsuHigh {
                yuuji: 'Yuuji Itadori'
                [key in Sorcerer]: string
              }
            `,
            output: dedent`
              interface JujutsuHigh {
                [key in Sorcerer]: string
                yuuji: 'Yuuji Itadori'
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
                messageId: 'unexpectedInterfacePropertiesOrder',
                data: {
                  first: 'yuuji',
                  second: '[key in Sorcerer]',
                },
              },
            ],
          },
        ],
      })
    })

    it(`${RULE_NAME}(${type}): works with method and construct signatures`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [
          {
            code: dedent`
              interface Zenitsu {
                airSpin: () => void
                godspeed(): number
                sixfold(): void
                name: string
                age: number
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
              interface Zenitsu {
                age: number
                godspeed(): number
                airSpin: () => void
                sixfold(): void
                name: string
              }
            `,
            output: dedent`
              interface Zenitsu {
                airSpin: () => void
                godspeed(): number
                sixfold(): void
                name: string
                age: number
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
                messageId: 'unexpectedInterfacePropertiesOrder',
                data: {
                  first: 'age',
                  second: 'godspeed()',
                },
              },
              {
                messageId: 'unexpectedInterfacePropertiesOrder',
                data: {
                  first: 'godspeed()',
                  second: 'airSpin',
                },
              },
            ],
          },
        ],
      })
    })

    it(`${RULE_NAME}(${type}): works with empty properties with empty values`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [
          {
            code: dedent`
              interface SatoruFujinuma {
                [value in stories]?
                [days in daysDiff]
                job: 'Mangaka'
                [...memories]
                age: 10 | 29
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
              interface SatoruFujinuma {
                [days in daysDiff]
                [value in stories]?
                [...memories]
                job: 'Mangaka'
                age: 10 | 29
              }
            `,
            output: dedent`
              interface SatoruFujinuma {
                [value in stories]?
                [days in daysDiff]
                job: 'Mangaka'
                [...memories]
                age: 10 | 29
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
                messageId: 'unexpectedInterfacePropertiesOrder',
                data: {
                  first: '[days in daysDiff]',
                  second: '[value in stories]',
                },
              },
              {
                messageId: 'unexpectedInterfacePropertiesOrder',
                data: {
                  first: '[...memories]',
                  second: 'job',
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
              interface SpiritsAndSuchConsultation {
                /**
                 * Ekubo is a self-proclaimed upper-class evil spirit who has aligned himself with Mob after being defeated by him.
                 *
                 * Ekubo wants to be a god. Specifically, he wants to be worshipped by all humanity.
                 */
                spirit: 'Ekubo'
                /**
                 * Mob's mentor and boss in the Mob Psycho 100 series. He owns a business exorcising ghosts and is a self-proclaimed psychic.
                 */
                owner: 'Arataka Reigen'
                // He is an extremely powerful Esper who was formerly a part of the Super 5 of Claw. He now works at the agency alongside Reigen and Mob.
                esper: 'Katsuya Serizawa'
                /* He is the assistant and disciple of Arataka Reigen. He is also the newest member of the Body Improvement Club. */
                assistant: 'Shigeo Kageyama'
              }
            `,
            output: dedent`
              interface SpiritsAndSuchConsultation {
                /* He is the assistant and disciple of Arataka Reigen. He is also the newest member of the Body Improvement Club. */
                assistant: 'Shigeo Kageyama'
                // He is an extremely powerful Esper who was formerly a part of the Super 5 of Claw. He now works at the agency alongside Reigen and Mob.
                esper: 'Katsuya Serizawa'
                /**
                 * Mob's mentor and boss in the Mob Psycho 100 series. He owns a business exorcising ghosts and is a self-proclaimed psychic.
                 */
                owner: 'Arataka Reigen'
                /**
                 * Ekubo is a self-proclaimed upper-class evil spirit who has aligned himself with Mob after being defeated by him.
                 *
                 * Ekubo wants to be a god. Specifically, he wants to be worshipped by all humanity.
                 */
                spirit: 'Ekubo'
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
                messageId: 'unexpectedInterfacePropertiesOrder',
                data: {
                  first: 'spirit',
                  second: 'owner',
                },
              },
              {
                messageId: 'unexpectedInterfacePropertiesOrder',
                data: {
                  first: 'owner',
                  second: 'esper',
                },
              },
              {
                messageId: 'unexpectedInterfacePropertiesOrder',
                data: {
                  first: 'esper',
                  second: 'assistant',
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
              interface DeathNoteValue {
                causeOfDeath: string
                name: string
              }
            `,
        ],
        invalid: [
          {
            code: dedent`
              interface DeathNoteValue {
                name: string
                causeOfDeath: string
              }
            `,
            output: dedent`
              interface DeathNoteValue {
                causeOfDeath: string
                name: string
              }
            `,
            errors: [
              {
                messageId: 'unexpectedInterfacePropertiesOrder',
                data: {
                  first: 'name',
                  second: 'causeOfDeath',
                },
              },
            ],
          },
        ],
      })
    })
  })
})
