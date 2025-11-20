/* Cspell:ignore gimsu igmus yusmig ysumgi zyxabc Ωmega Δelta */

import { createRuleTester } from 'eslint-vitest-rule-tester'
import typescriptParser from '@typescript-eslint/parser'
import { describe, expect, it } from 'vitest'
import dedent from 'dedent'

import { validateRuleJsonSchema } from '../utils/validate-rule-json-schema'
import { Alphabet } from '../../utils/alphabet'
import rule from '../../rules/sort-regexp'

describe('sort-regexp', () => {
  let { invalid, valid } = createRuleTester({
    parser: typescriptParser,
    name: 'sort-regexp',
    rule,
  })

  describe('alphabetical', () => {
    let options = {
      type: 'alphabetical',
      order: 'asc',
    } as const

    it('sorts regex flags', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedRegExpOrder',
            data: { right: 'g', left: 'i' },
          },
        ],
        output: dedent`
          /pattern/gimsu
        `,
        code: dedent`
          /pattern/igmus
        `,
        options: [options],
      })
    })

    it('keeps already sorted flags', async () => {
      await valid({
        code: dedent`
          /pattern/gim
        `,
        options: [options],
      })
    })

    it('ignores non-regex literals', async () => {
      await valid({
        code: dedent`
          const sample = 'not a regular expression';
        `,
        options: [options],
      })
    })

    it('sorts various flag combinations', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedRegExpOrder',
            data: { right: 's', left: 'y' },
          },
        ],
        output: dedent`
          /test/gimsuy
        `,
        code: dedent`
          /test/ysumgi
        `,
        options: [options],
      })
    })

    it('sorts single letter flags', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedRegExpOrder',
            data: { right: 'i', left: 'm' },
          },
        ],
        output: dedent`
          /(abc)/im
        `,
        code: dedent`
          /(abc)/mi
        `,
        options: [options],
      })
    })

    it('honors desc order for flags', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedRegExpOrder',
            data: { right: 'i', left: 'g' },
          },
        ],
        options: [
          {
            ...options,
            order: 'desc',
          },
        ],
        output: dedent`
          /pattern/yusmig
        `,
        code: dedent`
          /pattern/gimsuy
        `,
      })
    })

    it('sorts characters in character class', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedRegExpOrder',
            data: { right: 'a', left: 'z' },
          },
        ],
        output: dedent`
          /[axz]/
        `,
        code: dedent`
          /[zxa]/
        `,
        options: [options],
      })
    })

    it('keeps escape sequences intact when sorting character classes', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedRegExpOrder',
          },
        ],
        output: dedent(String.raw`
          const re = /[,?.()[\]{}*\\\s#^+|$-]/g;
        `),
        code: dedent(String.raw`
          const re = /[-[\]{}()*+?.,\\^$|#\s]/g;
        `),
        options: [options],
      })
    })

    it('sorts character classes with ranges', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedRegExpOrder',
            data: { right: '0-9', left: 'z' },
          },
        ],
        output: dedent`
          /[0-9a-fz]/
        `,
        code: dedent`
          /[z0-9a-f]/
        `,
        options: [options],
      })
    })

    it('sorts mixed character class elements', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedRegExpOrder',
            data: { right: '0-9', left: 'z' },
          },
        ],
        output: dedent`
          /[0-9A-Za-fz]/
        `,
        code: dedent`
          /[z0-9a-fA-Z]/
        `,
        options: [options],
      })
    })

    it('keeps already sorted character classes', async () => {
      await valid({
        code: dedent`
          /[0-9A-Za-z]/
        `,
        options: [options],
      })
    })

    it('sorts character classes with special chars', async () => {
      await invalid({
        errors: [
          {
            data: { right: String.raw`\d`, left: String.raw`\w` },
            messageId: 'unexpectedRegExpOrder',
          },
        ],
        output: dedent(String.raw`
            /[\d\w\s]/
          `),
        code: dedent(String.raw`
            /[\w\d\s]/
          `),
        options: [options],
      })
    })

    it('sorts character classes with equivalent elements', async () => {
      await invalid({
        errors: [
          {
            data: { right: String.raw`\x61`, left: 'a' },
            messageId: 'unexpectedRegExpOrder',
          },
        ],
        output: dedent(String.raw`
          /[\x61a]/
        `),
        code: dedent(String.raw`
          /[a\x61]/
        `),
        options: [options],
      })
    })

    it('sorts character classes with ignoreCase disabled', async () => {
      let customOptions = {
        ...options,
        ignoreCase: false,
      } as const

      await invalid({
        errors: [
          {
            messageId: 'unexpectedRegExpOrder',
          },
        ],
        output: dedent(String.raw`
          /[\x61a]/
        `),
        code: dedent(String.raw`
          /[a\x61]/
        `),
        options: [customOptions],
      })
    })

    it('sorts character classes with descending order', async () => {
      let customOptions = {
        ...options,
        order: 'desc',
      } as const

      await invalid({
        errors: [
          {
            messageId: 'unexpectedRegExpOrder',
          },
        ],
        output: dedent(String.raw`
          /[a\x61]/
        `),
        code: dedent(String.raw`
          /[\x61a]/
        `),
        options: [customOptions],
      })
    })

    it('sorts character classes with standalone digits', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedRegExpOrder',
            data: { right: '1', left: '3' },
          },
        ],
        output: dedent`
          /[123]/
        `,
        code: dedent`
          /[312]/
        `,
        options: [options],
      })
    })

    it('sorts character classes with uppercase letters', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedRegExpOrder',
            data: { right: 'A', left: 'C' },
          },
        ],
        output: dedent`
          /[ABC]/
        `,
        code: dedent`
          /[CBA]/
        `,
        options: [options],
      })
    })

    it('sorts character classes with astral characters', async () => {
      await invalid({
        errors: [
          {
            data: {
              right: String.raw`\u{1F600}-\u{1F602}`,
              left: String.raw`\u{1F603}`,
            },
            messageId: 'unexpectedRegExpOrder',
          },
        ],
        output: dedent(String.raw`
            /[\u{1F600}-\u{1F602}\u{1F603}]/u
          `),
        code: dedent(String.raw`
            /[\u{1F603}\u{1F600}-\u{1F602}]/u
          `),
        options: [options],
      })
    })

    it('sorts negated character classes', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedRegExpOrder',
            data: { right: 'a', left: 'z' },
          },
        ],
        output: dedent`
          /[^axz]/
        `,
        code: dedent`
          /[^zxa]/
        `,
        options: [options],
      })
    })

    it('honors desc order in character classes', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedRegExpOrder',
            data: { right: 'z', left: 'a' },
          },
        ],
        options: [
          {
            ...options,
            order: 'desc',
          },
        ],
        output: dedent`
          /[za90]/
        `,
        code: dedent`
          /[az09]/
        `,
      })
    })

    it('sorts character class inside groups', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedRegExpOrder',
            data: { right: 'a', left: 'c' },
          },
        ],
        output: dedent`
          /([abc]+)/
        `,
        code: dedent`
          /([cba]+)/
        `,
        options: [options],
      })
    })

    it('sorts multiple character classes in regex', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedRegExpOrder',
            data: { right: 'a', left: 'z' },
          },
          {
            messageId: 'unexpectedRegExpOrder',
            data: { right: '1', left: '3' },
          },
        ],
        output: dedent`
          /[axz].*[123]/
        `,
        code: dedent`
          /[zxa].*[321]/
        `,
        options: [options],
      })
    })

    it('keeps single character in character class', async () => {
      await valid({
        code: dedent`
          /[a]/
        `,
        options: [options],
      })
    })

    it('keeps empty character class', async () => {
      await valid({
        code: dedent`
          /[]/
        `,
        options: [options],
      })
    })

    it('sorts regex literal in variable declaration', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedRegExpOrder',
            data: { right: 'b', left: 'c' },
          },
          {
            messageId: 'unexpectedRegExpOrder',
            data: { right: 'a', left: 'b' },
          },
        ],
        output: dedent`
          const re = /(a|b|c)/;
        `,
        code: dedent`
          const re = /(c|b|a)/;
        `,
        options: [options],
      })
    })

    it('sorts regex literal inside function call', async () => {
      await invalid({
        errors: [
          {
            data: { right: 'apple', left: 'pear' },
            messageId: 'unexpectedRegExpOrder',
          },
        ],
        output: dedent`
          test(/(apple|orange|pear)/);
        `,
        code: dedent`
          test(/(pear|apple|orange)/);
        `,
        options: [options],
      })
    })

    it('keeps already sorted alternatives', async () => {
      await valid({
        code: dedent`
          /(aaa|bb|c)/gi
        `,
        options: [options],
      })
    })

    it('sorts plain alternations', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedRegExpOrder',
            data: { right: 'aaa', left: 'c' },
          },
        ],
        output: dedent`
          /(aaa|bb|c)/
        `,
        code: dedent`
          /(c|aaa|bb)/
        `,
        options: [options],
      })
    })

    it('sorts named capturing group alternatives with ignoreAlias false', async () => {
      await invalid({
        errors: [
          {
            data: { right: 'a: (?<a>aaa)', left: 'b: bbb' },
            messageId: 'unexpectedRegExpOrder',
          },
        ],
        output: dedent`
          /(?<b>(?<a>aaa)|bbb)/
        `,
        code: dedent`
          /(?<b>bbb|(?<a>aaa))/
        `,
        options: [options],
      })
    })

    it('ignores alias names when ignoreAlias is true', async () => {
      await invalid({
        errors: [
          {
            data: { right: '(?<a>a)', left: 'b' },
            messageId: 'unexpectedRegExpOrder',
          },
        ],
        options: [
          {
            ...options,
            ignoreAlias: true,
          },
        ],
        output: dedent`
          /(?<b>(?<a>a)|b)/
        `,
        code: dedent`
          /(?<b>b|(?<a>a))/
        `,
      })
    })

    it('respects custom groups by alias name', async () => {
      await invalid({
        errors: [
          {
            data: {
              right: String.raw`digit: (?<digit>\d)`,
              leftGroup: 'unknown',
              rightGroup: 'digits',
              left: 'other: z',
            },
            messageId: 'unexpectedRegExpOrder',
          },
        ],
        options: [
          {
            ...options,
            customGroups: [
              {
                elementNamePattern: '^digit$',
                groupName: 'digits',
              },
            ],
            groups: ['digits', 'unknown'],
          },
        ],
        output: dedent`
          /(?<other>(?<digit>\d)|z)/
        `,
        code: dedent`
          /(?<other>z|(?<digit>\d))/
        `,
      })
    })

    it('skips sorting alternatives with shadowed numbers', async () => {
      await valid({
        code: dedent`
          /(20|1|10|2|3)/
        `,
        options: [options],
      })
    })

    it('does not reorder alternatives when negated character class overlaps literal', async () => {
      await valid({
        code: dedent`
          /(?:\([^)]*\)|[^;])+/
        `,
        options: [options],
      })
    })

    it('does not reorder @import alternatives with greedy negated class', async () => {
      await valid({
        code: dedent(String.raw`
          /@import(?:\s*url\([^)]*\).*?|[^;]*);/
        `),
        options: [options],
      })
    })

    it('does not reorder alternatives when character class overlaps multi-character sequence', async () => {
      await valid({
        code: dedent(String.raw`
          /\r\n|[\r\n\u2028\u2029]/
        `),
        options: [options],
      })
    })

    it('does not reorder alternatives when optional sequence overlaps character class', async () => {
      await valid({
        code: dedent(String.raw`
          /\r?\n|[\r\n]/
        `),
        options: [options],
      })
    })

    it('sorts alternatives with special characters', async () => {
      await invalid({
        errors: [
          {
            data: { right: '!@#', left: 'abc' },
            messageId: 'unexpectedRegExpOrder',
          },
          {
            data: { right: '&*', left: '$%^' },
            messageId: 'unexpectedRegExpOrder',
          },
        ],
        output: dedent`
          /(!@#|&*|$%^|abc)/
        `,
        code: dedent`
          /(abc|!@#|$%^|&*)/
        `,
        options: [options],
      })
    })

    it('skips sorting when empty alternative can shadow others', async () => {
      await valid({
        code: dedent`
          /(b||a)/
        `,
        options: [options],
      })
    })

    it('skips sorting when alternatives contain unnamed capturing groups', async () => {
      await valid({
        code: dedent`
          const regex = /\\(.)|(['"])/gsu;
        `,
        options: [options],
      })
    })

    it('sorts alternatives with escaped characters', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedRegExpOrder',
            data: { right: 'aa', left: 'bb' },
          },
        ],
        output: dedent`
          /(aa|bb|cc)/
        `,
        code: dedent`
          /(bb|aa|cc)/
        `,
        options: [options],
      })
    })

    it('sorts alternatives with character classes', async () => {
      await valid({
        code: dedent`
          /([0-9]|[A-Z]|[a-z])/
        `,
        options: [options],
      })
    })

    it('sorts alternatives with quantifiers', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedRegExpOrder',
            data: { right: 'a+', left: 'b*' },
          },
          {
            messageId: 'unexpectedRegExpOrder',
            data: { right: 'a?', left: 'a+' },
          },
        ],
        output: dedent`
          /(a?|a{2,4}|a+|b*)/
        `,
        code: dedent`
          /(b*|a+|a?|a{2,4})/
        `,
        options: [options],
      })
    })

    it('sorts alternatives with word boundaries', async () => {
      await invalid({
        errors: [
          {
            data: { right: String.raw`\\bcat\\b`, left: String.raw`\\bdog\\b` },
            messageId: 'unexpectedRegExpOrder',
          },
        ],
        output: dedent`
          /(\\bcat\\b|\\bdog\\b)/
        `,
        code: dedent`
          /(\\bdog\\b|\\bcat\\b)/
        `,
        options: [options],
      })
    })

    it('sorts alternatives with unicode characters', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedRegExpOrder',
            data: { right: 'A', left: 'B' },
          },
        ],
        output: dedent`
          /(A|B|C)/u
        `,
        code: dedent`
          /(B|A|C)/u
        `,
        options: [options],
      })
    })

    it('sorts alternatives with lookahead assertions', async () => {
      await invalid({
        errors: [
          {
            data: { right: '(?=a)', left: '(?=b)' },
            messageId: 'unexpectedRegExpOrder',
          },
        ],
        output: dedent`
          /((?=a)|(?=b)|(?=c))/
        `,
        code: dedent`
          /((?=b)|(?=a)|(?=c))/
        `,
        options: [options],
      })
    })

    it('sorts alternatives with negative lookahead', async () => {
      await invalid({
        errors: [
          {
            data: { right: '(?!a)', left: '(?!b)' },
            messageId: 'unexpectedRegExpOrder',
          },
        ],
        output: dedent`
          /((?!a)|(?!b)|(?!c))/
        `,
        code: dedent`
          /((?!b)|(?!a)|(?!c))/
        `,
        options: [options],
      })
    })

    it('sorts alternatives with lookbehind assertions', async () => {
      await invalid({
        errors: [
          {
            data: { right: '(?<=a)', left: '(?<=b)' },
            messageId: 'unexpectedRegExpOrder',
          },
        ],
        output: dedent`
          /((?<=a)|(?<=b)|(?<=c))/
        `,
        code: dedent`
          /((?<=b)|(?<=a)|(?<=c))/
        `,
        options: [options],
      })
    })

    it('sorts alternatives with mixed metacharacters', async () => {
      await invalid({
        errors: [
          {
            data: { right: '^start', left: 'end$' },
            messageId: 'unexpectedRegExpOrder',
          },
        ],
        output: dedent`
          /(^start|end$|middle)/
        `,
        code: dedent`
          /(end$|^start|middle)/
        `,
        options: [options],
      })
    })

    it('skips alternatives with dot wildcard to avoid shadowing', async () => {
      await valid({
        code: dedent`
          /(specific|.+|.*|.?)/
        `,
        options: [options],
      })
    })

    it('skips sorting when alternatives are unnamed capturing groups', async () => {
      await valid({
        code: dedent`
          /((c|d)|(a|b)|(e|f))/
        `,
        options: [options],
      })
    })

    it('sorts complex nested groups', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedRegExpOrder',
            data: { right: 'a', left: 'b' },
          },
        ],
        output: dedent`
          /(a|b|c)/
        `,
        code: dedent`
          /(b|a|c)/
        `,
        options: [options],
      })
    })

    it('sorts alternatives with flags preserved', async () => {
      await invalid({
        errors: [
          {
            data: { left: 'BANANA', right: 'APPLE' },
            messageId: 'unexpectedRegExpOrder',
          },
        ],
        output: dedent`
          /(APPLE|BANANA|CHERRY)/gim
        `,
        code: dedent`
          /(BANANA|APPLE|CHERRY)/gim
        `,
        options: [options],
      })
    })

    it('sorts many alternatives', async () => {
      await invalid({
        errors: [
          {
            data: { right: 'alpha', left: 'beta' },
            messageId: 'unexpectedRegExpOrder',
          },
          {
            data: { right: 'epsilon', left: 'gamma' },
            messageId: 'unexpectedRegExpOrder',
          },
          {
            data: { right: 'eta', left: 'zeta' },
            messageId: 'unexpectedRegExpOrder',
          },
          {
            data: { right: 'iota', left: 'theta' },
            messageId: 'unexpectedRegExpOrder',
          },
          {
            data: { right: 'omega', left: 'xi' },
            messageId: 'unexpectedRegExpOrder',
          },
          {
            data: { right: 'phi', left: 'tau' },
            messageId: 'unexpectedRegExpOrder',
          },
        ],
        output: dedent`
          /(alpha|beta|delta|epsilon|eta|gamma|iota|kappa|lambda|mu|nu|omega|phi|pi|psi|rho|sigma|tau|theta|xi|zeta)/
        `,
        code: dedent`
          /(beta|alpha|delta|gamma|epsilon|zeta|eta|theta|iota|kappa|lambda|mu|nu|xi|omega|pi|rho|sigma|tau|phi|psi)/
        `,
        options: [options],
      })
    })

    it('sorts alternatives with backreferences', async () => {
      await valid({
        code: dedent`
          /(a+|b+|c+)/
        `,
        options: [options],
      })
    })

    it('sorts alternatives with named backreferences', async () => {
      await valid({
        code: dedent`
          /(aa|bb|cc)/
        `,
        options: [options],
      })
    })

    it('sorts alternatives inside single group without affecting backreference', async () => {
      await invalid({
        errors: [
          {
            data: { right: 'cat', left: 'dog' },
            messageId: 'unexpectedRegExpOrder',
          },
        ],
        output: dedent(String.raw`
          /(cat|dog)\s\1/
        `),
        code: dedent(String.raw`
          /(dog|cat)\s\1/
        `),
        options: [options],
      })
    })

    it('does not sort when multiple groups exist with backreferences', async () => {
      await valid({
        code: dedent(String.raw`
          /(c)(b)(a)\1\2\3/
        `),
        options: [options],
      })
    })

    it('sorts alternatives with named group backreferences', async () => {
      await invalid({
        errors: [
          {
            data: { right: 'pet: cat', left: 'pet: dog' },
            messageId: 'unexpectedRegExpOrder',
          },
        ],
        output: dedent(String.raw`
          /(?<pet>cat|dog)\s\k<pet>/
        `),
        code: dedent(String.raw`
          /(?<pet>dog|cat)\s\k<pet>/
        `),
        options: [options],
      })
    })

    it('sorts alternatives with non-capturing groups', async () => {
      await invalid({
        errors: [
          {
            data: { right: '(?:aaa)', left: '(?:bbb)' },
            messageId: 'unexpectedRegExpOrder',
          },
        ],
        output: dedent`
          /((?:aaa)|(?:bbb)|(?:ccc))/
        `,
        code: dedent`
          /((?:bbb)|(?:aaa)|(?:ccc))/
        `,
        options: [options],
      })
    })

    it('sorts alternatives with control characters', async () => {
      await invalid({
        errors: [
          {
            data: { right: String.raw`\\cA`, left: String.raw`\\cB` },
            messageId: 'unexpectedRegExpOrder',
          },
        ],
        output: dedent`
          /(\\cA|\\cB|\\cC)/
        `,
        code: dedent`
          /(\\cB|\\cA|\\cC)/
        `,
        options: [options],
      })
    })

    it('sorts alternatives with octal escapes', async () => {
      await invalid({
        errors: [
          {
            data: { right: String.raw`\\101`, left: String.raw`\\102` },
            messageId: 'unexpectedRegExpOrder',
          },
        ],
        output: dedent`
          /(\\101|\\102|\\103)/
        `,
        code: dedent`
          /(\\102|\\101|\\103)/
        `,
        options: [options],
      })
    })

    it('sorts alternatives with hex escapes', async () => {
      await invalid({
        errors: [
          {
            data: { right: String.raw`\\x41`, left: String.raw`\\x42` },
            messageId: 'unexpectedRegExpOrder',
          },
        ],
        output: dedent`
          /(\\x41|\\x42|\\x43)/
        `,
        code: dedent`
          /(\\x42|\\x41|\\x43)/
        `,
        options: [options],
      })
    })

    it('sorts alternatives with whitespace characters', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedRegExpOrder',
            data: { right: 'a', left: 'b' },
          },
        ],
        output: dedent`
          /(a|b|c)/
        `,
        code: dedent`
          /(b|a|c)/
        `,
        options: [options],
      })
    })

    it('sorts alternatives with digit and word shortcuts', async () => {
      await invalid({
        errors: [
          {
            data: { right: String.raw`\\d`, left: String.raw`\\w` },
            messageId: 'unexpectedRegExpOrder',
          },
          {
            data: { right: String.raw`\\D`, left: String.raw`\\W` },
            messageId: 'unexpectedRegExpOrder',
          },
        ],
        output: dedent`
          /(\\d|\\D|\\s|\\S|\\w|\\W)/
        `,
        code: dedent`
          /(\\w|\\d|\\s|\\W|\\D|\\S)/
        `,
        options: [options],
      })
    })

    it('sorts alternatives using alias custom groups', async () => {
      let customOptions = {
        ...options,
        customGroups: [
          {
            elementNamePattern: '^alpha$',
            groupName: 'alpha-group',
            selector: 'alias',
          },
        ],
        groups: ['alpha-group', 'pattern'],
      } as const

      await invalid({
        errors: [
          {
            data: {
              right: 'alpha: (?<alpha>aaa)',
              left: 'beta: (?<beta>bbb)',
            },
            messageId: 'unexpectedRegExpOrder',
          },
        ],
        output: dedent`
          /(?<alpha>aaa)|(?<beta>bbb)/
        `,
        code: dedent`
          /(?<beta>bbb)|(?<alpha>aaa)/
        `,
        options: [customOptions],
      })
    })

    it('sorts alternatives with case-insensitive flag', async () => {
      await invalid({
        errors: [
          {
            data: { left: 'banana', right: 'apple' },
            messageId: 'unexpectedRegExpOrder',
          },
        ],
        output: dedent`
          /(apple|banana|cherry)/i
        `,
        code: dedent`
          /(banana|apple|cherry)/i
        `,
        options: [options],
      })
    })

    it('sorts alternatives with multiline flag', async () => {
      await invalid({
        errors: [
          {
            data: { right: '^alpha', left: '^beta' },
            messageId: 'unexpectedRegExpOrder',
          },
        ],
        output: dedent`
          /(^alpha|^beta|^gamma)/m
        `,
        code: dedent`
          /(^beta|^alpha|^gamma)/m
        `,
        options: [options],
      })
    })

    it('sorts alternatives with sticky flag', async () => {
      await invalid({
        errors: [
          {
            data: { right: 'aaa', left: 'bbb' },
            messageId: 'unexpectedRegExpOrder',
          },
        ],
        output: dedent`
          /(aaa|bbb|ccc)/y
        `,
        code: dedent`
          /(bbb|aaa|ccc)/y
        `,
        options: [options],
      })
    })

    it('sorts alternatives with dotAll flag', async () => {
      await invalid({
        errors: [
          {
            data: { right: 'a.b', left: 'c.d' },
            messageId: 'unexpectedRegExpOrder',
          },
        ],
        output: dedent`
          /(a.b|c.d|e.f)/s
        `,
        code: dedent`
          /(c.d|a.b|e.f)/s
        `,
        options: [options],
      })
    })

    it('keeps sorting with one alternative', async () => {
      await valid({
        code: dedent`
          /(onlyOne)/
        `,
        options: [options],
      })
    })

    it('keeps sorting with no alternatives', async () => {
      await valid({
        code: dedent`
          /noAlternatives/
        `,
        options: [options],
      })
    })

    it('keeps already sorted complex regex', async () => {
      await valid({
        code: dedent`
          /(\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}|example\\.com|localhost)/
        `,
        options: [options],
      })
    })

    it('works with complex cases', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedRegExpOrder',
            data: { right: 'g', left: 'i' },
          },
          {
            data: { right: '0-9', left: 'a-z' },
            messageId: 'unexpectedRegExpOrder',
          },
          {
            data: { right: 'aaa', left: 'bb' },
            messageId: 'unexpectedRegExpOrder',
          },
        ],
        output: dedent`
          /[0-9a-z].(aaa|bb|c)/gi
        `,
        code: dedent`
          /[a-z0-9].(bb|aaa|c)/ig
        `,
      })
    })

    it('does not sort alternatives when one is a prefix of another', async () => {
      await valid({
        code: dedent`
          /(ab|a)/
        `,
        options: [options],
      })
    })

    it('sorts alternatives with common prefix but no prefix relationship', async () => {
      await invalid({
        errors: [{ messageId: 'unexpectedRegExpOrder' }],
        output: dedent`
          /(abc|abd)/
        `,
        code: dedent`
          /(abd|abc)/
        `,
        options: [options],
      })
    })

    it('keeps hyphen at the end when it is a literal character', async () => {
      await valid({
        code: dedent`
          /[abc-]/
        `,
        options: [options],
      })
    })

    it('keeps hyphen at the beginning when it is a literal character', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedRegExpOrder',
            data: { right: 'a', left: '-' },
          },
        ],
        output: dedent`
          /[abc-]/
        `,
        code: dedent`
          /[-abc]/
        `,
        options: [options],
      })
    })

    it('does not move hyphen from edge to middle', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedRegExpOrder',
            data: { right: 'a', left: 'z' },
          },
        ],
        output: dedent`
          /[axz-]/
        `,
        code: dedent`
          /[zxa-]/
        `,
        options: [options],
      })
    })

    it('sorts character class with escaped hyphen normally', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedRegExpOrder',
            data: { right: 'a', left: 'z' },
          },
        ],
        output: dedent(String.raw`
          /[axz\-]/
        `),
        code: dedent(String.raw`
          /[z\-xa]/
        `),
        options: [options],
      })
    })

    it('does not create accidental range from literal hyphen', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedRegExpOrder',
            data: { right: 'a', left: 'z' },
          },
        ],
        output: dedent`
          /[az-]/
        `,
        code: dedent`
          /[za-]/
        `,
        options: [options],
      })
    })

    it('keeps literal hyphen last when mixed with character sets', async () => {
      await valid({
        code: dedent(String.raw`
          /[\w$-]/
        `),
        options: [options],
      })
    })

    it('preserves range when hyphen is part of range', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedRegExpOrder',
            data: { right: '0-9', left: 'z' },
          },
        ],
        output: dedent`
          /[0-9a-fz]/
        `,
        code: dedent`
          /[z0-9a-f]/
        `,
        options: [options],
      })
    })

    it('does not sort character classes with v flag (set operations)', async () => {
      await valid({
        code: dedent(String.raw`
          /[za]/v
        `),
        options: [options],
      })
    })

    it('does not sort character classes with v flag to avoid breaking set operations', async () => {
      await valid({
        code: dedent`
          /[zyxabc]/v
        `,
        options: [options],
      })
    })

    it('still sorts flags even with v flag present', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedRegExpOrder',
            data: { right: 'g', left: 'v' },
          },
        ],
        output: dedent`
          /pattern/gv
        `,
        code: dedent`
          /pattern/vg
        `,
        options: [options],
      })
    })
  })

  describe('natural', () => {
    let options = {
      type: 'natural',
      order: 'asc',
    } as const

    it('sorts regex flags', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedRegExpOrder',
            data: { right: 'g', left: 'i' },
          },
        ],
        output: dedent`
          /pattern/gimsu
        `,
        code: dedent`
          /pattern/igmus
        `,
        options: [options],
      })
    })

    it('keeps already sorted flags', async () => {
      await valid({
        code: dedent`
          /pattern/gim
        `,
        options: [options],
      })
    })

    it('ignores non-regex literals', async () => {
      await valid({
        code: dedent`
          const sample = 'not a regular expression';
        `,
        options: [options],
      })
    })

    it('sorts various flag combinations', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedRegExpOrder',
            data: { right: 's', left: 'y' },
          },
        ],
        output: dedent`
          /test/gimsuy
        `,
        code: dedent`
          /test/ysumgi
        `,
        options: [options],
      })
    })

    it('sorts single letter flags', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedRegExpOrder',
            data: { right: 'i', left: 'm' },
          },
        ],
        output: dedent`
          /(abc)/im
        `,
        code: dedent`
          /(abc)/mi
        `,
        options: [options],
      })
    })

    it('honors desc order for flags', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedRegExpOrder',
            data: { right: 'i', left: 'g' },
          },
        ],
        options: [
          {
            ...options,
            order: 'desc',
          },
        ],
        output: dedent`
          /pattern/yusmig
        `,
        code: dedent`
          /pattern/gimsuy
        `,
      })
    })

    it('sorts characters in character class', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedRegExpOrder',
            data: { right: 'a', left: 'z' },
          },
        ],
        output: dedent`
          /[axz]/
        `,
        code: dedent`
          /[zxa]/
        `,
        options: [options],
      })
    })

    it('sorts character classes with ranges', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedRegExpOrder',
            data: { right: '0-9', left: 'z' },
          },
        ],
        output: dedent`
          /[0-9a-fz]/
        `,
        code: dedent`
          /[z0-9a-f]/
        `,
        options: [options],
      })
    })

    it('sorts mixed character class elements', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedRegExpOrder',
            data: { right: '0-9', left: 'z' },
          },
        ],
        output: dedent`
          /[0-9A-Za-fz]/
        `,
        code: dedent`
          /[z0-9a-fA-Z]/
        `,
        options: [options],
      })
    })

    it('keeps already sorted character classes', async () => {
      await valid({
        code: dedent`
          /[0-9A-Za-z]/
        `,
        options: [options],
      })
    })

    it('sorts character classes with special chars', async () => {
      await invalid({
        errors: [
          {
            data: { right: String.raw`\d`, left: String.raw`\w` },
            messageId: 'unexpectedRegExpOrder',
          },
        ],
        output: dedent(String.raw`
            /[\d\w\s]/
          `),
        code: dedent(String.raw`
            /[\w\d\s]/
          `),
        options: [options],
      })
    })

    it('sorts character classes with equivalent elements', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedRegExpOrder',
          },
        ],
        output: dedent(String.raw`
          /[\x61a]/
        `),
        code: dedent(String.raw`
          /[a\x61]/
        `),
        options: [options],
      })
    })

    it('sorts character classes with ignoreCase disabled', async () => {
      let customOptions = {
        ...options,
        ignoreCase: false,
      } as const

      await invalid({
        errors: [
          {
            messageId: 'unexpectedRegExpOrder',
          },
        ],
        output: dedent(String.raw`
          /[\x61a]/
        `),
        code: dedent(String.raw`
          /[a\x61]/
        `),
        options: [customOptions],
      })
    })

    it('sorts character classes', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedRegExpOrder',
            data: { right: '1', left: '3' },
          },
        ],
        output: dedent`
          /[123]/
        `,
        code: dedent`
          /[312]/
        `,
        options: [options],
      })
    })

    it('sorts character classes with descending order', async () => {
      let customOptions = {
        ...options,
        order: 'desc',
      } as const

      await invalid({
        errors: [
          {
            messageId: 'unexpectedRegExpOrder',
          },
        ],
        output: dedent(String.raw`
          /[a\x61]/
        `),
        code: dedent(String.raw`
          /[\x61a]/
        `),
        options: [customOptions],
      })
    })

    it('sorts character classes with standalone digits', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedRegExpOrder',
            data: { right: '1', left: '3' },
          },
        ],
        output: dedent`
          /[123]/
        `,
        code: dedent`
          /[312]/
        `,
        options: [options],
      })
    })

    it('sorts character classes with uppercase letters', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedRegExpOrder',
            data: { right: 'A', left: 'C' },
          },
        ],
        output: dedent`
          /[ABC]/
        `,
        code: dedent`
          /[CBA]/
        `,
        options: [options],
      })
    })

    it('sorts character classes with astral characters', async () => {
      await invalid({
        errors: [
          {
            data: {
              right: String.raw`\u{1F600}-\u{1F602}`,
              left: String.raw`\u{1F603}`,
            },
            messageId: 'unexpectedRegExpOrder',
          },
        ],
        output: dedent(String.raw`
            /[\u{1F600}-\u{1F602}\u{1F603}]/u
          `),
        code: dedent(String.raw`
            /[\u{1F603}\u{1F600}-\u{1F602}]/u
          `),
        options: [options],
      })
    })

    it('sorts negated character classes', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedRegExpOrder',
            data: { right: 'a', left: 'z' },
          },
        ],
        output: dedent`
          /[^axz]/
        `,
        code: dedent`
          /[^zxa]/
        `,
        options: [options],
      })
    })

    it('honors desc order in character classes', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedRegExpOrder',
            data: { right: 'z', left: 'a' },
          },
        ],
        options: [
          {
            ...options,
            order: 'desc',
          },
        ],
        output: dedent`
          /[za90]/
        `,
        code: dedent`
          /[az09]/
        `,
      })
    })

    it('sorts character class inside groups', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedRegExpOrder',
            data: { right: 'a', left: 'c' },
          },
        ],
        output: dedent`
          /([abc]+)/
        `,
        code: dedent`
          /([cba]+)/
        `,
        options: [options],
      })
    })

    it('sorts multiple character classes in regex', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedRegExpOrder',
            data: { right: 'a', left: 'z' },
          },
          {
            messageId: 'unexpectedRegExpOrder',
            data: { right: '1', left: '3' },
          },
        ],
        output: dedent`
          /[axz].*[123]/
        `,
        code: dedent`
          /[zxa].*[321]/
        `,
        options: [options],
      })
    })

    it('keeps single character in character class', async () => {
      await valid({
        code: dedent`
          /[a]/
        `,
        options: [options],
      })
    })

    it('keeps empty character class', async () => {
      await valid({
        code: dedent`
          /[]/
        `,
        options: [options],
      })
    })

    it('sorts regex literal in variable declaration', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedRegExpOrder',
            data: { right: 'b', left: 'c' },
          },
          {
            messageId: 'unexpectedRegExpOrder',
            data: { right: 'a', left: 'b' },
          },
        ],
        output: dedent`
          const re = /(a|b|c)/;
        `,
        code: dedent`
          const re = /(c|b|a)/;
        `,
        options: [options],
      })
    })

    it('sorts regex literal inside function call', async () => {
      await invalid({
        errors: [
          {
            data: { right: 'apple', left: 'pear' },
            messageId: 'unexpectedRegExpOrder',
          },
        ],
        output: dedent`
          test(/(apple|orange|pear)/);
        `,
        code: dedent`
          test(/(pear|apple|orange)/);
        `,
        options: [options],
      })
    })

    it('keeps already sorted alternatives', async () => {
      await valid({
        code: dedent`
          /(aaa|bb|c)/gi
        `,
        options: [options],
      })
    })

    it('sorts plain alternations', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedRegExpOrder',
            data: { right: 'aaa', left: 'c' },
          },
        ],
        output: dedent`
          /(aaa|bb|c)/
        `,
        code: dedent`
          /(c|aaa|bb)/
        `,
        options: [options],
      })
    })

    it('sorts named capturing group alternatives with ignoreAlias false', async () => {
      await invalid({
        errors: [
          {
            data: { right: 'a: (?<a>aaa)', left: 'b: bbb' },
            messageId: 'unexpectedRegExpOrder',
          },
        ],
        output: dedent`
          /(?<b>(?<a>aaa)|bbb)/
        `,
        code: dedent`
          /(?<b>bbb|(?<a>aaa))/
        `,
        options: [options],
      })
    })

    it('ignores alias names when ignoreAlias is true', async () => {
      await invalid({
        errors: [
          {
            data: { right: '(?<a>a)', left: 'b' },
            messageId: 'unexpectedRegExpOrder',
          },
        ],
        options: [
          {
            ...options,
            ignoreAlias: true,
          },
        ],
        output: dedent`
          /(?<b>(?<a>a)|b)/
        `,
        code: dedent`
          /(?<b>b|(?<a>a))/
        `,
      })
    })

    it('respects custom groups by alias name', async () => {
      await invalid({
        errors: [
          {
            data: {
              right: String.raw`digit: (?<digit>\d)`,
              leftGroup: 'unknown',
              rightGroup: 'digits',
              left: 'other: z',
            },
            messageId: 'unexpectedRegExpOrder',
          },
        ],
        options: [
          {
            ...options,
            customGroups: [
              {
                elementNamePattern: '^digit$',
                groupName: 'digits',
              },
            ],
            groups: ['digits', 'unknown'],
          },
        ],
        output: dedent`
          /(?<other>(?<digit>\d)|z)/
        `,
        code: dedent`
          /(?<other>z|(?<digit>\d))/
        `,
      })
    })

    it('skips sorting alternatives with shadowed numbers', async () => {
      await valid({
        code: dedent`
          /(20|1|10|2|3)/
        `,
        options: [options],
      })
    })

    it('does not reorder alternatives when negated character class overlaps literal', async () => {
      await valid({
        code: dedent`
          /(?:\([^)]*\)|[^;])+/
        `,
        options: [options],
      })
    })

    it('does not reorder @import alternatives with greedy negated class', async () => {
      await valid({
        code: dedent(String.raw`
          /@import(?:\s*url\([^)]*\).*?|[^;]*);/
        `),
        options: [options],
      })
    })

    it('does not reorder alternatives when character class overlaps multi-character sequence', async () => {
      await valid({
        code: dedent(String.raw`
          /\r\n|[\r\n\u2028\u2029]/
        `),
        options: [options],
      })
    })

    it('does not reorder alternatives when optional sequence overlaps character class', async () => {
      await valid({
        code: dedent(String.raw`
          /\r?\n|[\r\n]/
        `),
        options: [options],
      })
    })

    it('sorts alternatives with special characters', async () => {
      await invalid({
        errors: [
          {
            data: { right: '!@#', left: 'abc' },
            messageId: 'unexpectedRegExpOrder',
          },
        ],
        output: dedent`
          /(!@#|$%^|&*|abc)/
        `,
        code: dedent`
          /(abc|!@#|$%^|&*)/
        `,
        options: [options],
      })
    })

    it('skips sorting when empty alternative can shadow others', async () => {
      await valid({
        code: dedent`
          /(b||a)/
        `,
        options: [options],
      })
    })

    it('sorts alternatives with escaped characters', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedRegExpOrder',
            data: { right: 'aa', left: 'bb' },
          },
        ],
        output: dedent`
          /(aa|bb|cc)/
        `,
        code: dedent`
          /(bb|aa|cc)/
        `,
        options: [options],
      })
    })

    it('sorts alternatives with character classes', async () => {
      await valid({
        code: dedent`
          /([0-9]|[A-Z]|[a-z])/
        `,
        options: [options],
      })
    })

    it('sorts alternatives with quantifiers', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedRegExpOrder',
            data: { right: 'a+', left: 'b*' },
          },
        ],
        output: dedent`
          /(a+|a?|a{2,4}|b*)/
        `,
        code: dedent`
          /(b*|a+|a?|a{2,4})/
        `,
        options: [options],
      })
    })

    it('sorts alternatives with word boundaries', async () => {
      await invalid({
        errors: [
          {
            data: { right: String.raw`\\bcat\\b`, left: String.raw`\\bdog\\b` },
            messageId: 'unexpectedRegExpOrder',
          },
        ],
        output: dedent`
          /(\\bcat\\b|\\bdog\\b)/
        `,
        code: dedent`
          /(\\bdog\\b|\\bcat\\b)/
        `,
        options: [options],
      })
    })

    it('sorts alternatives with unicode characters', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedRegExpOrder',
            data: { right: 'A', left: 'B' },
          },
        ],
        output: dedent`
          /(A|B|C)/u
        `,
        code: dedent`
          /(B|A|C)/u
        `,
        options: [options],
      })
    })

    it('sorts alternatives with lookahead assertions', async () => {
      await invalid({
        errors: [
          {
            data: { right: '(?=a)', left: '(?=b)' },
            messageId: 'unexpectedRegExpOrder',
          },
        ],
        output: dedent`
          /((?=a)|(?=b)|(?=c))/
        `,
        code: dedent`
          /((?=b)|(?=a)|(?=c))/
        `,
        options: [options],
      })
    })

    it('sorts alternatives with negative lookahead', async () => {
      await invalid({
        errors: [
          {
            data: { right: '(?!a)', left: '(?!b)' },
            messageId: 'unexpectedRegExpOrder',
          },
        ],
        output: dedent`
          /((?!a)|(?!b)|(?!c))/
        `,
        code: dedent`
          /((?!b)|(?!a)|(?!c))/
        `,
        options: [options],
      })
    })

    it('sorts alternatives with lookbehind assertions', async () => {
      await invalid({
        errors: [
          {
            data: { right: '(?<=a)', left: '(?<=b)' },
            messageId: 'unexpectedRegExpOrder',
          },
        ],
        output: dedent`
          /((?<=a)|(?<=b)|(?<=c))/
        `,
        code: dedent`
          /((?<=b)|(?<=a)|(?<=c))/
        `,
        options: [options],
      })
    })

    it('sorts alternatives with mixed metacharacters', async () => {
      await invalid({
        errors: [
          {
            data: { right: '^start', left: 'end$' },
            messageId: 'unexpectedRegExpOrder',
          },
        ],
        output: dedent`
          /(^start|end$|middle)/
        `,
        code: dedent`
          /(end$|^start|middle)/
        `,
        options: [options],
      })
    })

    it('skips alternatives with dot wildcard to avoid shadowing', async () => {
      await valid({
        code: dedent`
          /(specific|.+|.*|.?)/
        `,
        options: [options],
      })
    })

    it('skips sorting unnamed capturing group alternatives in secondary suite', async () => {
      await valid({
        code: dedent`
          /((c|d)|(a|b)|(e|f))/
        `,
        options: [options],
      })
    })

    it('sorts complex nested groups', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedRegExpOrder',
            data: { right: 'a', left: 'b' },
          },
        ],
        output: dedent`
          /(a|b|c)/
        `,
        code: dedent`
          /(b|a|c)/
        `,
        options: [options],
      })
    })

    it('sorts alternatives with flags preserved', async () => {
      await invalid({
        errors: [
          {
            data: { left: 'BANANA', right: 'APPLE' },
            messageId: 'unexpectedRegExpOrder',
          },
        ],
        output: dedent`
          /(APPLE|BANANA|CHERRY)/gim
        `,
        code: dedent`
          /(BANANA|APPLE|CHERRY)/gim
        `,
        options: [options],
      })
    })

    it('sorts many alternatives', async () => {
      await invalid({
        errors: [
          {
            data: { right: 'alpha', left: 'beta' },
            messageId: 'unexpectedRegExpOrder',
          },
          {
            data: { right: 'epsilon', left: 'gamma' },
            messageId: 'unexpectedRegExpOrder',
          },
          {
            data: { right: 'eta', left: 'zeta' },
            messageId: 'unexpectedRegExpOrder',
          },
          {
            data: { right: 'iota', left: 'theta' },
            messageId: 'unexpectedRegExpOrder',
          },
          {
            data: { right: 'omega', left: 'xi' },
            messageId: 'unexpectedRegExpOrder',
          },
          {
            data: { right: 'phi', left: 'tau' },
            messageId: 'unexpectedRegExpOrder',
          },
        ],
        output: dedent`
          /(alpha|beta|delta|epsilon|eta|gamma|iota|kappa|lambda|mu|nu|omega|phi|pi|psi|rho|sigma|tau|theta|xi|zeta)/
        `,
        code: dedent`
          /(beta|alpha|delta|gamma|epsilon|zeta|eta|theta|iota|kappa|lambda|mu|nu|xi|omega|pi|rho|sigma|tau|phi|psi)/
        `,
        options: [options],
      })
    })

    it('sorts alternatives with backreferences', async () => {
      await valid({
        code: dedent`
          /(a+|b+|c+)/
        `,
        options: [options],
      })
    })

    it('sorts alternatives with named backreferences', async () => {
      await valid({
        code: dedent`
          /(aa|bb|cc)/
        `,
        options: [options],
      })
    })

    it('sorts alternatives with non-capturing groups', async () => {
      await invalid({
        errors: [
          {
            data: { right: '(?:aaa)', left: '(?:bbb)' },
            messageId: 'unexpectedRegExpOrder',
          },
        ],
        output: dedent`
          /((?:aaa)|(?:bbb)|(?:ccc))/
        `,
        code: dedent`
          /((?:bbb)|(?:aaa)|(?:ccc))/
        `,
        options: [options],
      })
    })

    it('sorts alternatives with control characters', async () => {
      await invalid({
        errors: [
          {
            data: { right: String.raw`\\cA`, left: String.raw`\\cB` },
            messageId: 'unexpectedRegExpOrder',
          },
        ],
        output: dedent`
          /(\\cA|\\cB|\\cC)/
        `,
        code: dedent`
          /(\\cB|\\cA|\\cC)/
        `,
        options: [options],
      })
    })

    it('sorts alternatives with octal escapes', async () => {
      await invalid({
        errors: [
          {
            data: { right: String.raw`\\101`, left: String.raw`\\102` },
            messageId: 'unexpectedRegExpOrder',
          },
        ],
        output: dedent`
          /(\\101|\\102|\\103)/
        `,
        code: dedent`
          /(\\102|\\101|\\103)/
        `,
        options: [options],
      })
    })

    it('sorts alternatives with hex escapes', async () => {
      await invalid({
        errors: [
          {
            data: { right: String.raw`\\x41`, left: String.raw`\\x42` },
            messageId: 'unexpectedRegExpOrder',
          },
        ],
        output: dedent`
          /(\\x41|\\x42|\\x43)/
        `,
        code: dedent`
          /(\\x42|\\x41|\\x43)/
        `,
        options: [options],
      })
    })

    it('sorts alternatives with whitespace characters', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedRegExpOrder',
            data: { right: 'a', left: 'b' },
          },
        ],
        output: dedent`
          /(a|b|c)/
        `,
        code: dedent`
          /(b|a|c)/
        `,
        options: [options],
      })
    })

    it('sorts alternatives with digit and word shortcuts', async () => {
      await invalid({
        errors: [
          {
            data: { right: String.raw`\\d`, left: String.raw`\\w` },
            messageId: 'unexpectedRegExpOrder',
          },
          {
            data: { right: String.raw`\\D`, left: String.raw`\\W` },
            messageId: 'unexpectedRegExpOrder',
          },
        ],
        output: dedent`
          /(\\d|\\D|\\s|\\S|\\w|\\W)/
        `,
        code: dedent`
          /(\\w|\\d|\\s|\\W|\\D|\\S)/
        `,
        options: [options],
      })
    })

    it('sorts alternatives using alias custom groups', async () => {
      let customOptions = {
        ...options,
        customGroups: [
          {
            elementNamePattern: '^alpha$',
            groupName: 'alpha-group',
            selector: 'alias',
          },
        ],
        groups: ['alpha-group', 'pattern'],
      } as const

      await invalid({
        errors: [
          {
            data: {
              right: 'alpha: (?<alpha>aaa)',
              left: 'beta: (?<beta>bbb)',
            },
            messageId: 'unexpectedRegExpOrder',
          },
        ],
        output: dedent`
          /(?<alpha>aaa)|(?<beta>bbb)/
        `,
        code: dedent`
          /(?<beta>bbb)|(?<alpha>aaa)/
        `,
        options: [customOptions],
      })
    })

    it('sorts alternatives with case-insensitive flag', async () => {
      await invalid({
        errors: [
          {
            data: { left: 'banana', right: 'apple' },
            messageId: 'unexpectedRegExpOrder',
          },
        ],
        output: dedent`
          /(apple|banana|cherry)/i
        `,
        code: dedent`
          /(banana|apple|cherry)/i
        `,
        options: [options],
      })
    })

    it('sorts alternatives with multiline flag', async () => {
      await invalid({
        errors: [
          {
            data: { right: '^alpha', left: '^beta' },
            messageId: 'unexpectedRegExpOrder',
          },
        ],
        output: dedent`
          /(^alpha|^beta|^gamma)/m
        `,
        code: dedent`
          /(^beta|^alpha|^gamma)/m
        `,
        options: [options],
      })
    })

    it('sorts alternatives with sticky flag', async () => {
      await invalid({
        errors: [
          {
            data: { right: 'aaa', left: 'bbb' },
            messageId: 'unexpectedRegExpOrder',
          },
        ],
        output: dedent`
          /(aaa|bbb|ccc)/y
        `,
        code: dedent`
          /(bbb|aaa|ccc)/y
        `,
        options: [options],
      })
    })

    it('sorts alternatives with dotAll flag', async () => {
      await invalid({
        errors: [
          {
            data: { right: 'a.b', left: 'c.d' },
            messageId: 'unexpectedRegExpOrder',
          },
        ],
        output: dedent`
          /(a.b|c.d|e.f)/s
        `,
        code: dedent`
          /(c.d|a.b|e.f)/s
        `,
        options: [options],
      })
    })

    it('keeps sorting with one alternative', async () => {
      await valid({
        code: dedent`
          /(onlyOne)/
        `,
        options: [options],
      })
    })

    it('keeps sorting with no alternatives', async () => {
      await valid({
        code: dedent`
          /noAlternatives/
        `,
        options: [options],
      })
    })

    it('keeps already sorted complex regex', async () => {
      await valid({
        code: dedent`
          /(\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}|example\\.com|localhost)/
        `,
        options: [options],
      })
    })

    it('works with complex cases', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedRegExpOrder',
            data: { right: 'g', left: 'i' },
          },
          {
            data: { right: '0-9', left: 'a-z' },
            messageId: 'unexpectedRegExpOrder',
          },
          {
            data: { right: 'aaa', left: 'bb' },
            messageId: 'unexpectedRegExpOrder',
          },
        ],
        output: dedent`
          /[0-9a-z].(aaa|bb|c)/gi
        `,
        code: dedent`
          /[a-z0-9].(bb|aaa|c)/ig
        `,
      })
    })

    it('does not sort alternatives when one is a prefix of another', async () => {
      await valid({
        code: dedent`
          /(ab|a)/
        `,
        options: [options],
      })
    })

    it('sorts alternatives with common prefix but no prefix relationship', async () => {
      await invalid({
        errors: [{ messageId: 'unexpectedRegExpOrder' }],
        output: dedent`
          /(abc|abd)/
        `,
        code: dedent`
          /(abd|abc)/
        `,
        options: [options],
      })
    })

    it('keeps hyphen at the end when it is a literal character', async () => {
      await valid({
        code: dedent`
          /[abc-]/
        `,
        options: [options],
      })
    })

    it('keeps hyphen at the beginning when it is a literal character', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedRegExpOrder',
            data: { right: 'a', left: '-' },
          },
        ],
        output: dedent`
          /[abc-]/
        `,
        code: dedent`
          /[-abc]/
        `,
        options: [options],
      })
    })

    it('does not move hyphen from edge to middle', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedRegExpOrder',
            data: { right: 'a', left: 'z' },
          },
        ],
        output: dedent`
          /[axz-]/
        `,
        code: dedent`
          /[zxa-]/
        `,
        options: [options],
      })
    })

    it('sorts character class with escaped hyphen normally', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedRegExpOrder',
            data: { right: 'a', left: 'z' },
          },
        ],
        output: dedent(String.raw`
          /[axz\-]/
        `),
        code: dedent(String.raw`
          /[z\-xa]/
        `),
        options: [options],
      })
    })

    it('does not create accidental range from literal hyphen', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedRegExpOrder',
            data: { right: 'a', left: 'z' },
          },
        ],
        output: dedent`
          /[az-]/
        `,
        code: dedent`
          /[za-]/
        `,
        options: [options],
      })
    })

    it('keeps literal hyphen last when mixed with character sets', async () => {
      await valid({
        code: dedent(String.raw`
          /[\w$-]/
        `),
        options: [options],
      })
    })

    it('preserves range when hyphen is part of range', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedRegExpOrder',
            data: { right: '0-9', left: 'z' },
          },
        ],
        output: dedent`
          /[0-9a-fz]/
        `,
        code: dedent`
          /[z0-9a-f]/
        `,
        options: [options],
      })
    })

    it('does not sort character classes with v flag (set operations)', async () => {
      await valid({
        code: dedent(String.raw`
          /[za]/v
        `),
        options: [options],
      })
    })

    it('does not sort character classes with v flag to avoid breaking set operations', async () => {
      await valid({
        code: dedent`
          /[zyxabc]/v
        `,
        options: [options],
      })
    })

    it('still sorts flags even with v flag present', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedRegExpOrder',
            data: { right: 'g', left: 'v' },
          },
        ],
        output: dedent`
          /pattern/gv
        `,
        code: dedent`
          /pattern/vg
        `,
        options: [options],
      })
    })
  })

  describe('line-length', () => {
    let options = {
      type: 'line-length',
      order: 'desc',
    } as const

    it('ignores non-regex literals', async () => {
      await valid({
        code: dedent`
          const sample = 'not a regular expression';
        `,
        options: [options],
      })
    })

    it('sorts alternatives', async () => {
      await invalid({
        errors: [{ messageId: 'unexpectedRegExpOrder' }],
        output: dedent`
          /(bbb|cc|a)/
        `,
        code: dedent`
          /(a|bbb|cc)/
        `,
        options: [options],
      })
    })

    it('sorts character classes with ranges', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedRegExpOrder',
            data: { right: '0-9', left: 'z' },
          },
        ],
        output: dedent`
          /[0-9a-fz]/
        `,
        code: dedent`
          /[z0-9a-f]/
        `,
        options: [options],
      })
    })

    it('sorts mixed character class elements', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedRegExpOrder',
            data: { right: '0-9', left: 'z' },
          },
        ],
        output: dedent`
          /[0-9a-fA-Zz]/
        `,
        code: dedent`
          /[z0-9a-fA-Z]/
        `,
        options: [options],
      })
    })

    it('keeps already sorted character classes', async () => {
      await valid({
        code: dedent`
          /[0-9A-Za-z]/
        `,
        options: [options],
      })
    })

    it('sorts character classes with equivalent elements', async () => {
      await invalid({
        errors: [
          {
            data: { right: String.raw`\x61`, left: 'a' },
            messageId: 'unexpectedRegExpOrder',
          },
        ],
        output: dedent(String.raw`
          /[\x61a]/
        `),
        code: dedent(String.raw`
          /[a\x61]/
        `),
        options: [options],
      })
    })

    it('sorts character classes with astral characters', async () => {
      await invalid({
        errors: [
          {
            data: {
              right: String.raw`\u{1F600}-\u{1F602}`,
              left: String.raw`\u{1F603}`,
            },
            messageId: 'unexpectedRegExpOrder',
          },
        ],
        output: dedent(String.raw`
            /[\u{1F600}-\u{1F602}\u{1F603}]/u
          `),
        code: dedent(String.raw`
            /[\u{1F603}\u{1F600}-\u{1F602}]/u
          `),
        options: [options],
      })
    })

    it('sorts regex literal inside function call', async () => {
      await invalid({
        errors: [
          {
            data: { right: 'apple', left: 'pear' },
            messageId: 'unexpectedRegExpOrder',
          },
          {
            data: { right: 'orange', left: 'apple' },
            messageId: 'unexpectedRegExpOrder',
          },
        ],
        output: dedent`
          test(/(orange|apple|pear)/);
        `,
        code: dedent`
          test(/(pear|apple|orange)/);
        `,
        options: [options],
      })
    })

    it('keeps already sorted alternatives', async () => {
      await valid({
        code: dedent`
          /(aaa|bb|c)/gi
        `,
        options: [options],
      })
    })

    it('sorts plain alternations', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedRegExpOrder',
            data: { right: 'aaa', left: 'c' },
          },
        ],
        output: dedent`
          /(aaa|bb|c)/
        `,
        code: dedent`
          /(c|aaa|bb)/
        `,
        options: [options],
      })
    })

    it('skips sorting alternatives with shadowed numbers', async () => {
      await valid({
        code: dedent`
          /(20|1|10|2|3)/
        `,
        options: [options],
      })
    })

    it('does not reorder alternatives when negated character class overlaps literal', async () => {
      await valid({
        code: dedent`
          /(?:\([^)]*\)|[^;])+/
        `,
        options: [options],
      })
    })

    it('does not reorder @import alternatives with greedy negated class', async () => {
      await valid({
        code: dedent(String.raw`
          /@import(?:\s*url\([^)]*\).*?|[^;]*);/
        `),
        options: [options],
      })
    })

    it('does not reorder alternatives when character class overlaps multi-character sequence', async () => {
      await valid({
        code: dedent(String.raw`
          /\r\n|[\r\n\u2028\u2029]/
        `),
        options: [options],
      })
    })

    it('does not reorder alternatives when optional sequence overlaps character class', async () => {
      await valid({
        code: dedent(String.raw`
          /\r?\n|[\r\n]/
        `),
        options: [options],
      })
    })

    it('sorts alternatives with quantifiers', async () => {
      await invalid({
        errors: [
          {
            data: { right: 'a{2,4}', left: 'a?' },
            messageId: 'unexpectedRegExpOrder',
          },
        ],
        output: dedent`
          /(a{2,4}|b*|a+|a?)/
        `,
        code: dedent`
          /(b*|a+|a?|a{2,4})/
        `,
        options: [options],
      })
    })

    it('skips sorting when empty alternative can shadow others', async () => {
      await valid({
        code: dedent`
          /(b||a)/
        `,
        options: [options],
      })
    })

    it('sorts named group alternatives', async () => {
      await invalid({
        output: dedent`
          /(?<alias>value|z)/
        `,
        code: dedent`
          /(?<alias>z|value)/
        `,
        errors: [{ messageId: 'unexpectedRegExpOrder' }],
        options: [options],
      })
    })

    it('sorts alternatives with lookahead assertions', async () => {
      await invalid({
        errors: [
          {
            data: { right: '(?=longTerm)', left: '(?=short)' },
            messageId: 'unexpectedRegExpOrder',
          },
        ],
        output: dedent`
          /((?=longTerm)|(?=short)|(?=x))/
        `,
        code: dedent`
          /((?=short)|(?=longTerm)|(?=x))/
        `,
        options: [options],
      })
    })

    it('sorts alternatives with negative lookahead', async () => {
      await invalid({
        errors: [
          {
            data: { right: '(?!lengthy)', left: '(?!tiny)' },
            messageId: 'unexpectedRegExpOrder',
          },
        ],
        output: dedent`
          /((?!lengthy)|(?!tiny)|(?!x))/
        `,
        code: dedent`
          /((?!tiny)|(?!lengthy)|(?!x))/
        `,
        options: [options],
      })
    })

    it('sorts character class elements', async () => {
      await invalid({
        errors: [
          {
            data: { left: String.raw`\w`, right: '0-9' },
            messageId: 'unexpectedRegExpOrder',
          },
        ],
        output: dedent(String.raw`
          /[0-9\w]/
        `),
        code: dedent(String.raw`
          /[\w0-9]/
        `),
        options: [options],
      })
    })

    it('sorts alternatives with word boundaries', async () => {
      await invalid({
        errors: [
          {
            data: {
              right: String.raw`\\bhippopotamus\\b`,
              left: String.raw`\\bcat\\b`,
            },
            messageId: 'unexpectedRegExpOrder',
          },
        ],
        output: dedent`
          /(\\bhippopotamus\\b|\\bcat\\b|\\bdog\\b)/
        `,
        code: dedent`
          /(\\bcat\\b|\\bhippopotamus\\b|\\bdog\\b)/
        `,
        options: [options],
      })
    })

    it('sorts alternatives with unicode characters', async () => {
      await invalid({
        errors: [
          {
            data: { right: 'Ωmega', left: 'β' },
            messageId: 'unexpectedRegExpOrder',
          },
        ],
        output: dedent`
          /(Ωmega|Δelta|β|α)/
        `,
        code: dedent`
          /(β|Ωmega|Δelta|α)/
        `,
        options: [options],
      })
    })

    it('respects asc order when configured', async () => {
      await invalid({
        errors: [
          { messageId: 'unexpectedRegExpOrder' },
          { messageId: 'unexpectedRegExpOrder' },
        ],
        options: [
          {
            ...options,
            order: 'asc',
          },
        ],
        output: dedent`
          /(a|cc|bbb)/
        `,
        code: dedent`
          /(bbb|cc|a)/
        `,
      })
    })

    it('does not sort alternatives when one is a prefix of another', async () => {
      await valid({
        code: dedent`
          /(a|ab)/
        `,
        options: [options],
      })
    })

    it('sorts alternatives with common prefix but no prefix relationship', async () => {
      await invalid({
        errors: [{ messageId: 'unexpectedRegExpOrder' }],
        output: dedent`
          /(abcd|abd)/
        `,
        code: dedent`
          /(abd|abcd)/
        `,
        options: [options],
      })
    })

    it('does not sort character classes with v flag (set operations)', async () => {
      await valid({
        code: dedent(String.raw`
          /[za]/v
        `),
        options: [options],
      })
    })

    it('does not sort character classes with v flag to avoid breaking set operations', async () => {
      await valid({
        code: dedent`
          /[zyxabc]/v
        `,
        options: [options],
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

    it('sorts elements in sets', async () => {
      await valid({
        code: dedent`
          /a|b|c|d/
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            data: {
              right: 'b',
              left: 'c',
            },
            messageId: 'unexpectedRegExpOrder',
          },
        ],
        output: dedent`
          /a|b|c|d/
        `,
        code: dedent`
          /a|c|b|d/
        `,
        options: [options],
      })
    })
  })

  describe('unsorted', () => {
    let options = {
      type: 'unsorted',
      order: 'asc',
    } as const

    it('respects unsorted type for character classes', async () => {
      await valid({
        code: dedent`
          /[zxa]/
        `,
        options: [options],
      })
    })

    it('respects unsorted type for alternatives', async () => {
      await valid({
        code: dedent`
          /(c|a|b)/
        `,
        options: [options],
      })
    })

    it('respects unsorted type for complex regex', async () => {
      await valid({
        code: dedent`
          /[zxa].*(c|a|b)/
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

    it('does not report when rule is disabled for entire file', async () => {
      await valid({
        code: dedent`
          /* eslint-disable rule-to-test/sort-regexp */
          /pattern/igmus
        `,
      })
    })

    it('does not report when rule is disabled for next line', async () => {
      await valid({
        code: dedent`
          // eslint-disable-next-line rule-to-test/sort-regexp
          /pattern/igmus
        `,
      })
    })

    it('does not report when rule is disabled inline', async () => {
      await valid({
        code: dedent`
          /pattern/igmus // eslint-disable-line rule-to-test/sort-regexp
        `,
      })
    })

    it('does not report for alternatives when disabled', async () => {
      await valid({
        code: dedent`
          /* eslint-disable rule-to-test/sort-regexp */
          /(c|b|a)/
        `,
      })
    })

    it('does not report for character classes when disabled', async () => {
      await valid({
        code: dedent`
          // eslint-disable-next-line rule-to-test/sort-regexp
          /[zxa]/
        `,
      })
    })
  })
})
