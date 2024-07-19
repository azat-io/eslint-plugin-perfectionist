import { RuleTester } from '@typescript-eslint/rule-tester'
import { afterAll, describe, it } from 'vitest'
import { dedent } from 'ts-dedent'

import rule, { RULE_NAME } from '../rules/sort-classes'

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
      type: 'alphabetical',
      ignoreCase: true,
      order: 'asc',
    } as const

    ruleTester.run(`${RULE_NAME}(${type}): sorts class members`, rule, {
      valid: [
        {
          code: dedent`
            class Class {
              static a = 'a'

              private b = 'b'

              c = 'c'

              d = 'd'

              constructor() {}

              static e() {}

              private f() {}

              g() {}

              h() {}
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
            class Class {
              static a = 'a'

              private b = 'b'

              d = 'd'

              c = 'c'

              static e() {}

              constructor() {}

              private f() {}

              g() {}

              h() {}
            }
          `,
          output: dedent`
            class Class {
              static a = 'a'

              private b = 'b'

              c = 'c'

              d = 'd'

              constructor() {}

              static e() {}

              private f() {}

              g() {}

              h() {}
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
                left: 'd',
                right: 'c',
              },
            },
            {
              messageId: 'unexpectedClassesOrder',
              data: {
                left: 'e',
                right: 'constructor',
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
              class Class {
                static a

                static b = 'b'

                [key in O]

                static {
                  this.a = 'd'
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
              class Class {
                [key in O]

                static b = 'b'

                static a

                static {
                  this.a = 'd'
                }
              }
            `,
            output: dedent`
              class Class {
                static a

                static b = 'b'

                [key in O]

                static {
                  this.a = 'd'
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
                  left: 'key in O',
                  right: 'b',
                },
              },
              {
                messageId: 'unexpectedClassesOrder',
                data: {
                  left: 'b',
                  right: 'a',
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
              class Class {
                static a = 'a';

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
              class Class {
                [k: string]: any;

                [k: string];

                static a = 'a';
              }
            `,
            output: dedent`
              class Class {
                static a = 'a';

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
                  right: 'a',
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

    ruleTester.run(`${RULE_NAME}(${type}): sorts decorated accessors`, rule, {
      valid: [
        {
          code: dedent`
            export class Example {
              // Region: Table
              protected onChangeColumns() {}

              protected onPaginationChanged() {}

              protected onSortChanged() {}

              protected updateTable() {}

              // Region: Form
              protected clearForm() {}

              protected disableForm() {}

              // Regular Comment
              protected onValueChanged() {}

              protected setFormValue() {}
            }
          `,
          options: [
            {
              ...options,
              partitionByComment: 'Region:*',
            },
          ],
        },
      ],
      invalid: [
        {
          code: dedent`
            export class Example {
              // Region: Table
              protected onChangeColumns() {}

              protected updateTable() {}

              protected onSortChanged() {}

              protected onPaginationChanged() {}

              // Region: Form
              protected clearForm() {}

              protected disableForm() {}

              protected setFormValue() {}

              // Regular Comment
              protected onValueChanged() {}
            }
          `,
          output: dedent`
            export class Example {
              // Region: Table
              protected onChangeColumns() {}

              protected onPaginationChanged() {}

              protected onSortChanged() {}

              protected updateTable() {}

              // Region: Form
              protected clearForm() {}

              protected disableForm() {}

              // Regular Comment
              protected onValueChanged() {}

              protected setFormValue() {}
            }
          `,
          options: [
            {
              ...options,
              partitionByComment: 'Region:*',
            },
          ],
          errors: [
            {
              messageId: 'unexpectedClassesOrder',
              data: {
                left: 'updateTable',
                right: 'onSortChanged',
              },
            },
            {
              messageId: 'unexpectedClassesOrder',
              data: {
                left: 'onSortChanged',
                right: 'onPaginationChanged',
              },
            },
            {
              messageId: 'unexpectedClassesOrder',
              data: {
                left: 'setFormValue',
                right: 'onValueChanged',
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
      ignoreCase: true,
      type: 'natural',
      order: 'asc',
    } as const

    ruleTester.run(`${RULE_NAME}(${type}): sorts class members`, rule, {
      valid: [
        {
          code: dedent`
            class Class {
              static a = 'a'

              private b = 'b'

              c = 'c'

              d = 'd'

              constructor() {}

              static e() {}

              private f() {}

              g() {}

              h() {}
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
            class Class {
              static a = 'a'

              private b = 'b'

              d = 'd'

              c = 'c'

              static e() {}

              constructor() {}

              private f() {}

              g() {}

              h() {}
            }
          `,
          output: dedent`
            class Class {
              static a = 'a'

              private b = 'b'

              c = 'c'

              d = 'd'

              constructor() {}

              static e() {}

              private f() {}

              g() {}

              h() {}
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
                left: 'd',
                right: 'c',
              },
            },
            {
              messageId: 'unexpectedClassesOrder',
              data: {
                left: 'e',
                right: 'constructor',
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
              class Class {
                static a

                static b = 'b'

                [key in O]

                static {
                  this.a = 'd'
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
              class Class {
                [key in O]

                static b = 'b'

                static a

                static {
                  this.a = 'd'
                }
              }
            `,
            output: dedent`
              class Class {
                static a

                static b = 'b'

                [key in O]

                static {
                  this.a = 'd'
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
                  left: 'key in O',
                  right: 'b',
                },
              },
              {
                messageId: 'unexpectedClassesOrder',
                data: {
                  left: 'b',
                  right: 'a',
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
              class Class {
                static a = 'a';

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
              class Class {
                [k: string]: any;

                [k: string];

                static a = 'a';
              }
            `,
            output: dedent`
              class Class {
                static a = 'a';

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
                  right: 'a',
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

    ruleTester.run(`${RULE_NAME}(${type}): sorts decorated accessors`, rule, {
      valid: [
        {
          code: dedent`
            export class Example {
              // Region: Table
              protected onChangeColumns() {}

              protected onPaginationChanged() {}

              protected onSortChanged() {}

              protected updateTable() {}

              // Region: Form
              protected clearForm() {}

              protected disableForm() {}

              // Regular Comment
              protected onValueChanged() {}

              protected setFormValue() {}
            }
          `,
          options: [
            {
              ...options,
              partitionByComment: 'Region:*',
            },
          ],
        },
      ],
      invalid: [
        {
          code: dedent`
            export class Example {
              // Region: Table
              protected onChangeColumns() {}

              protected updateTable() {}

              protected onSortChanged() {}

              protected onPaginationChanged() {}

              // Region: Form
              protected clearForm() {}

              protected disableForm() {}

              protected setFormValue() {}

              // Regular Comment
              protected onValueChanged() {}
            }
          `,
          output: dedent`
            export class Example {
              // Region: Table
              protected onChangeColumns() {}

              protected onPaginationChanged() {}

              protected onSortChanged() {}

              protected updateTable() {}

              // Region: Form
              protected clearForm() {}

              protected disableForm() {}

              // Regular Comment
              protected onValueChanged() {}

              protected setFormValue() {}
            }
          `,
          options: [
            {
              ...options,
              partitionByComment: 'Region:*',
            },
          ],
          errors: [
            {
              messageId: 'unexpectedClassesOrder',
              data: {
                left: 'updateTable',
                right: 'onSortChanged',
              },
            },
            {
              messageId: 'unexpectedClassesOrder',
              data: {
                left: 'onSortChanged',
                right: 'onPaginationChanged',
              },
            },
            {
              messageId: 'unexpectedClassesOrder',
              data: {
                left: 'setFormValue',
                right: 'onValueChanged',
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
      type: 'line-length',
      order: 'desc',
    } as const

    ruleTester.run(`${RULE_NAME}(${type}): sorts class members`, rule, {
      valid: [
        {
          code: dedent`
            class Class {
              static a = 'a'

              private b = 'b'

              c = 'c'

              d = 'd'

              constructor() {}

              static e() {}

              private f() {}

              g() {}

              h() {}
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
            class Class {
              static a = 'a'

              private b = 'b'

              d = 'd'

              c = 'c'

              static e() {}

              constructor() {}

              private f() {}

              g() {}

              h() {}
            }
          `,
          output: dedent`
            class Class {
              static a = 'a'

              private b = 'b'

              d = 'd'

              c = 'c'

              constructor() {}

              static e() {}

              private f() {}

              g() {}

              h() {}
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
                left: 'e',
                right: 'constructor',
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
              class Class {
                static b = 'b'

                [key in O]

                static a

                static {
                  this.a = 'd'
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
              class Class {
                [key in O]

                static b = 'b'

                static a

                static {
                  this.a = 'd'
                }
              }
            `,
            output: dedent`
              class Class {
                static b = 'b'

                [key in O]

                static a

                static {
                  this.a = 'd'
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
                  left: 'key in O',
                  right: 'b',
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
              class Class {
                static a = 'a';

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
              class Class {
                [k: string]: any;

                [k: string];

                static a = 'a';
              }
            `,
            output: dedent`
              class Class {
                static a = 'a';

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
                  right: 'a',
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
              @observable
              customLastGroupProperty = 1

              id = Math.random()

              constructor() {}

              @observable
              customFirstGroupProperty = 1

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
              customFirstGroupProperty = 1

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

              @observable
              customLastGroupProperty = 1

            }`,
          options: [
            {
              ...options,
              customGroups: {
                'my-first-group': 'customFirst*',
                'my-last-group': 'customLast*',
              },
              groups: [
                'my-first-group',
                'decorated-accessor-property',
                'private-decorated-accessor-property',
                'property',
                'constructor',
                'decorated-method',
                'unknown',
                'my-last-group',
              ],
            },
          ],
          errors: [
            {
              messageId: 'unexpectedClassesOrder',
              data: {
                left: 'customLastGroupProperty',
                right: 'id',
              },
            },
            {
              messageId: 'unexpectedClassesOrder',
              data: {
                left: 'constructor',
                right: 'customFirstGroupProperty',
              },
            },
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
