import { createRuleTester } from 'eslint-vitest-rule-tester'
import typescriptParser from '@typescript-eslint/parser'
import { describe, expect, it } from 'vitest'
import dedent from 'dedent'

import { validateRuleJsonSchema } from '../utils/validate-rule-json-schema'
import rule from '../../rules/sort-switch-case'
import { Alphabet } from '../../utils/alphabet'

describe('sort-switch-case', () => {
  let { invalid, valid } = createRuleTester({
    name: 'sort-switch-case',
    parser: typescriptParser,
    rule,
  })

  describe('alphabetical', () => {
    let options = {
      type: 'alphabetical',
      order: 'asc',
    } as const

    it('not works if switch-case is not sortable', async () => {
      await valid({
        code: dedent`
          switch(x) {
          }
        `,
        options: [{}],
      })
    })

    it('sorts switch cases with return statements', async () => {
      await valid({
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
      })

      await invalid({
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
            data: { right: 'aaa', left: 'bb' },
            messageId: 'unexpectedSwitchCaseOrder',
          },
        ],
        options: [options],
      })

      await invalid({
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
            data: { right: 'aaa', left: 'bb' },
            messageId: 'unexpectedSwitchCaseOrder',
          },
        ],
        options: [options],
      })
    })

    it('sorts switch cases with break statements', async () => {
      await valid({
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
      })

      await invalid({
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
            data: { right: 'bb', left: 'c' },
            messageId: 'unexpectedSwitchCaseOrder',
          },
        ],
        options: [options],
      })
    })

    it('sorts switch cases with block statements', async () => {
      await valid({
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
      })

      await invalid({
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
            data: { right: 'bb', left: 'c' },
            messageId: 'unexpectedSwitchCaseOrder',
          },
        ],
        options: [options],
      })
    })

    it('sorts switch cases without ending statements', async () => {
      await valid({
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
      })

      await valid({
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
      })

      await valid({
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
      })

      await valid({
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
      })

      await invalid({
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
            data: { right: 'b', left: 'c' },
            messageId: 'unexpectedSwitchCaseOrder',
          },
        ],
        options: [options],
      })
    })

    it('works with grouped cases', async () => {
      await valid({
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
      })

      await invalid({
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
            data: { right: 'cccc', left: 'ee' },
            messageId: 'unexpectedSwitchCaseOrder',
          },
          {
            data: { right: 'bbbbb', left: 'f' },
            messageId: 'unexpectedSwitchCaseOrder',
          },
        ],
        options: [options],
      })
    })

    it('works with grouped cases with default', async () => {
      await valid({
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
      })

      await invalid({
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
            data: { right: 'wwww', left: 'z' },
            messageId: 'unexpectedSwitchCaseOrder',
          },
        ],
        options: [options],
      })
    })

    it('works with single grouped case', async () => {
      await valid({
        code: dedent`
          switch (x) {
            case AA:
            case B:
              const a = 1;
              break;
          }
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            data: { right: 'AA', left: 'B' },
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
      })
    })

    it('works with complex cases', async () => {
      await valid({
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
      })

      await invalid({
        errors: [
          {
            data: { right: 'DD', left: 'E' },
            messageId: 'unexpectedSwitchCaseOrder',
          },
          {
            data: { right: 'CCC', left: 'DD' },
            messageId: 'unexpectedSwitchCaseOrder',
          },
          {
            data: { right: 'BBBB', left: 'CCC' },
            messageId: 'unexpectedSwitchCaseOrder',
          },
          {
            data: { right: 'AAAAA', left: 'BBBB' },
            messageId: 'unexpectedSwitchCaseOrder',
          },
        ],
        output: dedent`
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
      })
    })

    it('works with groups with default', async () => {
      await valid({
        code: dedent`
          switch (x) {
            case 'AA':
            case 'B':
            default:
              const c = 3
          }
        `,
        options: [options],
      })

      await invalid({
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
      })

      await invalid({
        errors: [
          {
            data: { right: 'default', left: 'default' },
            messageId: 'unexpectedSwitchCaseOrder',
          },
          {
            data: { right: 'somethingElse', left: 'default' },
            messageId: 'unexpectedSwitchCaseOrder',
          },
        ],
        output: dedent`
          switch (x) {
            case 'somethingElse':
              break;
            case 'default':
            default:
              break;
          }
        `,
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
      })
    })

    it('allows to trim special characters', async () => {
      await valid({
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
      })
    })

    it('allows to remove special characters', async () => {
      await valid({
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
      })
    })

    it('allows to use locale', async () => {
      await valid({
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
      })
    })

    it('sorts inline elements correctly', async () => {
      await invalid({
        errors: [
          {
            data: { right: 'a', left: 'b' },
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
      })

      await invalid({
        errors: [
          {
            data: { right: 'a', left: 'b' },
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
      })

      await invalid({
        errors: [
          {
            data: { right: 'a', left: 'b' },
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
      })

      await invalid({
        errors: [
          {
            data: { right: 'a', left: 'b' },
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
      })
    })

    it('handles comments', async () => {
      await invalid({
        output: dedent`
          switch (value) {
            case "a": // a
            case "b": // b
              break;
          }
        `,
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
      })

      await invalid({
        output: dedent`
          switch (value) {
            case "a": // a
            default: // default
              break;
          }
        `,
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
      })

      await invalid({
        errors: [
          {
            data: {
              left: 'default',
              right: 'x',
            },
            messageId: 'unexpectedSwitchCaseOrder',
          },
          {
            data: { right: 'x', left: 'y' },
            messageId: 'unexpectedSwitchCaseOrder',
          },
          {
            data: { right: 'a', left: 'b' },
            messageId: 'unexpectedSwitchCaseOrder',
          },
        ],
        output: dedent`
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
      })
    })

    it('handles last case without break', async () => {
      await valid({
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
      })

      await valid({
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
      })

      await valid({
        code: dedent`
          switch(x) {
            case "b":
              break
            case "a":
              let a
          }
        `,
        options: [{}],
      })

      await valid({
        code: dedent`
          switch(x) {
            default:
              break;
            case "a":
              let a
          }
        `,
        options: [{}],
      })

      await invalid({
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
      })
    })
  })

  describe('natural', () => {
    let options = {
      type: 'natural',
      order: 'asc',
    } as const

    it('sorts switch cases with return statements', async () => {
      await valid({
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
      })

      await invalid({
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
            data: { right: 'aaa', left: 'bb' },
            messageId: 'unexpectedSwitchCaseOrder',
          },
        ],
        options: [options],
      })

      await invalid({
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
            data: { right: 'aaa', left: 'bb' },
            messageId: 'unexpectedSwitchCaseOrder',
          },
        ],
        options: [options],
      })
    })

    it('sorts switch cases with break statements', async () => {
      await valid({
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
      })

      await invalid({
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
            data: { right: 'bb', left: 'c' },
            messageId: 'unexpectedSwitchCaseOrder',
          },
        ],
        options: [options],
      })
    })

    it('sorts switch cases with block statements', async () => {
      await valid({
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
      })

      await invalid({
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
            data: { right: 'bb', left: 'c' },
            messageId: 'unexpectedSwitchCaseOrder',
          },
        ],
        options: [options],
      })
    })

    it('sorts switch cases without ending statements', async () => {
      await valid({
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
      })

      await valid({
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
      })

      await valid({
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
      })

      await valid({
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
      })

      await invalid({
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
            data: { right: 'b', left: 'c' },
            messageId: 'unexpectedSwitchCaseOrder',
          },
        ],
        options: [options],
      })
    })

    it('works with grouped cases', async () => {
      await valid({
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
      })

      await invalid({
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
            data: { right: 'cccc', left: 'ee' },
            messageId: 'unexpectedSwitchCaseOrder',
          },
          {
            data: { right: 'bbbbb', left: 'f' },
            messageId: 'unexpectedSwitchCaseOrder',
          },
        ],
        options: [options],
      })
    })

    it('works with grouped cases with default', async () => {
      await valid({
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
      })

      await invalid({
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
            data: { right: 'wwww', left: 'z' },
            messageId: 'unexpectedSwitchCaseOrder',
          },
        ],
        options: [options],
      })
    })

    it('works with single grouped case', async () => {
      await valid({
        code: dedent`
          switch (x) {
            case AA:
            case B:
              const a = 1;
              break;
          }
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            data: { right: 'AA', left: 'B' },
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
      })
    })

    it('works with complex cases', async () => {
      await valid({
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
      })

      await invalid({
        errors: [
          {
            data: { right: 'DD', left: 'E' },
            messageId: 'unexpectedSwitchCaseOrder',
          },
          {
            data: { right: 'CCC', left: 'DD' },
            messageId: 'unexpectedSwitchCaseOrder',
          },
          {
            data: { right: 'BBBB', left: 'CCC' },
            messageId: 'unexpectedSwitchCaseOrder',
          },
          {
            data: { right: 'AAAAA', left: 'BBBB' },
            messageId: 'unexpectedSwitchCaseOrder',
          },
        ],
        output: dedent`
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
      })
    })

    it('works with groups with default', async () => {
      await valid({
        code: dedent`
          switch (x) {
            case 'AA':
            case 'B':
            default:
              const c = 3
          }
        `,
        options: [options],
      })

      await invalid({
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
      })

      await invalid({
        errors: [
          {
            data: { right: 'default', left: 'default' },
            messageId: 'unexpectedSwitchCaseOrder',
          },
          {
            data: { right: 'somethingElse', left: 'default' },
            messageId: 'unexpectedSwitchCaseOrder',
          },
        ],
        output: dedent`
          switch (x) {
            case 'somethingElse':
              break;
            case 'default':
            default:
              break;
          }
        `,
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
      })
    })

    it('allows to trim special characters', async () => {
      await valid({
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
      })
    })

    it('allows to remove special characters', async () => {
      await valid({
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
      })
    })

    it('allows to use locale', async () => {
      await valid({
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
      })
    })

    it('sorts inline elements correctly', async () => {
      await invalid({
        errors: [
          {
            data: { right: 'a', left: 'b' },
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
      })

      await invalid({
        errors: [
          {
            data: { right: 'a', left: 'b' },
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
      })

      await invalid({
        errors: [
          {
            data: { right: 'a', left: 'b' },
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
      })

      await invalid({
        errors: [
          {
            data: { right: 'a', left: 'b' },
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
      })
    })

    it('handles comments', async () => {
      await invalid({
        output: dedent`
          switch (value) {
            case "a": // a
            case "b": // b
              break;
          }
        `,
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
      })

      await invalid({
        output: dedent`
          switch (value) {
            case "a": // a
            default: // default
              break;
          }
        `,
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
      })

      await invalid({
        errors: [
          {
            data: {
              left: 'default',
              right: 'x',
            },
            messageId: 'unexpectedSwitchCaseOrder',
          },
          {
            data: { right: 'x', left: 'y' },
            messageId: 'unexpectedSwitchCaseOrder',
          },
          {
            data: { right: 'a', left: 'b' },
            messageId: 'unexpectedSwitchCaseOrder',
          },
        ],
        output: dedent`
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
      })
    })

    it('handles last case without break', async () => {
      await valid({
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
      })

      await valid({
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
      })

      await valid({
        code: dedent`
          switch(x) {
            case "b":
              break
            case "a":
              let a
          }
        `,
        options: [{}],
      })

      await valid({
        code: dedent`
          switch(x) {
            default:
              break;
            case "a":
              let a
          }
        `,
        options: [{}],
      })

      await invalid({
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
      })
    })
  })

  describe('line-length', () => {
    let options = {
      type: 'line-length',
      order: 'desc',
    } as const

    it('sorts switch cases with return statements', async () => {
      await valid({
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
      })

      await invalid({
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
            data: { right: 'aaa', left: 'bb' },
            messageId: 'unexpectedSwitchCaseOrder',
          },
        ],
        options: [options],
      })

      await invalid({
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
            data: { right: 'aaa', left: 'bb' },
            messageId: 'unexpectedSwitchCaseOrder',
          },
        ],
        options: [options],
      })
    })

    it('sorts switch cases with break statements', async () => {
      await valid({
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
      })

      await invalid({
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
            data: { right: 'bb', left: 'c' },
            messageId: 'unexpectedSwitchCaseOrder',
          },
        ],
        options: [options],
      })
    })

    it('sorts switch cases with block statements', async () => {
      await valid({
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
      })

      await invalid({
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
            data: { right: 'bb', left: 'c' },
            messageId: 'unexpectedSwitchCaseOrder',
          },
        ],
        options: [options],
      })
    })

    it('sorts switch cases without ending statements', async () => {
      await valid({
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
      })

      await valid({
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
      })

      await valid({
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
      })

      await valid({
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
      })

      await invalid({
        output: dedent`
          function func(name) {
            switch(name) {
              case 'bb':
                let b
                break
              case 'c':
                let c
                break
              case 'aaa':
            }
          }
        `,
        code: dedent`
          function func(name) {
            switch(name) {
              case 'c':
                let c
                break
              case 'bb':
                let b
                break
              case 'aaa':
            }
          }
        `,
        errors: [
          {
            data: { right: 'bb', left: 'c' },
            messageId: 'unexpectedSwitchCaseOrder',
          },
        ],
        options: [options],
      })
    })

    it('works with grouped cases', async () => {
      await valid({
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
      })

      await invalid({
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
            data: { right: 'cccc', left: 'ee' },
            messageId: 'unexpectedSwitchCaseOrder',
          },
          {
            data: { right: 'bbbbb', left: 'f' },
            messageId: 'unexpectedSwitchCaseOrder',
          },
        ],
        options: [options],
      })
    })

    it('works with grouped cases with default', async () => {
      await valid({
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
      })

      await invalid({
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
            data: { right: 'wwww', left: 'z' },
            messageId: 'unexpectedSwitchCaseOrder',
          },
        ],
        options: [options],
      })
    })

    it('works with single grouped case', async () => {
      await valid({
        code: dedent`
          switch (x) {
            case AA:
            case B:
              const a = 1;
              break;
          }
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            data: { right: 'AA', left: 'B' },
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
      })
    })

    it('works with complex cases', async () => {
      await valid({
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
      })

      await invalid({
        errors: [
          {
            data: { right: 'DD', left: 'E' },
            messageId: 'unexpectedSwitchCaseOrder',
          },
          {
            data: { right: 'CCC', left: 'DD' },
            messageId: 'unexpectedSwitchCaseOrder',
          },
          {
            data: { right: 'BBBB', left: 'CCC' },
            messageId: 'unexpectedSwitchCaseOrder',
          },
          {
            data: { right: 'AAAAA', left: 'BBBB' },
            messageId: 'unexpectedSwitchCaseOrder',
          },
        ],
        output: dedent`
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
      })
    })

    it('works with groups with default', async () => {
      await valid({
        code: dedent`
          switch (x) {
            case 'AA':
            case 'B':
            default:
              const c = 3
          }
        `,
        options: [options],
      })

      await invalid({
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
      })

      await invalid({
        errors: [
          {
            data: { right: 'default', left: 'default' },
            messageId: 'unexpectedSwitchCaseOrder',
          },
          {
            data: { right: 'somethingElse', left: 'default' },
            messageId: 'unexpectedSwitchCaseOrder',
          },
        ],
        output: dedent`
          switch (x) {
            case 'somethingElse':
              break;
            case 'default':
            default:
              break;
          }
        `,
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
      })
    })

    it('allows to trim special characters', async () => {
      await valid({
        code: dedent`
          switch (x) {
            case '_aa':
            case 'bb':
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
      })
    })

    it('allows to remove special characters', async () => {
      await valid({
        code: dedent`
          switch (x) {
            case 'abcd':
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
      })
    })

    it('allows to use locale', async () => {
      await valid({
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
      })
    })

    it('sorts inline elements correctly', async () => {
      await invalid({
        errors: [
          {
            data: { right: 'aa', left: 'b' },
            messageId: 'unexpectedSwitchCaseOrder',
          },
        ],
        output: dedent`
          switch (x) {
            case "aa": break; case "b": break;
          }
        `,
        code: dedent`
          switch (x) {
            case "b": break; case "aa": break
          }
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            data: { right: 'aa', left: 'b' },
            messageId: 'unexpectedSwitchCaseOrder',
          },
        ],
        output: dedent`
          switch (x) {
            case "aa": break; case "b": break;
          }
        `,
        code: dedent`
          switch (x) {
            case "b": break; case "aa": break;
          }
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            data: { right: 'aa', left: 'b' },
            messageId: 'unexpectedSwitchCaseOrder',
          },
        ],
        output: dedent`
          switch (x) {
            case "aa": { break }; case "b": { break }
          }
        `,
        code: dedent`
          switch (x) {
            case "b": { break } case "aa": { break }
          }
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            data: { right: 'aa', left: 'b' },
            messageId: 'unexpectedSwitchCaseOrder',
          },
        ],
        output: dedent`
          switch (x) {
            case "aa": { break }; case "b": { break }
          }
        `,
        code: dedent`
          switch (x) {
            case "b": { break } case "aa": { break };
          }
        `,
        options: [options],
      })
    })

    it('handles comments', async () => {
      await invalid({
        output: dedent`
          switch (value) {
            case "a": // a
            case "b": // b
              break;
          }
        `,
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
      })

      await invalid({
        output: dedent`
          switch (value) {
            case "a": // a
            default: // default
              break;
          }
        `,
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
      })

      await invalid({
        errors: [
          {
            data: {
              left: 'default',
              right: 'x',
            },
            messageId: 'unexpectedSwitchCaseOrder',
          },
          {
            data: { right: 'x', left: 'y' },
            messageId: 'unexpectedSwitchCaseOrder',
          },
          {
            data: { right: 'a', left: 'b' },
            messageId: 'unexpectedSwitchCaseOrder',
          },
        ],
        output: dedent`
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
      })
    })

    it('handles last case without break', async () => {
      await valid({
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
      })

      await valid({
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
      })

      await valid({
        code: dedent`
          switch(x) {
            case "b":
              break
            case "a":
              let a
          }
        `,
        options: [{}],
      })

      await valid({
        code: dedent`
          switch(x) {
            default:
              break;
            case "a":
              let a
          }
        `,
        options: [{}],
      })

      await invalid({
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
      })
    })
  })

  describe('custom', () => {
    let alphabet = Alphabet.generateRecommendedAlphabet()
      .sortByLocaleCompare('en-US')
      .getCharacters()

    let options = {
      type: 'custom',
      order: 'asc',
      alphabet,
    } as const

    it('works with grouped cases', async () => {
      await valid({
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
      })

      await invalid({
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
            data: { right: 'cccc', left: 'ee' },
            messageId: 'unexpectedSwitchCaseOrder',
          },
          {
            data: { right: 'bbbbb', left: 'f' },
            messageId: 'unexpectedSwitchCaseOrder',
          },
        ],
        options: [options],
      })
    })
  })

  describe('unsorted', () => {
    let options = {
      type: 'unsorted',
      order: 'asc',
    } as const

    it('does not enforce sorting', async () => {
      await valid({
        code: dedent`
          switch (x) {
            case 'b':
              break;
            case 'c':
              break;
            case 'a':
              break;
          }
        `,
        options: [options],
      })

      await valid({
        code: dedent`
          switch (x) {
            case 'b':
            case 'c':
            case 'a':
              break;
          }
        `,
        options: [options],
      })
    })
  })

  describe('misc', () => {
    it('validates the JSON schema', async () => {
      await expect(
        validateRuleJsonSchema(rule.meta.schema),
      ).resolves.not.toThrow()
    })

    it('not works if discriminant is true', async () => {
      await valid({
        code: dedent`
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
      })
    })

    it('default should be last', async () => {
      await invalid({
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
      })
    })

    it('handles default case and default clause', async () => {
      await valid({
        code: dedent`
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
      })

      await invalid({
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
      })
    })
  })
})
