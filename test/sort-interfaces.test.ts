import { ESLintUtils } from '@typescript-eslint/utils'
import { describe, it } from 'vitest'
import { dedent } from 'ts-dedent'

import rule, { RULE_NAME } from '../rules/sort-interfaces'
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
            options: [options],
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
                age: string
                country: 'Westalis' | 'Ostania'
                name: string
              }
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedInterfacePropertiesOrder',
                data: {
                  left: 'name',
                  right: 'age',
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
            options: [options],
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
            options: [options],
            errors: [
              {
                messageId: 'unexpectedInterfacePropertiesOrder',
                data: {
                  left: 'yuuji',
                  right: '[key in Sorcerer]',
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
            options: [options],
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
            options: [options],
            errors: [
              {
                messageId: 'unexpectedInterfacePropertiesOrder',
                data: {
                  left: 'spike-spiegel',
                  right: 'ein',
                },
              },
              {
                messageId: 'unexpectedInterfacePropertiesOrder',
                data: {
                  left: 'jet',
                  right: 'faye-valentine',
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
            options: [options],
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
            options: [options],
            errors: [
              {
                messageId: 'unexpectedInterfacePropertiesOrder',
                data: {
                  left: 'evangelion-owner',
                  right: '[key: string]',
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
            options: [options],
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
            options: [options],
            errors: [
              {
                messageId: 'unexpectedInterfacePropertiesOrder',
                data: {
                  left: 'godspeed()',
                  right: 'airSpin',
                },
              },
              {
                messageId: 'unexpectedInterfacePropertiesOrder',
                data: {
                  left: 'sixfold()',
                  right: 'name',
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
            options: [options],
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
            options: [options],
            errors: [
              {
                messageId: 'unexpectedInterfacePropertiesOrder',
                data: {
                  left: 'age',
                  right: '[...memories]',
                },
              },
              {
                messageId: 'unexpectedInterfacePropertiesOrder',
                data: {
                  left: 'job',
                  right: '[value in stories]',
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
            options: [options],
            errors: [
              {
                messageId: 'unexpectedInterfacePropertiesOrder',
                data: {
                  left: 'spirit',
                  right: 'owner',
                },
              },
              {
                messageId: 'unexpectedInterfacePropertiesOrder',
                data: {
                  left: 'owner',
                  right: 'esper',
                },
              },
              {
                messageId: 'unexpectedInterfacePropertiesOrder',
                data: {
                  left: 'esper',
                  right: 'assistant',
                },
              },
            ],
          },
        ],
      })
    })

    it(`${RULE_NAME}(${type}): sorts interfaces with comments on the same line`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [],
        invalid: [
          {
            code: dedent`
              interface NHK {
                rescuer: 'Misaki Nakahara' // Misaki is a mysterious girl who decides to help Tatsuhiro Satou escape his hikikomori lifestyle
                hikikomori: 'Tatsuhiro Satou' // Satou Tatsuhiro is a 22 year old, socially withdrawn, parasitic hikikomori
              }
            `,
            output: dedent`
              interface NHK {
                hikikomori: 'Tatsuhiro Satou' // Satou Tatsuhiro is a 22 year old, socially withdrawn, parasitic hikikomori
                rescuer: 'Misaki Nakahara' // Misaki is a mysterious girl who decides to help Tatsuhiro Satou escape his hikikomori lifestyle
              }
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedInterfacePropertiesOrder',
                data: {
                  left: 'rescuer',
                  right: 'hikikomori',
                },
              },
            ],
          },
        ],
      })
    })

    it(`${RULE_NAME}(${type}): sorts interfaces with semi and comments on the same line`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [],
        invalid: [
          {
            code: dedent`
              interface Researcher {
                rescuer: 'Tokita Kōsaku'; // Character
                occupation: string; // Professional direction
              }
            `,
            output: dedent`
              interface Researcher {
                occupation: string; // Professional direction
                rescuer: 'Tokita Kōsaku'; // Character
              }
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedInterfacePropertiesOrder',
                data: {
                  left: 'rescuer',
                  right: 'occupation',
                },
              },
            ],
          },
        ],
      })
    })

    it(`${RULE_NAME}(${type}): not sorts call signature declarations`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [
          {
            code: dedent`
              interface Abilities {
                <Parameters extends Record<string, number | string>>(
                  input: AbilityFunction<[Parameters], string>
                ): Alternatives<Parameters>
                <Ability extends CountAbility>(input: Input): AbilityFunction<
                  [number],
                  Ability[keyof Ability]
                >
              }
            `,
            options: [options],
          },
        ],
        invalid: [],
      })
    })

    it(`${RULE_NAME}(${type}): allows to set groups for sorting`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [
          {
            code: dedent`
              interface DemonSlayer {
                id: string
                style: {
                  'combat-style': string
                  rank: number
                }
                age: number
                gender: 'male' | 'female'
                onAttack: (enemyId: string) => void
              }
            `,
            options: [
              {
                ...options,
                groups: ['id', 'multiline', 'unknown'],
                'custom-groups': {
                  id: 'id',
                },
              },
            ],
          },
        ],
        invalid: [
          {
            code: dedent`
              interface DemonSlayer {
                age: number
                onAttack: (enemyId: string) => void
                style: {
                  'combat-style': string
                  rank: number
                }
                id: string
                gender: 'male' | 'female'
              }
            `,
            output: dedent`
              interface DemonSlayer {
                id: string
                style: {
                  'combat-style': string
                  rank: number
                }
                age: number
                gender: 'male' | 'female'
                onAttack: (enemyId: string) => void
              }
            `,
            options: [
              {
                ...options,
                groups: ['id', 'multiline', 'unknown'],
                'custom-groups': {
                  id: 'id',
                },
              },
            ],
            errors: [
              {
                messageId: 'unexpectedInterfacePropertiesOrder',
                data: {
                  left: 'onAttack',
                  right: 'style',
                },
              },
              {
                messageId: 'unexpectedInterfacePropertiesOrder',
                data: {
                  left: 'style',
                  right: 'id',
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

    it(`${RULE_NAME}(${type}): sorts interface properties`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [
          {
            code: dedent`
              interface DossierByTwilight {
                age: string
                country: 'Westalis' | 'Ostania'
                name: string
              }
            `,
            options: [options],
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
                age: string
                country: 'Westalis' | 'Ostania'
                name: string
              }
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedInterfacePropertiesOrder',
                data: {
                  left: 'name',
                  right: 'age',
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
            options: [options],
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
            options: [options],
            errors: [
              {
                messageId: 'unexpectedInterfacePropertiesOrder',
                data: {
                  left: 'yuuji',
                  right: '[key in Sorcerer]',
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
            options: [options],
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
            options: [options],
            errors: [
              {
                messageId: 'unexpectedInterfacePropertiesOrder',
                data: {
                  left: 'spike-spiegel',
                  right: 'ein',
                },
              },
              {
                messageId: 'unexpectedInterfacePropertiesOrder',
                data: {
                  left: 'jet',
                  right: 'faye-valentine',
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
            options: [options],
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
            options: [options],
            errors: [
              {
                messageId: 'unexpectedInterfacePropertiesOrder',
                data: {
                  left: 'evangelion-owner',
                  right: '[key: string]',
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
            options: [options],
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
            options: [options],
            errors: [
              {
                messageId: 'unexpectedInterfacePropertiesOrder',
                data: {
                  left: 'godspeed()',
                  right: 'airSpin',
                },
              },
              {
                messageId: 'unexpectedInterfacePropertiesOrder',
                data: {
                  left: 'sixfold()',
                  right: 'name',
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
            options: [options],
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
            options: [options],
            errors: [
              {
                messageId: 'unexpectedInterfacePropertiesOrder',
                data: {
                  left: 'age',
                  right: '[...memories]',
                },
              },
              {
                messageId: 'unexpectedInterfacePropertiesOrder',
                data: {
                  left: 'job',
                  right: '[value in stories]',
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
            options: [options],
            errors: [
              {
                messageId: 'unexpectedInterfacePropertiesOrder',
                data: {
                  left: 'spirit',
                  right: 'owner',
                },
              },
              {
                messageId: 'unexpectedInterfacePropertiesOrder',
                data: {
                  left: 'owner',
                  right: 'esper',
                },
              },
              {
                messageId: 'unexpectedInterfacePropertiesOrder',
                data: {
                  left: 'esper',
                  right: 'assistant',
                },
              },
            ],
          },
        ],
      })
    })

    it(`${RULE_NAME}(${type}): sorts interfaces with comments on the same line`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [],
        invalid: [
          {
            code: dedent`
              interface NHK {
                rescuer: 'Misaki Nakahara' // Misaki is a mysterious girl who decides to help Tatsuhiro Satou escape his hikikomori lifestyle
                hikikomori: 'Tatsuhiro Satou' // Satou Tatsuhiro is a 22 year old, socially withdrawn, parasitic hikikomori
              }
            `,
            output: dedent`
              interface NHK {
                hikikomori: 'Tatsuhiro Satou' // Satou Tatsuhiro is a 22 year old, socially withdrawn, parasitic hikikomori
                rescuer: 'Misaki Nakahara' // Misaki is a mysterious girl who decides to help Tatsuhiro Satou escape his hikikomori lifestyle
              }
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedInterfacePropertiesOrder',
                data: {
                  left: 'rescuer',
                  right: 'hikikomori',
                },
              },
            ],
          },
        ],
      })
    })

    it(`${RULE_NAME}(${type}): sorts interfaces with semi and comments on the same line`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [],
        invalid: [
          {
            code: dedent`
              interface Researcher {
                rescuer: 'Tokita Kōsaku'; // Character
                occupation: string; // Professional direction
              }
            `,
            output: dedent`
              interface Researcher {
                occupation: string; // Professional direction
                rescuer: 'Tokita Kōsaku'; // Character
              }
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedInterfacePropertiesOrder',
                data: {
                  left: 'rescuer',
                  right: 'occupation',
                },
              },
            ],
          },
        ],
      })
    })

    it(`${RULE_NAME}(${type}): not sorts call signature declarations`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [
          {
            code: dedent`
              interface Abilities {
                <Parameters extends Record<string, number | string>>(
                  input: AbilityFunction<[Parameters], string>
                ): Alternatives<Parameters>
                <Ability extends CountAbility>(input: Input): AbilityFunction<
                  [number],
                  Ability[keyof Ability]
                >
              }
            `,
            options: [options],
          },
        ],
        invalid: [],
      })
    })

    it(`${RULE_NAME}(${type}): allows to set groups for sorting`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [
          {
            code: dedent`
              interface DemonSlayer {
                id: string
                style: {
                  'combat-style': string
                  rank: number
                }
                age: number
                gender: 'male' | 'female'
                onAttack: (enemyId: string) => void
              }
            `,
            options: [
              {
                ...options,
                groups: ['id', 'multiline', 'unknown'],
                'custom-groups': {
                  id: 'id',
                },
              },
            ],
          },
        ],
        invalid: [
          {
            code: dedent`
              interface DemonSlayer {
                age: number
                onAttack: (enemyId: string) => void
                style: {
                  'combat-style': string
                  rank: number
                }
                id: string
                gender: 'male' | 'female'
              }
            `,
            output: dedent`
              interface DemonSlayer {
                id: string
                style: {
                  'combat-style': string
                  rank: number
                }
                age: number
                gender: 'male' | 'female'
                onAttack: (enemyId: string) => void
              }
            `,
            options: [
              {
                ...options,
                groups: ['id', 'multiline', 'unknown'],
                'custom-groups': {
                  id: 'id',
                },
              },
            ],
            errors: [
              {
                messageId: 'unexpectedInterfacePropertiesOrder',
                data: {
                  left: 'onAttack',
                  right: 'style',
                },
              },
              {
                messageId: 'unexpectedInterfacePropertiesOrder',
                data: {
                  left: 'style',
                  right: 'id',
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
            options: [options],
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
            options: [options],
            errors: [
              {
                messageId: 'unexpectedInterfacePropertiesOrder',
                data: {
                  left: 'age',
                  right: 'country',
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
            options: [options],
          },
          {
            code: dedent`
              interface TotoroMessage {
                align: 'left' | 'center' | 'right'
                color: 'purple' | 'blue' | 'green'
              }
            `,
            options: [options],
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
            options: [options],
            errors: [
              {
                messageId: 'unexpectedInterfacePropertiesOrder',
                data: {
                  left: 'color',
                  right: 'align',
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
            options: [options],
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
            options: [options],
            errors: [
              {
                messageId: 'unexpectedInterfacePropertiesOrder',
                data: {
                  left: 'yuuji',
                  right: '[key in Sorcerer]',
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
            options: [options],
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
            options: [options],
            errors: [
              {
                messageId: 'unexpectedInterfacePropertiesOrder',
                data: {
                  left: 'age',
                  right: 'godspeed()',
                },
              },
              {
                messageId: 'unexpectedInterfacePropertiesOrder',
                data: {
                  left: 'godspeed()',
                  right: 'airSpin',
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
            options: [options],
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
            options: [options],
            errors: [
              {
                messageId: 'unexpectedInterfacePropertiesOrder',
                data: {
                  left: '[days in daysDiff]',
                  right: '[value in stories]',
                },
              },
              {
                messageId: 'unexpectedInterfacePropertiesOrder',
                data: {
                  left: '[...memories]',
                  right: 'job',
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
            options: [options],
            errors: [
              {
                messageId: 'unexpectedInterfacePropertiesOrder',
                data: {
                  left: 'spirit',
                  right: 'owner',
                },
              },
              {
                messageId: 'unexpectedInterfacePropertiesOrder',
                data: {
                  left: 'owner',
                  right: 'esper',
                },
              },
              {
                messageId: 'unexpectedInterfacePropertiesOrder',
                data: {
                  left: 'esper',
                  right: 'assistant',
                },
              },
            ],
          },
        ],
      })
    })

    it(`${RULE_NAME}(${type}): sorts interfaces with comments on the same line`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [],
        invalid: [
          {
            code: dedent`
              interface NHK {
                rescuer: 'Misaki Nakahara' // Misaki is a mysterious girl who decides to help Tatsuhiro Satou escape his hikikomori lifestyle
                hikikomori: 'Tatsuhiro Satou' // Satou Tatsuhiro is a 22 year old, socially withdrawn, parasitic hikikomori
              }
            `,
            output: dedent`
              interface NHK {
                hikikomori: 'Tatsuhiro Satou' // Satou Tatsuhiro is a 22 year old, socially withdrawn, parasitic hikikomori
                rescuer: 'Misaki Nakahara' // Misaki is a mysterious girl who decides to help Tatsuhiro Satou escape his hikikomori lifestyle
              }
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedInterfacePropertiesOrder',
                data: {
                  left: 'rescuer',
                  right: 'hikikomori',
                },
              },
            ],
          },
        ],
      })
    })

    it(`${RULE_NAME}(${type}): sorts interfaces with semi and comments on the same line`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [],
        invalid: [
          {
            code: dedent`
              interface Researcher {
                occupation: string; // Professional direction
                rescuer: 'Tokita Kōsaku'; // Character
              }
            `,
            output: dedent`
              interface Researcher {
                rescuer: 'Tokita Kōsaku'; // Character
                occupation: string; // Professional direction
              }
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedInterfacePropertiesOrder',
                data: {
                  left: 'occupation',
                  right: 'rescuer',
                },
              },
            ],
          },
        ],
      })
    })

    it(`${RULE_NAME}(${type}): not sorts call signature declarations`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [
          {
            code: dedent`
              interface Abilities {
                <Parameters extends Record<string, number | string>>(
                  input: AbilityFunction<[Parameters], string>
                ): Alternatives<Parameters>
                <Ability extends CountAbility>(input: Input): AbilityFunction<
                  [number],
                  Ability[keyof Ability]
                >
              }
            `,
            options: [options],
          },
        ],
        invalid: [],
      })
    })

    it(`${RULE_NAME}(${type}): allows to set groups for sorting`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [
          {
            code: dedent`
              interface DemonSlayer {
                id: string
                style: {
                  'combat-style': string
                  rank: number
                }
                onAttack: (enemyId: string) => void
                gender: 'male' | 'female'
                age: number
              }
            `,
            options: [
              {
                ...options,
                groups: ['id', 'multiline', 'unknown'],
                'custom-groups': {
                  id: 'id',
                },
              },
            ],
          },
        ],
        invalid: [
          {
            code: dedent`
              interface DemonSlayer {
                age: number
                onAttack: (enemyId: string) => void
                style: {
                  'combat-style': string
                  rank: number
                }
                id: string
                gender: 'male' | 'female'
              }
            `,
            output: dedent`
              interface DemonSlayer {
                id: string
                style: {
                  'combat-style': string
                  rank: number
                }
                onAttack: (enemyId: string) => void
                gender: 'male' | 'female'
                age: number
              }
            `,
            options: [
              {
                ...options,
                groups: ['id', 'multiline', 'unknown'],
                'custom-groups': {
                  id: 'id',
                },
              },
            ],
            errors: [
              {
                messageId: 'unexpectedInterfacePropertiesOrder',
                data: {
                  left: 'age',
                  right: 'onAttack',
                },
              },
              {
                messageId: 'unexpectedInterfacePropertiesOrder',
                data: {
                  left: 'onAttack',
                  right: 'style',
                },
              },
              {
                messageId: 'unexpectedInterfacePropertiesOrder',
                data: {
                  left: 'style',
                  right: 'id',
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
          {
            code: dedent`
              interface Calculator {
                log: (x: number) => number,
                log10: (x: number) => number,
                log1p: (x: number) => number,
                log2: (x: number) => number,
              }
            `,
            options: [{}],
          },
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
                  left: 'name',
                  right: 'causeOfDeath',
                },
              },
            ],
          },
        ],
      })
    })

    it(`${RULE_NAME}: allows to ignore interfaces`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [
          {
            code: dedent`
              interface UiDiclonius {
                name: 'Lucy' | 'Nyu'
                type: 'diclonius'
              }
            `,
            options: [
              {
                type: SortType['line-length'],
                order: SortOrder.desc,
                'ignore-pattern': ['Ui*'],
              },
            ],
          },
          {
            code: dedent`
              interface UiDiclonius {
                type: 'diclonius'
                name: 'Lucy' | 'Nyu'
              }
            `,
            options: [
              {
                type: SortType['line-length'],
                order: SortOrder.desc,
                'ignore-pattern': ['Ui*'],
              },
            ],
          },
        ],
        invalid: [],
      })
    })
  })
})
