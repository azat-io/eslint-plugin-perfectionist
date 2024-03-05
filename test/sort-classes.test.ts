import { RuleTester } from '@typescript-eslint/rule-tester'
import { afterAll, describe, it } from 'vitest'
import { dedent } from 'ts-dedent'

import rule, { RULE_NAME } from '../rules/sort-classes'
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

    ruleTester.run(`${RULE_NAME}(${type}): sorts class members`, rule, {
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
              ...options,
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
              ...options,
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

    ruleTester.run(
      `${RULE_NAME}(${type}): sorts class and group members`,
      rule,
      {
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
                ...options,
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
                ...options,
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
      },
    )

    ruleTester.run(
      `${RULE_NAME}(${type}): sorts class with ts index signatures`,
      rule,
      {
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
                ...options,
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
                ...options,
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
      },
    )

    ruleTester.run(
      `${RULE_NAME}(${type}): sorts class with ts index signatures`,
      rule,
      {
        valid: [
          {
            code: dedent`
              class Decorations {
                setBackground(color: number, hexFlag: boolean): this
                setBackground(color: Color | string | CSSColor): this
                setBackground(r: number, g: number, b: number, a?: number): this
                setBackground(color: ColorArgument, arg1?: boolean | number, arg2?: number, arg3?: number): this {
                    /* ... */
                }
              }
            `,
            options: [
              {
                ...options,
                groups: [
                  ['static-property', 'private-property', 'property'],
                  'constructor',
                ],
              },
            ],
          },
        ],
        invalid: [],
      },
    )

    ruleTester.run(
      `${RULE_NAME}(${type}): sorts private methods with hash`,
      rule,
      {
        valid: [],
        invalid: [
          {
            code: dedent`
              class MyUnsortedClass {
                someOtherProperty

                someProperty = 1

                constructor() {}

                static #aPrivateStaticMethod () {}

                #somePrivateProperty

                #someOtherPrivateProperty = 2

                static someStaticProperty = 3

                static #someStaticPrivateProperty = 4

                aInstanceMethod () {}

                static aStaticMethod () {}

                #aPrivateInstanceMethod () {}
              }
            `,
            output: dedent`
              class MyUnsortedClass {
                static someStaticProperty = 3

                #someOtherPrivateProperty = 2

                #somePrivateProperty

                static #someStaticPrivateProperty = 4

                someOtherProperty

                someProperty = 1

                constructor() {}

                aInstanceMethod () {}

                #aPrivateInstanceMethod () {}

                static #aPrivateStaticMethod () {}

                static aStaticMethod () {}
              }
            `,
            options: [
              {
                ...options,
                groups: [
                  'static-property',
                  'private-property',
                  'property',
                  'constructor',
                  'method',
                  'private-method',
                  'static-method',
                  'unknown',
                ],
              },
            ],
            errors: [
              {
                messageId: 'unexpectedClassesOrder',
                data: {
                  left: '#aPrivateStaticMethod',
                  right: '#somePrivateProperty',
                },
              },
              {
                messageId: 'unexpectedClassesOrder',
                data: {
                  left: '#somePrivateProperty',
                  right: '#someOtherPrivateProperty',
                },
              },
              {
                messageId: 'unexpectedClassesOrder',
                data: {
                  left: '#someOtherPrivateProperty',
                  right: 'someStaticProperty',
                },
              },
              {
                messageId: 'unexpectedClassesOrder',
                data: {
                  left: 'aStaticMethod',
                  right: '#aPrivateInstanceMethod',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(
      `${RULE_NAME}(${type}): allows split methods with getters and setters`,
      rule,
      {
        valid: [],
        invalid: [
          {
            code: dedent`
              class A {
                x() {}
                b() {}
                get z() {}
                get c() {}
                set c() {}
              }
            `,
            output: dedent`
              class A {
                b() {}
                x() {}
                get c() {}
                set c() {}
                get z() {}
              }
            `,
            options: [
              {
                ...options,
                groups: [
                  'index-signature',
                  'static-property',
                  'private-property',
                  'property',
                  'constructor',
                  'static-method',
                  'private-method',
                  'method',
                  ['get-method', 'set-method'],
                  'unknown',
                ],
              },
            ],
            errors: [
              {
                messageId: 'unexpectedClassesOrder',
                data: {
                  left: 'x',
                  right: 'b',
                },
              },
              {
                messageId: 'unexpectedClassesOrder',
                data: {
                  left: 'z',
                  right: 'c',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(`${RULE_NAME}(${type}): sorts decorated properties`, rule, {
      valid: [],
      invalid: [
        {
          code: dedent`
            class User {
              firstName: string

              id: number

              @Index({ name: 'born_index' })
              @Property()
              born: string

              @Property()
              @Unique()
              email: string

              lastName: string
            }`,
          output: dedent`
            class User {
              firstName: string

              id: number

              lastName: string

              @Index({ name: 'born_index' })
              @Property()
              born: string

              @Property()
              @Unique()
              email: string
            }`,
          options: [
            {
              ...options,
              groups: ['property', 'decorated-property', 'unknown'],
            },
          ],
          errors: [
            {
              messageId: 'unexpectedClassesOrder',
              data: {
                left: 'email',
                right: 'lastName',
              },
            },
          ],
        },
        {
          code: dedent`
            class MyElement {
              @property({ attribute: false })
              data = {}
            
              @property()
              greeting: string = 'Hello'
            
              @state()
              private _counter = 0
            
              private _message = ''
            
              private _prop = 0
            
              constructor() {}
            
              @property()
              get message(): string {
                return this._message
              }
            
              set message(message: string) {
                this._message = message
              }
            
              @property()
              set prop(val: number) {
                this._prop = Math.floor(val)
              }
            
              get prop() {
                return this._prop
              }
            
              render() {}
            }`,
          output: dedent`
            class MyElement {
              @property({ attribute: false })
              data = {}
            
              @property()
              greeting: string = 'Hello'
            
              @state()
              private _counter = 0
            
              private _message = ''
            
              private _prop = 0
            
              constructor() {}
            
              @property()
              get message(): string {
                return this._message
              }
            
              @property()
              set prop(val: number) {
                this._prop = Math.floor(val)
              }
            
              set message(message: string) {
                this._message = message
              }
            
              get prop() {
                return this._prop
              }
            
              render() {}
            }`,
          options: [
            {
              ...options,
              groups: [
                'decorated-property',
                'property',
                'private-decorated-property',
                'private-property',
                'constructor',
                ['decorated-get-method', 'decorated-set-method'],
                ['get-method', 'set-method'],
                'unknown',
              ],
            },
          ],
          errors: [
            {
              messageId: 'unexpectedClassesOrder',
              data: {
                left: 'message',
                right: 'prop',
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(`${RULE_NAME}(${type}): sorts decorated accessors`, rule, {
      valid: [],
      invalid: [
        {
          code: dedent`
            class Todo {
              id = Math.random()
            
              constructor() {}
            
              @action
              toggle() {}
            
              @observable
              accessor #active = false
            
              @observable
              accessor finished = false
            
              @observable
              accessor title = ''
            }`,
          output: dedent`
            class Todo {
              @observable
              accessor finished = false
            
              @observable
              accessor title = ''
            
              @observable
              accessor #active = false
            
              id = Math.random()
            
              constructor() {}
            
              @action
              toggle() {}
            }`,
          options: [
            {
              ...options,
              groups: [
                'decorated-accessor-property',
                'private-decorated-accessor-property',
                'property',
                'constructor',
                'decorated-method',
                'unknown',
              ],
            },
          ],
          errors: [
            {
              messageId: 'unexpectedClassesOrder',
              data: {
                left: 'toggle',
                right: '#active',
              },
            },
            {
              messageId: 'unexpectedClassesOrder',
              data: {
                left: '#active',
                right: 'finished',
              },
            },
          ],
        },
      ],
    })
  })

  describe(`${RULE_NAME}: sorting by natural order`, () => {
    let type = 'natural-order'

    let options = {
      type: SortType.natural,
      order: SortOrder.asc,
      'ignore-case': false,
    }

    ruleTester.run(`${RULE_NAME}(${type}): sorts class members`, rule, {
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
              ...options,
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
              ...options,
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

    ruleTester.run(
      `${RULE_NAME}(${type}): sorts class and group members`,
      rule,
      {
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
                ...options,
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
                ...options,
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
      },
    )

    ruleTester.run(
      `${RULE_NAME}(${type}): sorts class with ts index signatures`,
      rule,
      {
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
                ...options,
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
                ...options,
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
      },
    )

    ruleTester.run(
      `${RULE_NAME}(${type}): sorts class with ts index signatures`,
      rule,
      {
        valid: [
          {
            code: dedent`
              class Decorations {
                setBackground(color: number, hexFlag: boolean): this
                setBackground(color: Color | string | CSSColor): this
                setBackground(r: number, g: number, b: number, a?: number): this
                setBackground(color: ColorArgument, arg1?: boolean | number, arg2?: number, arg3?: number): this {
                    /* ... */
                }
              }
            `,
            options: [
              {
                ...options,
                groups: [
                  ['static-property', 'private-property', 'property'],
                  'constructor',
                ],
              },
            ],
          },
        ],
        invalid: [],
      },
    )

    ruleTester.run(
      `${RULE_NAME}(${type}): sorts private methods with hash`,
      rule,
      {
        valid: [],
        invalid: [
          {
            code: dedent`
              class MyUnsortedClass {
                someOtherProperty

                someProperty = 1

                constructor() {}

                static #aPrivateStaticMethod () {}

                #somePrivateProperty

                #someOtherPrivateProperty = 2

                static someStaticProperty = 3

                static #someStaticPrivateProperty = 4

                aInstanceMethod () {}

                static aStaticMethod () {}

                #aPrivateInstanceMethod () {}
              }
            `,
            output: dedent`
              class MyUnsortedClass {
                static someStaticProperty = 3

                #someOtherPrivateProperty = 2

                #somePrivateProperty

                static #someStaticPrivateProperty = 4

                someOtherProperty

                someProperty = 1

                constructor() {}

                aInstanceMethod () {}

                #aPrivateInstanceMethod () {}

                static #aPrivateStaticMethod () {}

                static aStaticMethod () {}
              }
            `,
            options: [
              {
                ...options,
                groups: [
                  'static-property',
                  'private-property',
                  'property',
                  'constructor',
                  'method',
                  'private-method',
                  'static-method',
                  'unknown',
                ],
              },
            ],
            errors: [
              {
                messageId: 'unexpectedClassesOrder',
                data: {
                  left: '#aPrivateStaticMethod',
                  right: '#somePrivateProperty',
                },
              },
              {
                messageId: 'unexpectedClassesOrder',
                data: {
                  left: '#somePrivateProperty',
                  right: '#someOtherPrivateProperty',
                },
              },
              {
                messageId: 'unexpectedClassesOrder',
                data: {
                  left: '#someOtherPrivateProperty',
                  right: 'someStaticProperty',
                },
              },
              {
                messageId: 'unexpectedClassesOrder',
                data: {
                  left: 'aStaticMethod',
                  right: '#aPrivateInstanceMethod',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(
      `${RULE_NAME}(${type}): allows split methods with getters and setters`,
      rule,
      {
        valid: [],
        invalid: [
          {
            code: dedent`
              class A {
                x() {}
                b() {}
                get z() {}
                get c() {}
                set c() {}
              }
            `,
            output: dedent`
              class A {
                b() {}
                x() {}
                get c() {}
                set c() {}
                get z() {}
              }
            `,
            options: [
              {
                ...options,
                groups: [
                  'index-signature',
                  'static-property',
                  'private-property',
                  'property',
                  'constructor',
                  'static-method',
                  'private-method',
                  'method',
                  ['get-method', 'set-method'],
                  'unknown',
                ],
              },
            ],
            errors: [
              {
                messageId: 'unexpectedClassesOrder',
                data: {
                  left: 'x',
                  right: 'b',
                },
              },
              {
                messageId: 'unexpectedClassesOrder',
                data: {
                  left: 'z',
                  right: 'c',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(`${RULE_NAME}(${type}): sorts decorated properties`, rule, {
      valid: [],
      invalid: [
        {
          code: dedent`
            class User {
              firstName: string

              id: number

              @Index({ name: 'born_index' })
              @Property()
              born: string

              @Property()
              @Unique()
              email: string

              lastName: string
            }`,
          output: dedent`
            class User {
              firstName: string

              id: number

              lastName: string

              @Index({ name: 'born_index' })
              @Property()
              born: string

              @Property()
              @Unique()
              email: string
            }`,
          options: [
            {
              ...options,
              groups: ['property', 'decorated-property', 'unknown'],
            },
          ],
          errors: [
            {
              messageId: 'unexpectedClassesOrder',
              data: {
                left: 'email',
                right: 'lastName',
              },
            },
          ],
        },
        {
          code: dedent`
            class MyElement {
              @property({ attribute: false })
              data = {}
            
              @property()
              greeting: string = 'Hello'
            
              @state()
              private _counter = 0
            
              private _message = ''
            
              private _prop = 0
            
              constructor() {}
            
              @property()
              get message(): string {
                return this._message
              }
            
              set message(message: string) {
                this._message = message
              }
            
              @property()
              set prop(val: number) {
                this._prop = Math.floor(val)
              }
            
              get prop() {
                return this._prop
              }
            
              render() {}
            }`,
          output: dedent`
            class MyElement {
              @property({ attribute: false })
              data = {}
            
              @property()
              greeting: string = 'Hello'
            
              @state()
              private _counter = 0
            
              private _message = ''
            
              private _prop = 0
            
              constructor() {}
            
              @property()
              get message(): string {
                return this._message
              }
            
              @property()
              set prop(val: number) {
                this._prop = Math.floor(val)
              }
            
              set message(message: string) {
                this._message = message
              }
            
              get prop() {
                return this._prop
              }
            
              render() {}
            }`,
          options: [
            {
              ...options,
              groups: [
                'decorated-property',
                'property',
                'private-decorated-property',
                'private-property',
                'constructor',
                ['decorated-get-method', 'decorated-set-method'],
                ['get-method', 'set-method'],
                'unknown',
              ],
            },
          ],
          errors: [
            {
              messageId: 'unexpectedClassesOrder',
              data: {
                left: 'message',
                right: 'prop',
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(`${RULE_NAME}(${type}): sorts decorated accessors`, rule, {
      valid: [],
      invalid: [
        {
          code: dedent`
            class Todo {
              id = Math.random()
            
              constructor() {}
            
              @action
              toggle() {}
            
              @observable
              accessor #active = false
            
              @observable
              accessor finished = false
            
              @observable
              accessor title = ''
            }`,
          output: dedent`
            class Todo {
              @observable
              accessor finished = false
            
              @observable
              accessor title = ''
            
              @observable
              accessor #active = false
            
              id = Math.random()
            
              constructor() {}
            
              @action
              toggle() {}
            }`,
          options: [
            {
              ...options,
              groups: [
                'decorated-accessor-property',
                'private-decorated-accessor-property',
                'property',
                'constructor',
                'decorated-method',
                'unknown',
              ],
            },
          ],
          errors: [
            {
              messageId: 'unexpectedClassesOrder',
              data: {
                left: 'toggle',
                right: '#active',
              },
            },
            {
              messageId: 'unexpectedClassesOrder',
              data: {
                left: '#active',
                right: 'finished',
              },
            },
          ],
        },
      ],
    })
  })

  describe(`${RULE_NAME}: sorting by line length`, () => {
    let type = 'line-length-order'

    let options = {
      type: SortType['line-length'],
      order: SortOrder.desc,
    }

    ruleTester.run(`${RULE_NAME}(${type}): sorts class members`, rule, {
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
              ...options,
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
              ...options,
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

    ruleTester.run(
      `${RULE_NAME}(${type}): sorts class and group members`,
      rule,
      {
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
                ...options,
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
                ...options,
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
      },
    )

    ruleTester.run(
      `${RULE_NAME}(${type}): sorts class with ts index signatures`,
      rule,
      {
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
                ...options,
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
                ...options,
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
      },
    )

    ruleTester.run(
      `${RULE_NAME}(${type}): sorts class with ts index signatures`,
      rule,
      {
        valid: [
          {
            code: dedent`
              class Decorations {
                setBackground(color: number, hexFlag: boolean): this
                setBackground(color: Color | string | CSSColor): this
                setBackground(r: number, g: number, b: number, a?: number): this
                setBackground(color: ColorArgument, arg1?: boolean | number, arg2?: number, arg3?: number): this {
                    /* ... */
                }
              }
            `,
            options: [
              {
                ...options,
                groups: [
                  ['static-property', 'private-property', 'property'],
                  'constructor',
                ],
              },
            ],
          },
        ],
        invalid: [],
      },
    )

    ruleTester.run(
      `${RULE_NAME}(${type}): sorts private methods with hash`,
      rule,
      {
        valid: [],
        invalid: [
          {
            code: dedent`
              class MyUnsortedClass {
                someOtherProperty

                someProperty = 1

                constructor() {}

                static #aPrivateStaticMethod () {}

                #somePrivateProperty

                #someOtherPrivateProperty = 2

                static someStaticProperty = 3

                static #someStaticPrivateProperty = 4

                aInstanceMethod () {}

                static aStaticMethod () {}

                #aPrivateInstanceMethod () {}
              }
            `,
            output: dedent`
              class MyUnsortedClass {
                static someStaticProperty = 3

                static #someStaticPrivateProperty = 4

                #someOtherPrivateProperty = 2

                #somePrivateProperty

                someOtherProperty

                someProperty = 1

                constructor() {}

                aInstanceMethod () {}

                static #aPrivateStaticMethod () {}

                #aPrivateInstanceMethod () {}

                static aStaticMethod () {}
              }
            `,
            options: [
              {
                ...options,
                groups: [
                  'static-property',
                  'private-property',
                  'property',
                  'constructor',
                  'method',
                  'private-method',
                  'static-method',
                  'unknown',
                ],
              },
            ],
            errors: [
              {
                messageId: 'unexpectedClassesOrder',
                data: {
                  left: '#aPrivateStaticMethod',
                  right: '#somePrivateProperty',
                },
              },
              {
                messageId: 'unexpectedClassesOrder',
                data: {
                  left: '#somePrivateProperty',
                  right: '#someOtherPrivateProperty',
                },
              },
              {
                messageId: 'unexpectedClassesOrder',
                data: {
                  left: '#someOtherPrivateProperty',
                  right: 'someStaticProperty',
                },
              },
              {
                messageId: 'unexpectedClassesOrder',
                data: {
                  left: 'aStaticMethod',
                  right: '#aPrivateInstanceMethod',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(`${RULE_NAME}(${type}): sorts decorated properties`, rule, {
      valid: [],
      invalid: [
        {
          code: dedent`
            class User {
              firstName: string

              id: number

              @Index({ name: 'born_index' })
              @Property()
              born: string

              @Property()
              @Unique()
              email: string

              lastName: string
            }`,
          output: dedent`
            class User {
              firstName: string

              lastName: string

              id: number

              @Index({ name: 'born_index' })
              @Property()
              born: string

              @Property()
              @Unique()
              email: string
            }`,
          options: [
            {
              ...options,
              groups: ['property', 'decorated-property', 'unknown'],
            },
          ],
          errors: [
            {
              messageId: 'unexpectedClassesOrder',
              data: {
                left: 'email',
                right: 'lastName',
              },
            },
          ],
        },
        {
          code: dedent`
            class MyElement {
              @property({ attribute: false })
              data = {}

              @property()
              greeting: string = 'Hello'

              @state()
              private _counter = 0

              private _message = ''
            
              private _prop = 0
            
              constructor() {}

              @property()
              get message(): string {
                return this._message
              }
            
              set message(message: string) {
                this._message = message
              }
            
              @property()
              set prop(val: number) {
                this._prop = Math.floor(val)
              }
            
              get prop() {
                return this._prop
              }
            
              render() {}
            }`,
          output: dedent`
            class MyElement {
              @property({ attribute: false })
              data = {}

              @property()
              greeting: string = 'Hello'
            
              @state()
              private _counter = 0
            
              private _message = ''
            
              private _prop = 0
            
              constructor() {}
            
              @property()
              set prop(val: number) {
                this._prop = Math.floor(val)
              }

              @property()
              get message(): string {
                return this._message
              }
            
              set message(message: string) {
                this._message = message
              }
            
              get prop() {
                return this._prop
              }
            
              render() {}
            }`,
          options: [
            {
              ...options,
              groups: [
                'decorated-property',
                'property',
                'private-decorated-property',
                'private-property',
                'constructor',
                ['decorated-get-method', 'decorated-set-method'],
                ['get-method', 'set-method'],
                'unknown',
              ],
            },
          ],
          errors: [
            {
              messageId: 'unexpectedClassesOrder',
              data: {
                left: 'message',
                right: 'prop',
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(`${RULE_NAME}(${type}): sorts decorated accessors`, rule, {
      valid: [],
      invalid: [
        {
          code: dedent`
            class Todo {
              id = Math.random()
            
              constructor() {}
            
              @action
              toggle() {}
            
              @observable
              accessor #active = false
            
              @observable
              accessor finished = false
            
              @observable
              accessor title = ''
            }`,
          output: dedent`
            class Todo {
              @observable
              accessor finished = false
            
              @observable
              accessor title = ''
            
              @observable
              accessor #active = false
            
              id = Math.random()
            
              constructor() {}
            
              @action
              toggle() {}
            }`,
          options: [
            {
              ...options,
              groups: [
                'decorated-accessor-property',
                'private-decorated-accessor-property',
                'property',
                'constructor',
                'decorated-method',
                'unknown',
              ],
            },
          ],
          errors: [
            {
              messageId: 'unexpectedClassesOrder',
              data: {
                left: 'toggle',
                right: '#active',
              },
            },
            {
              messageId: 'unexpectedClassesOrder',
              data: {
                left: '#active',
                right: 'finished',
              },
            },
          ],
        },
      ],
    })
  })

  describe(`${RULE_NAME}: misc`, () => {
    ruleTester.run(
      `${RULE_NAME}: sets alphabetical asc sorting as default`,
      rule,
      {
        valid: [
          {
            code: dedent`
              class Calculator {
                static log(x) {
                  return 0;
                }

                static log10(x) {
                  return 0;
                }

                static log1p(x) {
                  return 0;
                }

                static log2(x) {
                  return 0;
                }
              }
            `,
            options: [{}],
          },
        ],
        invalid: [
          {
            code: dedent`
              class Calculator {
                static log(x) {
                  return 0;
                }

                static log1p(x) {
                  return 0;
                }

                static log10(x) {
                  return 0;
                }

                static log2(x) {
                  return 0;
                }
              }
            `,
            output: dedent`
              class Calculator {
                static log(x) {
                  return 0;
                }

                static log10(x) {
                  return 0;
                }

                static log1p(x) {
                  return 0;
                }

                static log2(x) {
                  return 0;
                }
              }
            `,
            errors: [
              {
                messageId: 'unexpectedClassesOrder',
                data: {
                  left: 'log1p',
                  right: 'log10',
                },
              },
            ],
          },
        ],
      },
    )
  })
})
