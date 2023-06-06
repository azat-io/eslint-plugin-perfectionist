import { ESLintUtils } from '@typescript-eslint/utils'
import { describe, it } from 'vitest'
import { dedent } from 'ts-dedent'

import rule, { RULE_NAME } from '../rules/sort-classes'
import { SortType, SortOrder } from '../typings'

describe(RULE_NAME, () => {
  let ruleTester = new ESLintUtils.RuleTester({
    parser: '@typescript-eslint/parser',
  })

  describe(`${RULE_NAME}: sorting by alphabetical order`, () => {
    let type = 'alphabetical-order'

    it(`${RULE_NAME}(${type}): sorts class members`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [
          {
            code: dedent`
              class Mob {
                static name = 'Shigeo Kageyama'

                private beloved = 'Tsubomi Takane'

                alias = 'Psycho Helmet'

                placeOfWork = 'Spirits and Such Consultation Office'

                constructor(stressLevel) {
                  this.stressLevel = stressLevel
                }

                static greet() {
                  console.log(\`Ohayo! My name is \${this.name}\`)
                }

                private setStressLevel(value) {
                  this.stressLevel = value
                }

                decreaseStressLevel(level) {
                  this.setStressLevel(this.stressLevel - (level ?? 10))
                }

                increaseStressLevel(level) {
                  this.setStressLevel(this.stressLevel + (level ?? 10))
                }
              }
            `,
            options: [
              {
                type: SortType.alphabetical,
                order: SortOrder.asc,
                groups: [
                  'static-property',
                  'private-property',
                  'property',
                  'constructor',
                  'static-method',
                  'private-method',
                  'method',
                  'unknown',
                ],
              },
            ],
          },
        ],
        invalid: [
          {
            code: dedent`
              class Mob {
                static name = 'Shigeo Kageyama'

                private beloved = 'Tsubomi Takane'

                alias = 'Psycho Helmet'

                constructor(stressLevel) {
                  this.stressLevel = stressLevel
                }

                placeOfWork = 'Spirits and Such Consultation Office'

                decreaseStressLevel(level) {
                  this.setStressLevel(this.stressLevel - (level ?? 10))
                }

                static greet() {
                  console.log(\`Ohayo! My name is \${this.name}\`)
                }

                private setStressLevel(value) {
                  this.stressLevel = value
                }

                increaseStressLevel(level) {
                  this.setStressLevel(this.stressLevel + (level ?? 10))
                }
              }
            `,
            output: dedent`
              class Mob {
                static name = 'Shigeo Kageyama'

                private beloved = 'Tsubomi Takane'

                alias = 'Psycho Helmet'

                placeOfWork = 'Spirits and Such Consultation Office'

                constructor(stressLevel) {
                  this.stressLevel = stressLevel
                }

                static greet() {
                  console.log(\`Ohayo! My name is \${this.name}\`)
                }

                private setStressLevel(value) {
                  this.stressLevel = value
                }

                decreaseStressLevel(level) {
                  this.setStressLevel(this.stressLevel - (level ?? 10))
                }

                increaseStressLevel(level) {
                  this.setStressLevel(this.stressLevel + (level ?? 10))
                }
              }
            `,
            options: [
              {
                type: SortType.alphabetical,
                order: SortOrder.asc,
                groups: [
                  'static-property',
                  'private-property',
                  'property',
                  'constructor',
                  'static-method',
                  'private-method',
                  'method',
                  'unknown',
                ],
              },
            ],
            errors: [
              {
                messageId: 'unexpectedClassesOrder',
                data: {
                  left: 'constructor',
                  right: 'placeOfWork',
                },
              },
              {
                messageId: 'unexpectedClassesOrder',
                data: {
                  left: 'decreaseStressLevel',
                  right: 'greet',
                },
              },
            ],
          },
        ],
      })
    })

    it(`${RULE_NAME}(${type}): sorts class and group members`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [
          {
            code: dedent`
              class ParadisIsland {
                [key in Attractions]

                static status

                static territory = 'Eldia'

                static {
                  this.status = 'Destroyed'
                }
              }
            `,
            options: [
              {
                type: SortType.alphabetical,
                order: SortOrder.asc,
                groups: [
                  ['static-property', 'private-property', 'property'],
                  'constructor',
                  ['static-method', 'private-method', 'method'],
                  'unknown',
                ],
              },
            ],
          },
        ],
        invalid: [
          {
            code: dedent`
              class ParadisIsland {
                [key in Attractions]

                static territory = 'Eldia'

                static status

                static {
                  this.status = 'Destroyed'
                }
              }
            `,
            output: dedent`
              class ParadisIsland {
                [key in Attractions]

                static status

                static territory = 'Eldia'

                static {
                  this.status = 'Destroyed'
                }
              }
            `,
            options: [
              {
                type: SortType.alphabetical,
                order: SortOrder.asc,
                groups: [
                  ['static-property', 'private-property', 'property'],
                  'constructor',
                  ['static-method', 'private-method', 'method'],
                  'unknown',
                ],
              },
            ],
            errors: [
              {
                messageId: 'unexpectedClassesOrder',
                data: {
                  left: 'territory',
                  right: 'status',
                },
              },
            ],
          },
        ],
      })
    })

    it(`${RULE_NAME}(${type}): sorts class with ts index signatures`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [
          {
            code: dedent`
              class Another {
                static name = 'Mei Misaki';

                [k: string]: any;

                [k: string];
              }
            `,
            options: [
              {
                type: SortType.alphabetical,
                order: SortOrder.asc,
                groups: [
                  ['static-property', 'private-property', 'property'],
                  'constructor',
                ],
              },
            ],
          },
        ],
        invalid: [
          {
            code: dedent`
              class Another {
                [k: string]: any;

                [k: string];

                static name = 'Mei Misaki';
              }
            `,
            output: dedent`
              class Another {
                static name = 'Mei Misaki';

                [k: string]: any;

                [k: string];
              }
            `,
            options: [
              {
                type: SortType.alphabetical,
                order: SortOrder.asc,
                groups: [
                  ['static-property', 'private-property', 'property'],
                  'constructor',
                ],
              },
            ],
            errors: [
              {
                messageId: 'unexpectedClassesOrder',
                data: {
                  left: '[k: string];',
                  right: 'name',
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

    it(`${RULE_NAME}(${type}): sorts class members`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [
          {
            code: dedent`
              class Mob {
                static name = 'Shigeo Kageyama'

                private beloved = 'Tsubomi Takane'

                alias = 'Psycho Helmet'

                placeOfWork = 'Spirits and Such Consultation Office'

                constructor(stressLevel) {
                  this.stressLevel = stressLevel
                }

                static greet() {
                  console.log(\`Ohayo! My name is \${this.name}\`)
                }

                private setStressLevel(value) {
                  this.stressLevel = value
                }

                decreaseStressLevel(level) {
                  this.setStressLevel(this.stressLevel - (level ?? 10))
                }

                increaseStressLevel(level) {
                  this.setStressLevel(this.stressLevel + (level ?? 10))
                }
              }
            `,
            options: [
              {
                type: SortType.alphabetical,
                order: SortOrder.asc,
                groups: [
                  'static-property',
                  'private-property',
                  'property',
                  'constructor',
                  'static-method',
                  'private-method',
                  'method',
                  'unknown',
                ],
              },
            ],
          },
        ],
        invalid: [
          {
            code: dedent`
              class Mob {
                static name = 'Shigeo Kageyama'

                private beloved = 'Tsubomi Takane'

                alias = 'Psycho Helmet'

                constructor(stressLevel) {
                  this.stressLevel = stressLevel
                }

                placeOfWork = 'Spirits and Such Consultation Office'

                decreaseStressLevel(level) {
                  this.setStressLevel(this.stressLevel - (level ?? 10))
                }

                static greet() {
                  console.log(\`Ohayo! My name is \${this.name}\`)
                }

                private setStressLevel(value) {
                  this.stressLevel = value
                }

                increaseStressLevel(level) {
                  this.setStressLevel(this.stressLevel + (level ?? 10))
                }
              }
            `,
            output: dedent`
              class Mob {
                static name = 'Shigeo Kageyama'

                private beloved = 'Tsubomi Takane'

                alias = 'Psycho Helmet'

                placeOfWork = 'Spirits and Such Consultation Office'

                constructor(stressLevel) {
                  this.stressLevel = stressLevel
                }

                static greet() {
                  console.log(\`Ohayo! My name is \${this.name}\`)
                }

                private setStressLevel(value) {
                  this.stressLevel = value
                }

                decreaseStressLevel(level) {
                  this.setStressLevel(this.stressLevel - (level ?? 10))
                }

                increaseStressLevel(level) {
                  this.setStressLevel(this.stressLevel + (level ?? 10))
                }
              }
            `,
            options: [
              {
                type: SortType.alphabetical,
                order: SortOrder.asc,
                groups: [
                  'static-property',
                  'private-property',
                  'property',
                  'constructor',
                  'static-method',
                  'private-method',
                  'method',
                  'unknown',
                ],
              },
            ],
            errors: [
              {
                messageId: 'unexpectedClassesOrder',
                data: {
                  left: 'constructor',
                  right: 'placeOfWork',
                },
              },
              {
                messageId: 'unexpectedClassesOrder',
                data: {
                  left: 'decreaseStressLevel',
                  right: 'greet',
                },
              },
            ],
          },
        ],
      })
    })

    it(`${RULE_NAME}(${type}): sorts class and group members`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [
          {
            code: dedent`
              class ParadisIsland {
                [key in Attractions]

                static status

                static territory = 'Eldia'

                static {
                  this.status = 'Destroyed'
                }
              }
            `,
            options: [
              {
                type: SortType.natural,
                order: SortOrder.asc,
                groups: [
                  ['static-property', 'private-property', 'property'],
                  'constructor',
                  ['static-method', 'private-method', 'method'],
                  'unknown',
                ],
              },
            ],
          },
        ],
        invalid: [
          {
            code: dedent`
              class ParadisIsland {
                [key in Attractions]

                static territory = 'Eldia'

                static status

                static {
                  this.status = 'Destroyed'
                }
              }
            `,
            output: dedent`
              class ParadisIsland {
                [key in Attractions]

                static status

                static territory = 'Eldia'

                static {
                  this.status = 'Destroyed'
                }
              }
            `,
            options: [
              {
                type: SortType.natural,
                order: SortOrder.asc,
                groups: [
                  ['static-property', 'private-property', 'property'],
                  'constructor',
                  ['static-method', 'private-method', 'method'],
                  'unknown',
                ],
              },
            ],
            errors: [
              {
                messageId: 'unexpectedClassesOrder',
                data: {
                  left: 'territory',
                  right: 'status',
                },
              },
            ],
          },
        ],
      })
    })

    it(`${RULE_NAME}(${type}): sorts class with ts index signatures`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [
          {
            code: dedent`
              class Another {
                static name = 'Mei Misaki';

                [k: string]: any;

                [k: string];
              }
            `,
            options: [
              {
                type: SortType.natural,
                order: SortOrder.asc,
                groups: [
                  ['static-property', 'private-property', 'property'],
                  'constructor',
                ],
              },
            ],
          },
        ],
        invalid: [
          {
            code: dedent`
              class Another {
                [k: string]: any;

                [k: string];

                static name = 'Mei Misaki';
              }
            `,
            output: dedent`
              class Another {
                static name = 'Mei Misaki';

                [k: string]: any;

                [k: string];
              }
            `,
            options: [
              {
                type: SortType.natural,
                order: SortOrder.asc,
                groups: [
                  ['static-property', 'private-property', 'property'],
                  'constructor',
                ],
              },
            ],
            errors: [
              {
                messageId: 'unexpectedClassesOrder',
                data: {
                  left: '[k: string];',
                  right: 'name',
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

    it(`${RULE_NAME}(${type}): sorts class members`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [
          {
            code: dedent`
              class Mob {
                static name = 'Shigeo Kageyama'

                private beloved = 'Tsubomi Takane'

                placeOfWork = 'Spirits and Such Consultation Office'

                alias = 'Psycho Helmet'

                constructor(stressLevel) {
                  this.stressLevel = stressLevel
                }

                static greet() {
                  console.log(\`Ohayo! My name is \${this.name}\`)
                }

                private setStressLevel(value) {
                  this.stressLevel = value
                }

                decreaseStressLevel(level) {
                  this.setStressLevel(this.stressLevel - (level ?? 10))
                }

                increaseStressLevel(level) {
                  this.setStressLevel(this.stressLevel + (level ?? 10))
                }
              }
            `,
            options: [
              {
                type: SortType['line-length'],
                order: SortOrder.desc,
                groups: [
                  'static-property',
                  'private-property',
                  'property',
                  'constructor',
                  'static-method',
                  'private-method',
                  'method',
                  'unknown',
                ],
              },
            ],
          },
        ],
        invalid: [
          {
            code: dedent`
              class Mob {
                static name = 'Shigeo Kageyama'

                private beloved = 'Tsubomi Takane'

                alias = 'Psycho Helmet'

                constructor(stressLevel) {
                  this.stressLevel = stressLevel
                }

                placeOfWork = 'Spirits and Such Consultation Office'

                decreaseStressLevel(level) {
                  this.setStressLevel(this.stressLevel - (level ?? 10))
                }

                static greet() {
                  console.log(\`Ohayo! My name is \${this.name}\`)
                }

                private setStressLevel(value) {
                  this.stressLevel = value
                }

                increaseStressLevel(level) {
                  this.setStressLevel(this.stressLevel + (level ?? 10))
                }
              }
            `,
            output: dedent`
              class Mob {
                static name = 'Shigeo Kageyama'

                private beloved = 'Tsubomi Takane'

                placeOfWork = 'Spirits and Such Consultation Office'

                alias = 'Psycho Helmet'

                constructor(stressLevel) {
                  this.stressLevel = stressLevel
                }

                static greet() {
                  console.log(\`Ohayo! My name is \${this.name}\`)
                }

                private setStressLevel(value) {
                  this.stressLevel = value
                }

                increaseStressLevel(level) {
                  this.setStressLevel(this.stressLevel + (level ?? 10))
                }

                decreaseStressLevel(level) {
                  this.setStressLevel(this.stressLevel - (level ?? 10))
                }
              }
            `,
            options: [
              {
                type: SortType['line-length'],
                order: SortOrder.desc,
                groups: [
                  'static-property',
                  'private-property',
                  'property',
                  'constructor',
                  'static-method',
                  'private-method',
                  'method',
                  'unknown',
                ],
              },
            ],
            errors: [
              {
                messageId: 'unexpectedClassesOrder',
                data: {
                  left: 'constructor',
                  right: 'placeOfWork',
                },
              },
              {
                messageId: 'unexpectedClassesOrder',
                data: {
                  left: 'decreaseStressLevel',
                  right: 'greet',
                },
              },
            ],
          },
        ],
      })
    })

    it(`${RULE_NAME}(${type}): sorts class and group members`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [
          {
            code: dedent`
              class ParadisIsland {
                static territory = 'Eldia'

                [key in Attractions]

                static status

                static {
                  this.status = 'Destroyed'
                }
              }
            `,
            options: [
              {
                type: SortType['line-length'],
                order: SortOrder.desc,
                groups: [
                  ['static-property', 'private-property', 'property'],
                  'constructor',
                  ['static-method', 'private-method', 'method'],
                  'unknown',
                ],
              },
            ],
          },
        ],
        invalid: [
          {
            code: dedent`
              class ParadisIsland {
                [key in Attractions]

                static territory = 'Eldia'

                static status

                static {
                  this.status = 'Destroyed'
                }
              }
            `,
            output: dedent`
              class ParadisIsland {
                static territory = 'Eldia'

                [key in Attractions]

                static status

                static {
                  this.status = 'Destroyed'
                }
              }
            `,
            options: [
              {
                type: SortType['line-length'],
                order: SortOrder.desc,
                groups: [
                  ['static-property', 'private-property', 'property'],
                  'constructor',
                  ['static-method', 'private-method', 'method'],
                  'unknown',
                ],
              },
            ],
            errors: [
              {
                messageId: 'unexpectedClassesOrder',
                data: {
                  left: 'key in Attractions',
                  right: 'territory',
                },
              },
            ],
          },
        ],
      })
    })

    it(`${RULE_NAME}(${type}): sorts class with ts index signatures`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [
          {
            code: dedent`
              class Another {
                static name = 'Mei Misaki';

                [k: string]: any;

                [k: string];
              }
            `,
            options: [
              {
                type: SortType['line-length'],
                order: SortOrder.desc,
                groups: [
                  ['static-property', 'private-property', 'property'],
                  'constructor',
                ],
              },
            ],
          },
        ],
        invalid: [
          {
            code: dedent`
              class Another {
                [k: string]: any;

                [k: string];

                static name = 'Mei Misaki';
              }
            `,
            output: dedent`
              class Another {
                static name = 'Mei Misaki';

                [k: string]: any;

                [k: string];
              }
            `,
            options: [
              {
                type: SortType['line-length'],
                order: SortOrder.desc,
                groups: [
                  ['static-property', 'private-property', 'property'],
                  'constructor',
                ],
              },
            ],
            errors: [
              {
                messageId: 'unexpectedClassesOrder',
                data: {
                  left: '[k: string];',
                  right: 'name',
                },
              },
            ],
          },
        ],
      })
    })
  })
})
