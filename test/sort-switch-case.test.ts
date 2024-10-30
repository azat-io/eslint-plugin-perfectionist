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
        invalid: [
          {
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

    ruleTester.run(
      `${ruleName}(${type}): sorts switch cases with block statements`,
      rule,
      {
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
        invalid: [
          {
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
            options: [options],
            errors: [
              {
                messageId: 'unexpectedSwitchCaseOrder',
                data: {
                  left: 'c',
                  right: 'b',
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

    ruleTester.run(
      `${ruleName}(${type}): works with grouped cases with default`,
      rule,
      {
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
        invalid: [
          {
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
            options: [options],
            errors: [
              {
                messageId: 'unexpectedSwitchCaseOrder',
                data: {
                  left: 'z',
                  right: 'wwww',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): works with single grouped case`,
      rule,
      {
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
        invalid: [
          {
            code: dedent`
              switch (x) {
                case B:
                case AA:
                  const a = 1;
                  break;
              }
            `,
            output: dedent`
              switch (x) {
                case AA:
                case B:
                  const a = 1;
                  break;
              }
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedSwitchCaseOrder',
                data: {
                  left: 'B',
                  right: 'AA',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(`${ruleName}(${type}): works with complex cases`, rule, {
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
      invalid: [
        {
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
          options: [options],
          errors: [
            {
              messageId: 'unexpectedSwitchCaseOrder',
              data: {
                left: 'E',
                right: 'DD',
              },
            },
            {
              messageId: 'unexpectedSwitchCaseOrder',
              data: {
                left: 'DD',
                right: 'CCC',
              },
            },
            {
              messageId: 'unexpectedSwitchCaseOrder',
              data: {
                left: 'CCC',
                right: 'BBBB',
              },
            },
            {
              messageId: 'unexpectedSwitchCaseOrder',
              data: {
                left: 'BBBB',
                right: 'AAAAA',
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(
      `${ruleName}(${type}): works with groups with default`,
      rule,
      {
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
        invalid: [
          {
            code: dedent`
            switch (x) {
              case 'AA':
              default:
              case 'B':
                break;
            }
          `,
            output: dedent`
            switch (x) {
              case 'AA':
              case 'B':
              default:
                break;
            }
          `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedSwitchCaseOrder',
                data: {
                  left: 'default',
                  right: 'B',
                },
              },
            ],
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

    ruleTester.run(
      `${ruleName}(${type}): sorts inline elements correctly`,
      rule,
      {
        valid: [],
        invalid: [
          {
            code: dedent`
              switch (x) {
                case "b": break; case "a": break
              }
            `,
            output: dedent`
              switch (x) {
                case "a": break; case "b": break;
              }
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedSwitchCaseOrder',
                data: {
                  left: 'b',
                  right: 'a',
                },
              },
            ],
          },
          {
            code: dedent`
              switch (x) {
                case "b": break; case "a": break;
              }
            `,
            output: dedent`
              switch (x) {
                case "a": break; case "b": break;
              }
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedSwitchCaseOrder',
                data: {
                  left: 'b',
                  right: 'a',
                },
              },
            ],
          },
          {
            code: dedent`
              switch (x) {
                case "b": { break } case "a": { break }
              }
            `,
            output: dedent`
              switch (x) {
                case "a": { break }; case "b": { break }
              }
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedSwitchCaseOrder',
                data: {
                  left: 'b',
                  right: 'a',
                },
              },
            ],
          },
          {
            code: dedent`
              switch (x) {
                case "b": { break } case "a": { break };
              }
            `,
            output: dedent`
              switch (x) {
                case "a": { break }; case "b": { break }
              }
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedSwitchCaseOrder',
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

    ruleTester.run(`${ruleName}: handles comments`, rule, {
      valid: [],
      invalid: [
        {
          code: dedent`
            switch (value) {
              case "b": // b
              case "a": // a
                break;
            }
            `,
          output: [
            dedent`
              switch (value) {
                case "a": // a
                case "b": // b
                  break;
              }
              `,
          ],
          options: [{}],
          errors: [
            {
              messageId: 'unexpectedSwitchCaseOrder',
            },
          ],
        },
        {
          code: dedent`
            switch (value) {
              default: // default
              case "a": // a
                break;
            }
            `,
          output: [
            dedent`
              switch (value) {
                case "a": // a
                default: // default
                  break;
              }
              `,
          ],
          options: [{}],
          errors: [
            {
              messageId: 'unexpectedSwitchCaseOrder',
            },
          ],
        },
        {
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
          options: [{}],
          errors: [
            {
              messageId: 'unexpectedSwitchCaseOrder',
              data: {
                left: 'default',
                right: 'x',
              },
            },
            {
              messageId: 'unexpectedSwitchCaseOrder',
              data: {
                left: 'y',
                right: 'x',
              },
            },
            {
              messageId: 'unexpectedSwitchCaseOrder',
              data: {
                left: 'b',
                right: 'a',
              },
            },
          ],
        },
      ],
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
          code: dedent`
            switch(x) {
              default:
                break;
              case "a":
                break;
              case "a":
            }
          `,
          output: dedent`
            switch(x) {
              case "a":
                break;
              default:
                break;
              case "a":
            }
          `,
          options: [{}],
          errors: [
            {
              messageId: 'unexpectedSwitchCaseOrder',
              data: {
                left: 'default',
                right: 'a',
              },
            },
          ],
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

    ruleTester.run(
      `${ruleName}(${type}): sorts switch cases with block statements`,
      rule,
      {
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
        invalid: [
          {
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

    ruleTester.run(
      `${ruleName}(${type}): works with grouped cases with default`,
      rule,
      {
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
        invalid: [
          {
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
            options: [options],
            errors: [
              {
                messageId: 'unexpectedSwitchCaseOrder',
                data: {
                  left: 'z',
                  right: 'wwww',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): works with single grouped case`,
      rule,
      {
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
        invalid: [
          {
            code: dedent`
              switch (x) {
                case B:
                case AA:
                  const a = 1;
                  break;
              }
            `,
            output: dedent`
              switch (x) {
                case AA:
                case B:
                  const a = 1;
                  break;
              }
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedSwitchCaseOrder',
                data: {
                  left: 'B',
                  right: 'AA',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(`${ruleName}(${type}): works with complex cases`, rule, {
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
      invalid: [
        {
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
          options: [options],
          errors: [
            {
              messageId: 'unexpectedSwitchCaseOrder',
              data: {
                left: 'E',
                right: 'DD',
              },
            },
            {
              messageId: 'unexpectedSwitchCaseOrder',
              data: {
                left: 'DD',
                right: 'CCC',
              },
            },
            {
              messageId: 'unexpectedSwitchCaseOrder',
              data: {
                left: 'CCC',
                right: 'BBBB',
              },
            },
            {
              messageId: 'unexpectedSwitchCaseOrder',
              data: {
                left: 'BBBB',
                right: 'AAAAA',
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(
      `${ruleName}(${type}): works with groups with default`,
      rule,
      {
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
        invalid: [
          {
            code: dedent`
            switch (x) {
              case 'AA':
              default:
              case 'B':
                break;
            }
          `,
            output: dedent`
            switch (x) {
              case 'AA':
              case 'B':
              default:
                break;
            }
          `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedSwitchCaseOrder',
                data: {
                  left: 'default',
                  right: 'B',
                },
              },
            ],
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

    ruleTester.run(
      `${ruleName}(${type}): sorts switch cases with block statements`,
      rule,
      {
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
        invalid: [
          {
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

    ruleTester.run(
      `${ruleName}(${type}): works with grouped cases with default`,
      rule,
      {
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
        invalid: [
          {
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
            options: [options],
            errors: [
              {
                messageId: 'unexpectedSwitchCaseOrder',
                data: {
                  left: 'z',
                  right: 'wwww',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): works with single grouped case`,
      rule,
      {
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
        invalid: [
          {
            code: dedent`
              switch (x) {
                case B:
                case AA:
                  const a = 1;
                  break;
              }
            `,
            output: dedent`
              switch (x) {
                case AA:
                case B:
                  const a = 1;
                  break;
              }
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedSwitchCaseOrder',
                data: {
                  left: 'B',
                  right: 'AA',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(`${ruleName}(${type}): works with complex cases`, rule, {
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
      invalid: [
        {
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
          options: [options],
          errors: [
            {
              messageId: 'unexpectedSwitchCaseOrder',
              data: {
                left: 'E',
                right: 'DD',
              },
            },
            {
              messageId: 'unexpectedSwitchCaseOrder',
              data: {
                left: 'DD',
                right: 'CCC',
              },
            },
            {
              messageId: 'unexpectedSwitchCaseOrder',
              data: {
                left: 'CCC',
                right: 'BBBB',
              },
            },
            {
              messageId: 'unexpectedSwitchCaseOrder',
              data: {
                left: 'BBBB',
                right: 'AAAAA',
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(
      `${ruleName}(${type}): works with groups with default`,
      rule,
      {
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
        invalid: [
          {
            code: dedent`
            switch (x) {
              case 'AA':
              default:
              case 'B':
                break;
            }
          `,
            output: dedent`
            switch (x) {
              case 'AA':
              case 'B':
              default:
                break;
            }
          `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedSwitchCaseOrder',
                data: {
                  left: 'default',
                  right: 'B',
                },
              },
            ],
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

  ruleTester.run(`${ruleName}: handles default case and default clause`, rule, {
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
    invalid: [
      {
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
        errors: [
          {
            messageId: 'unexpectedSwitchCaseOrder',
            data: {
              left: 'default',
              right: 'add',
            },
          },
        ],
      },
    ],
  })
})
