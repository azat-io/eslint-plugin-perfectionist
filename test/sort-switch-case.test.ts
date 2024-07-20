import { RuleTester } from '@typescript-eslint/rule-tester'
import { afterAll, describe, it } from 'vitest'
import { dedent } from 'ts-dedent'

import rule from '../rules/sort-switch-case'

let ruleName = 'sort-switch-case'

describe(ruleName, () => {
  RuleTester.describeSkip = describe.skip
  RuleTester.afterAll = afterAll
  RuleTester.describe = describe
  RuleTester.itOnly = it.only
  RuleTester.itSkip = it.skip
  RuleTester.it = it

  let ruleTester = new RuleTester({
    parser: '@typescript-eslint/parser',
  })

  describe(`${ruleName}: sorting by alphabetical order`, () => {
    let type = 'alphabetical-order'

    let options = {
      type: 'alphabetical',
      ignoreCase: true,
      order: 'asc',
    } as const

    ruleTester.run(
      `${ruleName}(${type}): sorts switch cases with return statements`,
      rule,
      {
        valid: [
          {
            code: dedent`
              function func(name) {
                switch(name) {
                  case 'aaa':
                    return 'a'
                  case 'bb':
                    return 'b'
                  case 'c':
                    return 'c'
                  default:
                    return 'x'
                }
              }
            `,
            options: [options],
          },
        ],
        invalid: [
          {
            code: dedent`
              function func(name) {
                switch(name) {
                  case 'bb':
                    return 'b'
                  case 'aaa':
                    return 'a'
                  case 'c':
                    return 'c'
                  default:
                    return 'x'
                }
              }
            `,
            output: dedent`
              function func(name) {
                switch(name) {
                  case 'aaa':
                    return 'a'
                  case 'bb':
                    return 'b'
                  case 'c':
                    return 'c'
                  default:
                    return 'x'
                }
              }
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedSwitchCaseOrder',
                data: {
                  left: 'bb',
                  right: 'aaa',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): sorts switch cases with break statements`,
      rule,
      {
        valid: [
          {
            code: dedent`
              function func(name) {
                let size
                switch(name) {
                  case 'aaa':
                    height = 1
                    break
                  case 'bb':
                    height = 2
                    break
                  case 'c':
                    height = 3
                    break
                  default:
                    height = NaN
                }
                return size
              }
            `,
            options: [options],
          },
        ],
        invalid: [
          {
            code: dedent`
              function func(name) {
                let size
                switch(name) {
                  case 'aaa':
                    height = 1
                    break
                  case 'c':
                    height = 3
                    break
                  case 'bb':
                    height = 2
                    break
                  default:
                    height = NaN
                }
                return size
              }
            `,
            output: dedent`
              function func(name) {
                let size
                switch(name) {
                  case 'aaa':
                    height = 1
                    break
                  case 'bb':
                    height = 2
                    break
                  case 'c':
                    height = 3
                    break
                  default:
                    height = NaN
                }
                return size
              }
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedSwitchCaseOrder',
                data: {
                  left: 'c',
                  right: 'bb',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(`${ruleName}(${type}): works with grouped cases`, rule, {
      valid: [
        {
          code: dedent`
            switch (value) {
              case 'aaaaaa':
                return 'primary'
              case 'bbbbb':
              case 'ddd':
                return 'secondary'
              case 'cccc':
              case 'ee':
              case 'f':
                return 'tertiary'
              case 'x':
              default:
                return 'unknown'
            }
          `,
          options: [options],
        },
      ],
      invalid: [
        {
          code: dedent`
            switch (value) {
              case 'aaaaaa':
                return 'primary'
              case 'ee':
              case 'cccc':
              case 'f':
                return 'tertiary'
              case 'bbbbb':
              case 'ddd':
                return 'secondary'
              case 'x':
              default:
                return 'unknown'
            }
          `,
          output: dedent`
            switch (value) {
              case 'aaaaaa':
                return 'primary'
              case 'bbbbb':
              case 'ddd':
                return 'secondary'
              case 'cccc':
              case 'ee':
              case 'f':
                return 'tertiary'
              case 'x':
              default:
                return 'unknown'
            }
          `,
          options: [options],
          errors: [
            {
              messageId: 'unexpectedSwitchCaseOrder',
              data: {
                left: 'ee',
                right: 'cccc',
              },
            },
            {
              messageId: 'unexpectedSwitchCaseOrder',
              data: {
                left: 'f',
                right: 'bbbbb',
              },
            },
          ],
        },
      ],
    })
  })

  describe(`${ruleName}: sorts switch cases with return statements`, () => {
    let type = 'natural-order'

    let options = {
      ignoreCase: true,
      type: 'natural',
      order: 'asc',
    } as const

    ruleTester.run(
      `${ruleName}(${type}): sorts switch cases with return statements`,
      rule,
      {
        valid: [
          {
            code: dedent`
              function func(name) {
                switch(name) {
                  case 'aaa':
                    return 'a'
                  case 'bb':
                    return 'b'
                  case 'c':
                    return 'c'
                  default:
                    return 'x'
                }
              }
            `,
            options: [options],
          },
        ],
        invalid: [
          {
            code: dedent`
              function func(name) {
                switch(name) {
                  case 'bb':
                    return 'b'
                  case 'aaa':
                    return 'a'
                  case 'c':
                    return 'c'
                  default:
                    return 'x'
                }
              }
            `,
            output: dedent`
              function func(name) {
                switch(name) {
                  case 'aaa':
                    return 'a'
                  case 'bb':
                    return 'b'
                  case 'c':
                    return 'c'
                  default:
                    return 'x'
                }
              }
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedSwitchCaseOrder',
                data: {
                  left: 'bb',
                  right: 'aaa',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): sorts switch cases with break statements`,
      rule,
      {
        valid: [
          {
            code: dedent`
              function func(name) {
                let size
                switch(name) {
                  case 'aaa':
                    height = 1
                    break
                  case 'bb':
                    height = 2
                    break
                  case 'c':
                    height = 3
                    break
                  default:
                    height = NaN
                }
                return size
              }
            `,
            options: [options],
          },
        ],
        invalid: [
          {
            code: dedent`
              function func(name) {
                let size
                switch(name) {
                  case 'aaa':
                    height = 1
                    break
                  case 'c':
                    height = 3
                    break
                  case 'bb':
                    height = 2
                    break
                  default:
                    height = NaN
                }
                return size
              }
            `,
            output: dedent`
              function func(name) {
                let size
                switch(name) {
                  case 'aaa':
                    height = 1
                    break
                  case 'bb':
                    height = 2
                    break
                  case 'c':
                    height = 3
                    break
                  default:
                    height = NaN
                }
                return size
              }
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedSwitchCaseOrder',
                data: {
                  left: 'c',
                  right: 'bb',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(`${ruleName}(${type}): works with grouped cases`, rule, {
      valid: [
        {
          code: dedent`
            switch (value) {
              case 'aaaaaa':
                return 'primary'
              case 'bbbbb':
              case 'ddd':
                return 'secondary'
              case 'cccc':
              case 'ee':
              case 'f':
                return 'tertiary'
              case 'x':
              default:
                return 'unknown'
            }
          `,
          options: [options],
        },
      ],
      invalid: [
        {
          code: dedent`
            switch (value) {
              case 'aaaaaa':
                return 'primary'
              case 'ee':
              case 'cccc':
              case 'f':
                return 'tertiary'
              case 'bbbbb':
              case 'ddd':
                return 'secondary'
              case 'x':
              default:
                return 'unknown'
            }
          `,
          output: dedent`
            switch (value) {
              case 'aaaaaa':
                return 'primary'
              case 'bbbbb':
              case 'ddd':
                return 'secondary'
              case 'cccc':
              case 'ee':
              case 'f':
                return 'tertiary'
              case 'x':
              default:
                return 'unknown'
            }
          `,
          options: [options],
          errors: [
            {
              messageId: 'unexpectedSwitchCaseOrder',
              data: {
                left: 'ee',
                right: 'cccc',
              },
            },
            {
              messageId: 'unexpectedSwitchCaseOrder',
              data: {
                left: 'f',
                right: 'bbbbb',
              },
            },
          ],
        },
      ],
    })
  })

  describe(`${ruleName}: sorts switch cases with return statements`, () => {
    let type = 'line-length-order'

    let options = {
      type: 'line-length',
      order: 'desc',
    } as const

    ruleTester.run(
      `${ruleName}(${type}): sorts switch cases with return statements`,
      rule,
      {
        valid: [
          {
            code: dedent`
              function func(name) {
                switch(name) {
                  case 'aaa':
                    return 'a'
                  case 'bb':
                    return 'b'
                  case 'c':
                    return 'c'
                  default:
                    return 'x'
                }
              }
            `,
            options: [options],
          },
        ],
        invalid: [
          {
            code: dedent`
              function func(name) {
                switch(name) {
                  case 'bb':
                    return 'b'
                  case 'aaa':
                    return 'a'
                  case 'c':
                    return 'c'
                  default:
                    return 'x'
                }
              }
            `,
            output: dedent`
              function func(name) {
                switch(name) {
                  case 'aaa':
                    return 'a'
                  case 'bb':
                    return 'b'
                  case 'c':
                    return 'c'
                  default:
                    return 'x'
                }
              }
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedSwitchCaseOrder',
                data: {
                  left: 'bb',
                  right: 'aaa',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): sorts switch cases with break statements`,
      rule,
      {
        valid: [
          {
            code: dedent`
              function func(name) {
                let size
                switch(name) {
                  case 'aaa':
                    height = 1
                    break
                  case 'bb':
                    height = 2
                    break
                  case 'c':
                    height = 3
                    break
                  default:
                    height = NaN
                }
                return size
              }
            `,
            options: [options],
          },
        ],
        invalid: [
          {
            code: dedent`
              function func(name) {
                let size
                switch(name) {
                  case 'aaa':
                    height = 1
                    break
                  case 'c':
                    height = 3
                    break
                  case 'bb':
                    height = 2
                    break
                  default:
                    height = NaN
                }
                return size
              }
            `,
            output: dedent`
              function func(name) {
                let size
                switch(name) {
                  case 'aaa':
                    height = 1
                    break
                  case 'bb':
                    height = 2
                    break
                  case 'c':
                    height = 3
                    break
                  default:
                    height = NaN
                }
                return size
              }
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedSwitchCaseOrder',
                data: {
                  left: 'c',
                  right: 'bb',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(`${ruleName}(${type}): works with grouped cases`, rule, {
      valid: [
        {
          code: dedent`
            switch (value) {
              case 'aaaaaa':
                return 'primary'
              case 'bbbbb':
              case 'ddd':
                return 'secondary'
              case 'cccc':
              case 'ee':
              case 'f':
                return 'tertiary'
              case 'x':
              default:
                return 'unknown'
            }
          `,
          options: [options],
        },
      ],
      invalid: [
        {
          code: dedent`
            switch (value) {
              case 'aaaaaa':
                return 'primary'
              case 'ee':
              case 'cccc':
              case 'f':
                return 'tertiary'
              case 'bbbbb':
              case 'ddd':
                return 'secondary'
              case 'x':
              default:
                return 'unknown'
            }
          `,
          output: dedent`
            switch (value) {
              case 'aaaaaa':
                return 'primary'
              case 'bbbbb':
              case 'ddd':
                return 'secondary'
              case 'cccc':
              case 'ee':
              case 'f':
                return 'tertiary'
              case 'x':
              default:
                return 'unknown'
            }
          `,
          options: [options],
          errors: [
            {
              messageId: 'unexpectedSwitchCaseOrder',
              data: {
                left: 'ee',
                right: 'cccc',
              },
            },
            {
              messageId: 'unexpectedSwitchCaseOrder',
              data: {
                left: 'f',
                right: 'bbbbb',
              },
            },
          ],
        },
      ],
    })
  })

  describe(`${ruleName}: misc`, () => {
    ruleTester.run(
      `${ruleName}: not works if discriminant is not literal`,
      rule,
      {
        valid: [
          dedent`
            switch (true) {
              case name === 'bb':
                return 'b'
              case name === 'aaa':
                return 'a'
              case name === 'c':
                return 'c'
              default:
                return 'x'
            }
          `,
        ],
        invalid: [],
      },
    )
  })

  ruleTester.run(`${ruleName}: default should be last`, rule, {
    valid: [],
    invalid: [
      {
        code: dedent`
          switch (value) {
            case 'aa':
              return true
            default:
              return false
            case 'b':
              return true
          }
        `,
        output: dedent`
          switch (value) {
            case 'aa':
              return true
            case 'b':
              return true
            default:
              return false
          }
        `,
        errors: [
          {
            messageId: 'unexpectedSwitchCaseOrder',
            data: {
              left: 'default',
              right: 'b',
            },
          },
        ],
      },
    ],
  })
})
