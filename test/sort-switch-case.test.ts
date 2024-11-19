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

  let ruleTester = new RuleTester()

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
        invalid: [
          {
            output: dedent`
              function func(name) {
                switch(<any> myFunc(a! + b?.c as any)) {
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
            code: dedent`
              function func(name) {
                switch(<any> myFunc(a! + b?.c as any)) {
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
            errors: [
              {
                data: {
                  right: 'aaa',
                  left: 'bb',
                },
                messageId: 'unexpectedSwitchCaseOrder',
              },
            ],
            options: [options],
          },
          {
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
            errors: [
              {
                data: {
                  right: 'aaa',
                  left: 'bb',
                },
                messageId: 'unexpectedSwitchCaseOrder',
              },
            ],
            options: [options],
          },
        ],
        valid: [
          {
            code: dedent`
              switch(x) {
              }
            `,
            options: [{}],
          },
          {
            code: dedent`
              switch(x) {
                case "a":
                  break;
              }
            `,
            options: [{}],
          },
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
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): sorts switch cases with break statements`,
      rule,
      {
        invalid: [
          {
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
            errors: [
              {
                data: {
                  right: 'bb',
                  left: 'c',
                },
                messageId: 'unexpectedSwitchCaseOrder',
              },
            ],
            options: [options],
          },
        ],
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
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): sorts switch cases with block statements`,
      rule,
      {
        invalid: [
          {
            output: dedent`
              function func(name) {
                let size
                switch(name) {
                  case 'aaa': {
                    height = 1
                    break
                  }
                  case 'bb': {
                    height = 2
                    break
                  }
                  case 'c': {
                    height = 3
                    break
                  }
                  default:
                    height = NaN
                    break
                }
                return size
              }
            `,
            code: dedent`
              function func(name) {
                let size
                switch(name) {
                  case 'aaa': {
                    height = 1
                    break
                  }
                  case 'c': {
                    height = 3
                    break
                  }
                  case 'bb': {
                    height = 2
                    break
                  }
                  default:
                    height = NaN
                    break
                }
                return size
              }
            `,
            errors: [
              {
                data: {
                  right: 'bb',
                  left: 'c',
                },
                messageId: 'unexpectedSwitchCaseOrder',
              },
            ],
            options: [options],
          },
        ],
        valid: [
          {
            code: dedent`
              function func(name) {
                let size
                switch(name) {
                  case 'aaa': {
                    height = 1
                  }
                  case 'bb': {
                    height = 2
                  }
                  case 'c': {
                    height = 3
                  }
                  default:
                    height = NaN
                }
                return size
              }
            `,
            options: [options],
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): sorts switch cases without ending statements`,
      rule,
      {
        valid: [
          {
            code: dedent`
              function func(name) {
                switch(name) {
                  case 'b':
                    let b
                    break
                  case 'a':
                }
              }
            `,
            options: [options],
          },
          {
            code: dedent`
              function func(name) {
                switch(name) {
                  case 'b':
                    let b
                    break
                  case 'a':
                    let a
                }
              }
            `,
            options: [options],
          },
          {
            code: dedent`
              function func(name) {
                switch(name) {
                  case 'b':
                    let b
                    break
                  default:
                }
              }
            `,
            options: [options],
          },
          {
            code: dedent`
              function func(name) {
                switch(name) {
                  case 'b':
                    let b
                    break
                  default:
                    let x
                }
              }
            `,
            options: [options],
          },
        ],
        invalid: [
          {
            output: dedent`
              function func(name) {
                switch(name) {
                  case 'b':
                    let b
                    break
                  case 'c':
                    let c
                    break
                  case 'a':
                }
              }
            `,
            code: dedent`
              function func(name) {
                switch(name) {
                  case 'c':
                    let c
                    break
                  case 'b':
                    let b
                    break
                  case 'a':
                }
              }
            `,
            errors: [
              {
                data: {
                  right: 'b',
                  left: 'c',
                },
                messageId: 'unexpectedSwitchCaseOrder',
              },
            ],
            options: [options],
          },
        ],
      },
    )

    ruleTester.run(`${ruleName}(${type}): works with grouped cases`, rule, {
      invalid: [
        {
          output: [
            dedent`
              switch (value) {
                case 'aaaaaa':
                  return 'primary'
                case 'cccc':
                case 'ee':
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
            dedent`
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
          ],
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
          errors: [
            {
              data: {
                right: 'cccc',
                left: 'ee',
              },
              messageId: 'unexpectedSwitchCaseOrder',
            },
            {
              data: {
                right: 'bbbbb',
                left: 'f',
              },
              messageId: 'unexpectedSwitchCaseOrder',
            },
          ],
          options: [options],
        },
      ],
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
    })

    ruleTester.run(
      `${ruleName}(${type}): works with grouped cases with default`,
      rule,
      {
        invalid: [
          {
            output: dedent`
            switch (operationMode) {
              case wwww:
                return null
              case yy:
              case z:
                return null
              case xxx:
              default:
                return null
            }
          `,
            code: dedent`
            switch (operationMode) {
              case yy:
              case z:
                return null
              case wwww:
                return null
              case xxx:
              default:
                return null
            }
          `,
            errors: [
              {
                data: {
                  right: 'wwww',
                  left: 'z',
                },
                messageId: 'unexpectedSwitchCaseOrder',
              },
            ],
            options: [options],
          },
        ],
        valid: [
          {
            code: dedent`
            switch (operationMode) {
              case wwww:
                return null
              case yy:
              case z:
                return null
              case xxx:
              default:
                return null
            }
          `,
            options: [options],
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): works with single grouped case`,
      rule,
      {
        invalid: [
          {
            errors: [
              {
                data: {
                  right: 'AA',
                  left: 'B',
                },
                messageId: 'unexpectedSwitchCaseOrder',
              },
            ],
            output: dedent`
              switch (x) {
                case AA:
                case B:
                  const a = 1;
                  break;
              }
            `,
            code: dedent`
              switch (x) {
                case B:
                case AA:
                  const a = 1;
                  break;
              }
            `,
            options: [options],
          },
        ],
        valid: [
          {
            code: dedent`
              switch (x) {
                case AA:
                case B:
                  const a = 1;
                  break;
              }
            `,
            options: [options],
          },
        ],
      },
    )

    ruleTester.run(`${ruleName}(${type}): works with complex cases`, rule, {
      invalid: [
        {
          output: [
            dedent`
              switch (x) {
                case DD:
                case E:
                  const b = () => {
                    return 2
                  }
                  break
                case CCC:
                  break
                case AAAAA:
                case BBBB:
                  const a = 1
                  break
                default:
                  const c = 3
              }
            `,
            dedent`
              switch (x) {
                case AAAAA:
                case BBBB:
                  const a = 1
                  break
                case CCC:
                  break
                case DD:
                case E:
                  const b = () => {
                    return 2
                  }
                  break
                default:
                  const c = 3
              }
            `,
          ],
          errors: [
            {
              data: {
                right: 'DD',
                left: 'E',
              },
              messageId: 'unexpectedSwitchCaseOrder',
            },
            {
              data: {
                right: 'CCC',
                left: 'DD',
              },
              messageId: 'unexpectedSwitchCaseOrder',
            },
            {
              data: {
                right: 'BBBB',
                left: 'CCC',
              },
              messageId: 'unexpectedSwitchCaseOrder',
            },
            {
              data: {
                right: 'AAAAA',
                left: 'BBBB',
              },
              messageId: 'unexpectedSwitchCaseOrder',
            },
          ],
          code: dedent`
            switch (x) {
              case E:
              case DD:
                const b = () => {
                  return 2
                }
                break
              case CCC:
                break
              case BBBB:
              case AAAAA:
                const a = 1
                break
              default:
                const c = 3
            }
          `,
          options: [options],
        },
      ],
      valid: [
        {
          code: dedent`
            switch (x) {
              case AAAAA:
              case BBBB:
                const a = 1
                break
              case CCC:
                break
              case DD:
              case E:
                const b = () => {
                  return 2
                }
                break
              default:
                const c = 3
            }
          `,
          options: [options],
        },
      ],
    })

    ruleTester.run(
      `${ruleName}(${type}): works with groups with default`,
      rule,
      {
        invalid: [
          {
            errors: [
              {
                data: {
                  left: 'default',
                  right: 'B',
                },
                messageId: 'unexpectedSwitchCaseOrder',
              },
            ],
            output: dedent`
            switch (x) {
              case 'AA':
              case 'B':
              default:
                break;
            }
          `,
            code: dedent`
            switch (x) {
              case 'AA':
              default:
              case 'B':
                break;
            }
          `,
            options: [options],
          },
          {
            output: [
              dedent`
                switch (x) {
                  case 'default':
                  default:
                    break;
                  case 'somethingElse':
                    break;
                }
              `,
              dedent`
                switch (x) {
                  case 'somethingElse':
                    break;
                  case 'default':
                  default:
                    break;
                }
              `,
            ],
            errors: [
              {
                data: {
                  right: 'default',
                  left: 'default',
                },
                messageId: 'unexpectedSwitchCaseOrder',
              },
              {
                data: {
                  right: 'somethingElse',
                  left: 'default',
                },
                messageId: 'unexpectedSwitchCaseOrder',
              },
            ],
            code: dedent`
            switch (x) {
              default:
              case 'default':
                break;
              case 'somethingElse':
                break;
            }
          `,
            options: [options],
          },
        ],
        valid: [
          {
            code: dedent`
            switch (x) {
              case 'AA':
              case 'B':
              default:
                const c = 3
            }
          `,
            options: [options],
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): allows to trim special characters`,
      rule,
      {
        valid: [
          {
            code: dedent`
              switch (x) {
                case '_a':
                case 'b':
                case '_c':
                  break;
              }
            `,
            options: [
              {
                ...options,
                specialCharacters: 'trim',
              },
            ],
          },
        ],
        invalid: [],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): allows to remove special characters`,
      rule,
      {
        valid: [
          {
            code: dedent`
              switch (x) {
                case 'ab':
                case 'a_c':
                  break;
              }
            `,
            options: [
              {
                ...options,
                specialCharacters: 'remove',
              },
            ],
          },
        ],
        invalid: [],
      },
    )

    ruleTester.run(`${ruleName}(${type}): allows to use locale`, rule, {
      valid: [
        {
          code: dedent`
              switch (x) {
                case '你好':
                case '世界':
                case 'a':
                case 'A':
                case 'b':
                case 'B':
                  break;
              }
            `,
          options: [{ ...options, locales: 'zh-CN' }],
        },
      ],
      invalid: [],
    })

    ruleTester.run(
      `${ruleName}(${type}): sorts inline elements correctly`,
      rule,
      {
        invalid: [
          {
            errors: [
              {
                data: {
                  right: 'a',
                  left: 'b',
                },
                messageId: 'unexpectedSwitchCaseOrder',
              },
            ],
            output: dedent`
              switch (x) {
                case "a": break; case "b": break;
              }
            `,
            code: dedent`
              switch (x) {
                case "b": break; case "a": break
              }
            `,
            options: [options],
          },
          {
            errors: [
              {
                data: {
                  right: 'a',
                  left: 'b',
                },
                messageId: 'unexpectedSwitchCaseOrder',
              },
            ],
            output: dedent`
              switch (x) {
                case "a": break; case "b": break;
              }
            `,
            code: dedent`
              switch (x) {
                case "b": break; case "a": break;
              }
            `,
            options: [options],
          },
          {
            errors: [
              {
                data: {
                  right: 'a',
                  left: 'b',
                },
                messageId: 'unexpectedSwitchCaseOrder',
              },
            ],
            output: dedent`
              switch (x) {
                case "a": { break }; case "b": { break }
              }
            `,
            code: dedent`
              switch (x) {
                case "b": { break } case "a": { break }
              }
            `,
            options: [options],
          },
          {
            errors: [
              {
                data: {
                  right: 'a',
                  left: 'b',
                },
                messageId: 'unexpectedSwitchCaseOrder',
              },
            ],
            output: dedent`
              switch (x) {
                case "a": { break }; case "b": { break }
              }
            `,
            code: dedent`
              switch (x) {
                case "b": { break } case "a": { break };
              }
            `,
            options: [options],
          },
        ],
        valid: [],
      },
    )

    ruleTester.run(`${ruleName}: handles comments`, rule, {
      invalid: [
        {
          output: [
            dedent`
              switch (value) {
                case "a": // a
                case "b": // b
                  break;
              }
              `,
          ],
          code: dedent`
            switch (value) {
              case "b": // b
              case "a": // a
                break;
            }
            `,
          errors: [
            {
              messageId: 'unexpectedSwitchCaseOrder',
            },
          ],
          options: [{}],
        },
        {
          output: [
            dedent`
              switch (value) {
                case "a": // a
                default: // default
                  break;
              }
              `,
          ],
          code: dedent`
            switch (value) {
              default: // default
              case "a": // a
                break;
            }
            `,
          errors: [
            {
              messageId: 'unexpectedSwitchCaseOrder',
            },
          ],
          options: [{}],
        },
        {
          output: [
            dedent`
              switch (value) {
                case "z": { return; } // z
                case      "x"
                   : // x
                case "y": // y
                default    : // default
                    let a;
                case "b": // b
                  return;
                case "a": // A
                  break;
              }
              `,
            dedent`
              switch (value) {
                case "a": // A
                  break;
                case "z": { return; } // z
                case      "x"
                   : // x
                case "y": // y
                default    : // default
                    let a;
                case "b": // b
                  return;
              }
            `,
          ],
          errors: [
            {
              data: {
                left: 'default',
                right: 'x',
              },
              messageId: 'unexpectedSwitchCaseOrder',
            },
            {
              data: {
                right: 'x',
                left: 'y',
              },
              messageId: 'unexpectedSwitchCaseOrder',
            },
            {
              data: {
                right: 'a',
                left: 'b',
              },
              messageId: 'unexpectedSwitchCaseOrder',
            },
          ],
          code: dedent`
            switch (value) {
              case "z": { return; } // z
              default    : // default
              case "y": // y
              case      "x"
                 : // x
                  let a;
              case "b": // b
                return;
              case "a": // A
                break;
            }
            `,
          options: [{}],
        },
      ],
      valid: [],
    })

    ruleTester.run(`${ruleName}: handles last case without break`, rule, {
      valid: [
        {
          code: dedent`
              switch(x) {
                case "b": {
                  break
                }
                case "a": {
                  let a
                }
              }
            `,
          options: [{}],
        },
        {
          code: dedent`
              switch(x) {
                default: {
                  break
                }
                case "a": {
                  let a
                }
              }
            `,
          options: [{}],
        },
        {
          code: dedent`
              switch(x) {
                case "b":
                  break
                case "a":
                  let a
              }
            `,
          options: [{}],
        },
        {
          code: dedent`
              switch(x) {
                default:
                  break;
                case "a":
                  let a
              }
            `,
          options: [{}],
        },
      ],
      invalid: [
        {
          errors: [
            {
              data: {
                left: 'default',
                right: 'a',
              },
              messageId: 'unexpectedSwitchCaseOrder',
            },
          ],
          output: dedent`
            switch(x) {
              case "a":
                break;
              default:
                break;
              case "a":
            }
          `,
          code: dedent`
            switch(x) {
              default:
                break;
              case "a":
                break;
              case "a":
            }
          `,
          options: [{}],
        },
      ],
    })
  })

  describe(`${ruleName}: sorting by natural order`, () => {
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
        invalid: [
          {
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
            errors: [
              {
                data: {
                  right: 'aaa',
                  left: 'bb',
                },
                messageId: 'unexpectedSwitchCaseOrder',
              },
            ],
            options: [options],
          },
        ],
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
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): sorts switch cases with break statements`,
      rule,
      {
        invalid: [
          {
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
            errors: [
              {
                data: {
                  right: 'bb',
                  left: 'c',
                },
                messageId: 'unexpectedSwitchCaseOrder',
              },
            ],
            options: [options],
          },
        ],
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
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): sorts switch cases with block statements`,
      rule,
      {
        invalid: [
          {
            output: dedent`
              function func(name) {
                let size
                switch(name) {
                  case 'aaa': {
                    height = 1
                    break
                  }
                  case 'bb': {
                    height = 2
                    break
                  }
                  case 'c': {
                    height = 3
                    break
                  }
                  default:
                    height = NaN
                    break
                }
                return size
              }
            `,
            code: dedent`
              function func(name) {
                let size
                switch(name) {
                  case 'aaa': {
                    height = 1
                    break
                  }
                  case 'c': {
                    height = 3
                    break
                  }
                  case 'bb': {
                    height = 2
                    break
                  }
                  default:
                    height = NaN
                    break
                }
                return size
              }
            `,
            errors: [
              {
                data: {
                  right: 'bb',
                  left: 'c',
                },
                messageId: 'unexpectedSwitchCaseOrder',
              },
            ],
            options: [options],
          },
        ],
        valid: [
          {
            code: dedent`
              function func(name) {
                let size
                switch(name) {
                  case 'aaa': {
                    height = 1
                  }
                  case 'bb': {
                    height = 2
                  }
                  case 'c': {
                    height = 3
                  }
                  default:
                    height = NaN
                }
                return size
              }
            `,
            options: [options],
          },
        ],
      },
    )

    ruleTester.run(`${ruleName}(${type}): works with grouped cases`, rule, {
      invalid: [
        {
          output: [
            dedent`
              switch (value) {
                case 'aaaaaa':
                  return 'primary'
                case 'cccc':
                case 'ee':
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
            dedent`
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
          ],
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
          errors: [
            {
              data: {
                right: 'cccc',
                left: 'ee',
              },
              messageId: 'unexpectedSwitchCaseOrder',
            },
            {
              data: {
                right: 'bbbbb',
                left: 'f',
              },
              messageId: 'unexpectedSwitchCaseOrder',
            },
          ],
          options: [options],
        },
      ],
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
    })

    ruleTester.run(
      `${ruleName}(${type}): works with grouped cases with default`,
      rule,
      {
        invalid: [
          {
            output: dedent`
            switch (operationMode) {
              case wwww:
                return null
              case yy:
              case z:
                return null
              case xxx:
              default:
                return null
            }
          `,
            code: dedent`
            switch (operationMode) {
              case yy:
              case z:
                return null
              case wwww:
                return null
              case xxx:
              default:
                return null
            }
          `,
            errors: [
              {
                data: {
                  right: 'wwww',
                  left: 'z',
                },
                messageId: 'unexpectedSwitchCaseOrder',
              },
            ],
            options: [options],
          },
        ],
        valid: [
          {
            code: dedent`
            switch (operationMode) {
              case wwww:
                return null
              case yy:
              case z:
                return null
              case xxx:
              default:
                return null
            }
          `,
            options: [options],
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): works with single grouped case`,
      rule,
      {
        invalid: [
          {
            errors: [
              {
                data: {
                  right: 'AA',
                  left: 'B',
                },
                messageId: 'unexpectedSwitchCaseOrder',
              },
            ],
            output: dedent`
              switch (x) {
                case AA:
                case B:
                  const a = 1;
                  break;
              }
            `,
            code: dedent`
              switch (x) {
                case B:
                case AA:
                  const a = 1;
                  break;
              }
            `,
            options: [options],
          },
        ],
        valid: [
          {
            code: dedent`
              switch (x) {
                case AA:
                case B:
                  const a = 1;
                  break;
              }
            `,
            options: [options],
          },
        ],
      },
    )

    ruleTester.run(`${ruleName}(${type}): works with complex cases`, rule, {
      invalid: [
        {
          output: [
            dedent`
              switch (x) {
                case DD:
                case E:
                  const b = () => {
                    return 2
                  }
                  break
                case CCC:
                  break
                case AAAAA:
                case BBBB:
                  const a = 1
                  break
                default:
                  const c = 3
              }
            `,
            dedent`
              switch (x) {
                case AAAAA:
                case BBBB:
                  const a = 1
                  break
                case CCC:
                  break
                case DD:
                case E:
                  const b = () => {
                    return 2
                  }
                  break
                default:
                  const c = 3
              }
            `,
          ],
          errors: [
            {
              data: {
                right: 'DD',
                left: 'E',
              },
              messageId: 'unexpectedSwitchCaseOrder',
            },
            {
              data: {
                right: 'CCC',
                left: 'DD',
              },
              messageId: 'unexpectedSwitchCaseOrder',
            },
            {
              data: {
                right: 'BBBB',
                left: 'CCC',
              },
              messageId: 'unexpectedSwitchCaseOrder',
            },
            {
              data: {
                right: 'AAAAA',
                left: 'BBBB',
              },
              messageId: 'unexpectedSwitchCaseOrder',
            },
          ],
          code: dedent`
            switch (x) {
              case E:
              case DD:
                const b = () => {
                  return 2
                }
                break
              case CCC:
                break
              case BBBB:
              case AAAAA:
                const a = 1
                break
              default:
                const c = 3
            }
          `,
          options: [options],
        },
      ],
      valid: [
        {
          code: dedent`
            switch (x) {
              case AAAAA:
              case BBBB:
                const a = 1
                break
              case CCC:
                break
              case DD:
              case E:
                const b = () => {
                  return 2
                }
                break
              default:
                const c = 3
            }
          `,
          options: [options],
        },
      ],
    })

    ruleTester.run(
      `${ruleName}(${type}): works with groups with default`,
      rule,
      {
        invalid: [
          {
            errors: [
              {
                data: {
                  left: 'default',
                  right: 'B',
                },
                messageId: 'unexpectedSwitchCaseOrder',
              },
            ],
            output: dedent`
            switch (x) {
              case 'AA':
              case 'B':
              default:
                break;
            }
          `,
            code: dedent`
            switch (x) {
              case 'AA':
              default:
              case 'B':
                break;
            }
          `,
            options: [options],
          },
        ],
        valid: [
          {
            code: dedent`
            switch (x) {
              case 'AA':
              case 'B':
              default:
                const c = 3
            }
          `,
            options: [options],
          },
        ],
      },
    )
  })

  describe(`${ruleName}: sorting by line length`, () => {
    let type = 'line-length-order'

    let options = {
      type: 'line-length',
      order: 'desc',
    } as const

    ruleTester.run(
      `${ruleName}(${type}): sorts switch cases with return statements`,
      rule,
      {
        invalid: [
          {
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
            errors: [
              {
                data: {
                  right: 'aaa',
                  left: 'bb',
                },
                messageId: 'unexpectedSwitchCaseOrder',
              },
            ],
            options: [options],
          },
        ],
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
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): sorts switch cases with break statements`,
      rule,
      {
        invalid: [
          {
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
            errors: [
              {
                data: {
                  right: 'bb',
                  left: 'c',
                },
                messageId: 'unexpectedSwitchCaseOrder',
              },
            ],
            options: [options],
          },
        ],
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
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): sorts switch cases with block statements`,
      rule,
      {
        invalid: [
          {
            output: dedent`
              function func(name) {
                let size
                switch(name) {
                  case 'aaa': {
                    height = 1
                    break
                  }
                  case 'bb': {
                    height = 2
                    break
                  }
                  case 'c': {
                    height = 3
                    break
                  }
                  default:
                    height = NaN
                    break
                }
                return size
              }
            `,
            code: dedent`
              function func(name) {
                let size
                switch(name) {
                  case 'aaa': {
                    height = 1
                    break
                  }
                  case 'c': {
                    height = 3
                    break
                  }
                  case 'bb': {
                    height = 2
                    break
                  }
                  default:
                    height = NaN
                    break
                }
                return size
              }
            `,
            errors: [
              {
                data: {
                  right: 'bb',
                  left: 'c',
                },
                messageId: 'unexpectedSwitchCaseOrder',
              },
            ],
            options: [options],
          },
        ],
        valid: [
          {
            code: dedent`
              function func(name) {
                let size
                switch(name) {
                  case 'aaa': {
                    height = 1
                  }
                  case 'bb': {
                    height = 2
                  }
                  case 'c': {
                    height = 3
                  }
                  default:
                    height = NaN
                }
                return size
              }
            `,
            options: [options],
          },
        ],
      },
    )

    ruleTester.run(`${ruleName}(${type}): works with grouped cases`, rule, {
      invalid: [
        {
          output: [
            dedent`
              switch (value) {
                case 'aaaaaa':
                  return 'primary'
                case 'cccc':
                case 'ee':
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
            dedent`
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
          ],
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
          errors: [
            {
              data: {
                right: 'cccc',
                left: 'ee',
              },
              messageId: 'unexpectedSwitchCaseOrder',
            },
            {
              data: {
                right: 'bbbbb',
                left: 'f',
              },
              messageId: 'unexpectedSwitchCaseOrder',
            },
          ],
          options: [options],
        },
      ],
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
    })

    ruleTester.run(
      `${ruleName}(${type}): works with grouped cases with default`,
      rule,
      {
        invalid: [
          {
            output: dedent`
            switch (operationMode) {
              case wwww:
                return null
              case yy:
              case z:
                return null
              case xxx:
              default:
                return null
            }
          `,
            code: dedent`
            switch (operationMode) {
              case yy:
              case z:
                return null
              case wwww:
                return null
              case xxx:
              default:
                return null
            }
          `,
            errors: [
              {
                data: {
                  right: 'wwww',
                  left: 'z',
                },
                messageId: 'unexpectedSwitchCaseOrder',
              },
            ],
            options: [options],
          },
        ],
        valid: [
          {
            code: dedent`
            switch (operationMode) {
              case wwww:
                return null
              case yy:
              case z:
                return null
              case xxx:
              default:
                return null
            }
          `,
            options: [options],
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): works with single grouped case`,
      rule,
      {
        invalid: [
          {
            errors: [
              {
                data: {
                  right: 'AA',
                  left: 'B',
                },
                messageId: 'unexpectedSwitchCaseOrder',
              },
            ],
            output: dedent`
              switch (x) {
                case AA:
                case B:
                  const a = 1;
                  break;
              }
            `,
            code: dedent`
              switch (x) {
                case B:
                case AA:
                  const a = 1;
                  break;
              }
            `,
            options: [options],
          },
        ],
        valid: [
          {
            code: dedent`
              switch (x) {
                case AA:
                case B:
                  const a = 1;
                  break;
              }
            `,
            options: [options],
          },
        ],
      },
    )

    ruleTester.run(`${ruleName}(${type}): works with complex cases`, rule, {
      invalid: [
        {
          output: [
            dedent`
              switch (x) {
                case DD:
                case E:
                  const b = () => {
                    return 2
                  }
                  break
                case CCC:
                  break
                case AAAAA:
                case BBBB:
                  const a = 1
                  break
                default:
                  const c = 3
              }
            `,
            dedent`
              switch (x) {
                case AAAAA:
                case BBBB:
                  const a = 1
                  break
                case CCC:
                  break
                case DD:
                case E:
                  const b = () => {
                    return 2
                  }
                  break
                default:
                  const c = 3
              }
            `,
          ],
          errors: [
            {
              data: {
                right: 'DD',
                left: 'E',
              },
              messageId: 'unexpectedSwitchCaseOrder',
            },
            {
              data: {
                right: 'CCC',
                left: 'DD',
              },
              messageId: 'unexpectedSwitchCaseOrder',
            },
            {
              data: {
                right: 'BBBB',
                left: 'CCC',
              },
              messageId: 'unexpectedSwitchCaseOrder',
            },
            {
              data: {
                right: 'AAAAA',
                left: 'BBBB',
              },
              messageId: 'unexpectedSwitchCaseOrder',
            },
          ],
          code: dedent`
            switch (x) {
              case E:
              case DD:
                const b = () => {
                  return 2
                }
                break
              case CCC:
                break
              case BBBB:
              case AAAAA:
                const a = 1
                break
              default:
                const c = 3
            }
          `,
          options: [options],
        },
      ],
      valid: [
        {
          code: dedent`
            switch (x) {
              case AAAAA:
              case BBBB:
                const a = 1
                break
              case CCC:
                break
              case DD:
              case E:
                const b = () => {
                  return 2
                }
                break
              default:
                const c = 3
            }
          `,
          options: [options],
        },
      ],
    })

    ruleTester.run(
      `${ruleName}(${type}): works with groups with default`,
      rule,
      {
        invalid: [
          {
            errors: [
              {
                data: {
                  left: 'default',
                  right: 'B',
                },
                messageId: 'unexpectedSwitchCaseOrder',
              },
            ],
            output: dedent`
            switch (x) {
              case 'AA':
              case 'B':
              default:
                break;
            }
          `,
            code: dedent`
            switch (x) {
              case 'AA':
              default:
              case 'B':
                break;
            }
          `,
            options: [options],
          },
        ],
        valid: [
          {
            code: dedent`
            switch (x) {
              case 'AA':
              case 'B':
              default:
                const c = 3
            }
          `,
            options: [options],
          },
        ],
      },
    )
  })

  describe(`${ruleName}: misc`, () => {
    ruleTester.run(`${ruleName}: not works if discriminant is true`, rule, {
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
    })

    ruleTester.run(`${ruleName}: default should be last`, rule, {
      invalid: [
        {
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
          errors: [
            {
              data: {
                left: 'default',
                right: 'b',
              },
              messageId: 'unexpectedSwitchCaseOrder',
            },
          ],
        },
      ],
      valid: [],
    })

    ruleTester.run(
      `${ruleName}: handles default case and default clause`,
      rule,
      {
        invalid: [
          {
            output: dedent`
              switch (variable) {
                case 'add':
                  break
                case 'default':
                  break
                case 'remove':
                  break
                default:
                  break
                }
              `,
            code: dedent`
              switch (variable) {
                case 'default':
                  break
                case 'add':
                  break
                case 'remove':
                  break
                default:
                  break
                }
              `,
            errors: [
              {
                data: {
                  left: 'default',
                  right: 'add',
                },
                messageId: 'unexpectedSwitchCaseOrder',
              },
            ],
          },
        ],
        valid: [
          dedent`
            switch (variable) {
              case 'add':
                break
              case 'default':
                break
              case 'remove':
                break
              default:
                break
              }
            `,
        ],
      },
    )
  })
})
