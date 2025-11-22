import type {
  CharacterUnicodePropertyCharacterSet,
  CharacterClassElement,
  CapturingGroup,
  CharacterClass,
  CharacterSet,
  Alternative,
  Element,
  Group,
} from '@eslint-community/regexpp/ast'

import { parseRegExpLiteral } from '@eslint-community/regexpp'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { FirstCharacterPath } from '../../rules/sort-regexp/get-first-character-paths'

import * as firstCharacterPathsModule from '../../rules/sort-regexp/get-first-character-paths'
import { hasShadowingAlternatives } from '../../rules/sort-regexp/has-shadowing-alternatives'

let { getFirstCharacterPaths } = firstCharacterPathsModule

function expectDotAllOverlapFor(codePoint: number): void {
  let literal = parseRegExpLiteral(/ab|cd/u)
  let wildcardClass = parseRegExpLiteral(/a/u).pattern.alternatives[0]!
    .elements[0]! as CharacterClass
  let dotLiteral = parseRegExpLiteral(/./u)
  let dotSet = dotLiteral.pattern.alternatives[0]!.elements[0]! as CharacterSet

  wildcardClass.elements = [
    {
      ...dotSet,
      parent: wildcardClass,
    } as CharacterClassElement,
  ]

  let longerPath = {
    matcher: { type: 'character', value: codePoint },
    requiresMore: true,
    canMatchMore: true,
  } as FirstCharacterPath
  let shorterPath = {
    matcher: { type: 'character-class', value: wildcardClass },
    requiresMore: false,
    canMatchMore: false,
  } as FirstCharacterPath
  let spy = vi.spyOn(firstCharacterPathsModule, 'getFirstCharacterPaths')

  spy
    .mockImplementationOnce(() => [longerPath])
    .mockImplementationOnce(() => [shorterPath])
    .mockImplementationOnce(() => [longerPath])
    .mockImplementationOnce(() => [shorterPath])

  expect(
    hasShadowingAlternatives({
      alternatives: literal.pattern.alternatives,
      flags: literal.flags.raw,
    }),
  ).toBeFalsy()

  expect(
    hasShadowingAlternatives({
      alternatives: literal.pattern.alternatives,
      flags: `${literal.flags.raw}s`,
    }),
  ).toBeTruthy()

  spy.mockRestore()
}

function serialize(paths: FirstCharacterPath[]): Record<string, unknown>[] {
  return paths.map(path => {
    if (path.matcher.type === 'character') {
      return {
        requiresMore: path.requiresMore,
        value: path.matcher.value,
        type: 'character',
      }
    }

    if (path.matcher.type === 'character-class') {
      return {
        requiresMore: path.requiresMore,
        raw: path.matcher.value.raw,
        type: 'character-class',
      }
    }

    return {
      negate:
        'negate' in path.matcher.value ? path.matcher.value.negate : false,
      requiresMore: path.requiresMore,
      kind: path.matcher.value.kind,
      type: 'character-set',
    }
  })
}

function analyzeShadowingWithPaths(
  pathSets: FirstCharacterPath[][],
  flags = 'u',
): boolean {
  let literal = parseRegExpLiteral(/a|b/u)
  let spy = vi.spyOn(firstCharacterPathsModule, 'getFirstCharacterPaths')

  for (let paths of pathSets) {
    spy.mockImplementationOnce(() => paths)
  }

  let result = hasShadowingAlternatives({
    alternatives: literal.pattern.alternatives,
    flags,
  })

  spy.mockRestore()

  return result
}

function analyzeShadowing(pattern: RegExp): boolean {
  let literal = parseRegExpLiteral(pattern)
  return hasShadowingAlternatives({
    alternatives: literal.pattern.alternatives,
    flags: literal.flags.raw,
  })
}

function getAlternative(pattern: RegExp, index = 0): Alternative {
  let literal = parseRegExpLiteral(pattern)
  return literal.pattern.alternatives[index]!
}

function code(value: string): number {
  return value.codePointAt(0)!
}

describe('sort-regexp shadowing helpers', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('detects literal prefixes with trailing characters', () => {
    let paths = getFirstCharacterPaths(getAlternative(/ab/u))

    expect(serialize(paths)).toEqual([
      {
        requiresMore: true,
        type: 'character',
        value: code('a'),
      },
    ])
  })

  it('expands optional quantifiers and assertions', () => {
    let paths = getFirstCharacterPaths(getAlternative(/^a?b/u))

    expect(serialize(paths)).toEqual([
      {
        requiresMore: true,
        type: 'character',
        value: code('a'),
      },
      {
        requiresMore: false,
        type: 'character',
        value: code('b'),
      },
    ])
  })

  it('handles character classes and ranges', () => {
    let paths = getFirstCharacterPaths(getAlternative(/[a-c]z/u))

    expect(serialize(paths)).toEqual([
      {
        type: 'character-class',
        requiresMore: true,
        raw: '[a-c]',
      },
    ])
  })

  it('tracks nested groups and alternatives', () => {
    let paths = getFirstCharacterPaths(getAlternative(/(?:ab|cd)e/u))

    expect(serialize(paths)).toEqual([
      {
        requiresMore: true,
        type: 'character',
        value: code('a'),
      },
      {
        requiresMore: true,
        type: 'character',
        value: code('c'),
      },
    ])
  })

  it('captures character sets inside quantifiers', () => {
    let paths = getFirstCharacterPaths(getAlternative(/\d+/u))

    expect(serialize(paths)).toEqual([
      {
        type: 'character-set',
        requiresMore: false,
        kind: 'digit',
        negate: false,
      },
    ])
  })

  it('marks alternatives that can optionally consume additional characters', () => {
    let paths = getFirstCharacterPaths(
      getAlternative(/[0-9a-f]{1,6}[\t\n\f\r ]?/iu),
    )

    expect(paths).toEqual([
      expect.objectContaining({
        requiresMore: false,
        canMatchMore: true,
      }),
    ])
  })

  it('keeps wildcard alternatives as single-character matches', () => {
    let paths = getFirstCharacterPaths(getAlternative(/[\s\S]/u))

    expect(paths).toEqual([
      expect.objectContaining({
        canMatchMore: false,
        requiresMore: false,
      }),
    ])
  })

  it('counts required repetitions for bounded quantifiers', () => {
    let paths = getFirstCharacterPaths(getAlternative(/a{2,4}/u))

    expect(serialize(paths)).toEqual([
      {
        requiresMore: true,
        type: 'character',
        value: code('a'),
      },
    ])
  })

  it('skips paths that start with backreferences', () => {
    let literal = parseRegExpLiteral(/(?<head>a)(?<tail>\k<head>b)/u)
    let secondGroup = literal.pattern.alternatives[0]!
      .elements[1]! as CapturingGroup

    expect(getFirstCharacterPaths(secondGroup.alternatives[0]!)).toEqual([])
  })

  it('ignores quantifiers that only repeat backreferences', () => {
    let paths = getFirstCharacterPaths(getAlternative(/(?<head>a)\k<head>+/u))

    expect(serialize(paths)).toEqual([])
  })

  it('stops collecting when reaching the safety limit', () => {
    let alternatives = Array.from({ length: 40 }, (_, index) => `x${index}`)
    let pattern = new RegExp(`(?:${alternatives.join('|')})`, 'u')
    let paths = getFirstCharacterPaths(getAlternative(pattern))

    expect(paths).toEqual([])
  })

  it('skips unicode-set aware character classes entirely', () => {
    // eslint-disable-next-line regexp/no-useless-character-class
    let paths = getFirstCharacterPaths(getAlternative(/[a]/v))

    expect(paths).toEqual([])
  })

  it('skips property escapes that can match multi-codepoint strings', () => {
    let paths = getFirstCharacterPaths(getAlternative(/\p{RGI_Emoji}/v))

    expect(paths).toEqual([])
  })

  it('ignores quantifiers whose inner matcher cannot produce a prefix', () => {
    let paths = getFirstCharacterPaths(getAlternative(/\p{RGI_Emoji}+/v))

    expect(paths).toEqual([])
  })

  it('bails out when a quantifier has an unknown minimum length', () => {
    let paths = getFirstCharacterPaths(
      getAlternative(/(?:(?<word>a)\k<word>)+/u),
    )

    expect(paths).toEqual([])
  })

  it('handles quantifiers whose inner element already spans multiple characters', () => {
    let paths = getFirstCharacterPaths(getAlternative(/(?:ab)+/u))

    expect(serialize(paths)).toEqual([
      {
        requiresMore: true,
        type: 'character',
        value: code('a'),
      },
    ])
  })

  it('does not reuse recursive groups when computing rest length', () => {
    let literal = parseRegExpLiteral(/a(?<tail>b)/u)
    let alternative = literal.pattern.alternatives[0]!
    let group = alternative.elements[1]! as CapturingGroup
    let recursiveReference = group as unknown as Element

    group.alternatives[0]!.elements = [recursiveReference]

    expect(getFirstCharacterPaths(alternative)).toEqual([])
  })

  it('reuses cached alternative lengths when branches share the same node', () => {
    let literal = parseRegExpLiteral(/(?:a)/u)
    let alternative = literal.pattern.alternatives[0]!
    let group = alternative.elements[0]! as Group
    let [innerAlternative] = group.alternatives

    group.alternatives.push(innerAlternative!)

    expect(serialize(getFirstCharacterPaths(alternative))).toEqual([
      {
        requiresMore: false,
        type: 'character',
        value: code('a'),
      },
      {
        requiresMore: false,
        type: 'character',
        value: code('a'),
      },
    ])
  })

  it('skips prefixes when trailing content depends on backreferences', () => {
    let paths = getFirstCharacterPaths(getAlternative(/(?<word>a)\k<word>/u))

    expect(paths).toEqual([])
  })

  it('handles expression character classes when evaluating rest lengths', () => {
    expect(
      getFirstCharacterPaths(
        getAlternative(/a[\p{Script=Greek}&&\p{Letter}]/v),
      ),
    ).toEqual([])
  })

  it('continues quantifier analysis when the minimum length is unknown', () => {
    let paths = getFirstCharacterPaths(
      // eslint-disable-next-line regexp/optimal-quantifier-concatenation, regexp/no-potentially-useless-backreference
      getAlternative(/(?<root>a)?(?:(?<tail>a)|\k<root>)+/u),
    )

    expect(paths).toEqual([])
  })

  it('propagates null rest lengths when later elements mix literals and backreferences', () => {
    expect(
      getFirstCharacterPaths(getAlternative(/(?<word>a)b\k<word>/u)),
    ).toEqual([])
  })

  it('saturates rest length computations when encountering multi-character tails', () => {
    let paths = getFirstCharacterPaths(getAlternative(/a(?<tail>bc)d/u))

    expect(serialize(paths)).toEqual([
      {
        requiresMore: true,
        type: 'character',
        value: code('a'),
      },
    ])
  })

  it('avoids recursive alternative loops when computing suffix lengths', () => {
    let literal = parseRegExpLiteral(/a/u)
    let alternative = literal.pattern.alternatives[0]!
    let group = {
      alternatives: [alternative],
      parent: alternative.parent,
      type: 'Group',
      raw: '',
    } as unknown as Group

    alternative.elements.push(group)

    expect(getFirstCharacterPaths(alternative)).toEqual([])
  })

  it('detects recursion in synthetic groups without relying on parser state', () => {
    let alternative = {
      elements: [] as Element[],
      type: 'Alternative',
      parent: null,
      start: 0,
      raw: '',
      end: 0,
    } as unknown as Alternative
    let literal = {
      parent: alternative,
      type: 'Character',
      value: code('a'),
      start: 0,
      raw: 'a',
      end: 0,
    } as Element
    let group = {
      alternatives: [alternative],
      parent: alternative,
      type: 'Group',
      start: 0,
      raw: '',
      end: 0,
    } as unknown as Group

    alternative.elements = [literal, group]

    expect(getFirstCharacterPaths(alternative)).toEqual([])
  })
})

describe('hasShadowingAlternatives', () => {
  it('detects overlapping newline classes', () => {
    expect(analyzeShadowing(/\r\n|[\n\r\u{2028}\u{2029}]/u)).toBeTruthy()
  })

  it('detects optional newline sequences', () => {
    // eslint-disable-next-line regexp/no-dupe-disjunctions
    expect(analyzeShadowing(/\r?\n|[\n\r]/u)).toBeTruthy()
  })

  it('ignores wildcard-driven alternatives', () => {
    expect(
      analyzeShadowing(/(?<variant>specific|.+foo|.*bar|.?baz)/u),
    ).toBeFalsy()
  })

  it('handles character classes with property escapes', () => {
    // eslint-disable-next-line regexp/no-useless-character-class
    expect(analyzeShadowing(/ab|[\p{ASCII}]/u)).toBeTruthy()
  })

  it('handles character classes with escape sets', () => {
    // eslint-disable-next-line regexp/no-useless-character-class, regexp/prefer-w
    expect(analyzeShadowing(/ab|[\w]/u)).toBeTruthy()
  })

  it('detects overlaps coming from script-aware property escapes inside classes', () => {
    expect(analyzeShadowing(/Ωa|\p{Script=Greek}/u)).toBeTruthy()
  })

  it('detects negated character classes even when wrapped in groups', () => {
    // eslint-disable-next-line regexp/no-useless-non-capturing-group
    expect(analyzeShadowing(/(?:[^a])b|(?:[^a])/u)).toBeTruthy()
  })

  it('detects overlaps coming from ranges', () => {
    expect(analyzeShadowing(/ab|[a-d]/u)).toBeTruthy()
  })

  it('detects negated character classes immediately', () => {
    // eslint-disable-next-line regexp/no-dupe-disjunctions
    expect(analyzeShadowing(/[^a]|b/u)).toBeTruthy()
  })

  it('falls back to raw comparison when needed', () => {
    expect(analyzeShadowing(/ab|a/u)).toBeTruthy()
  })

  it('skips alternatives that cannot produce a deterministic prefix', () => {
    // eslint-disable-next-line regexp/no-empty-alternative, regexp/no-dupe-disjunctions, regexp/no-useless-character-class
    expect(analyzeShadowing(/(?<empty>|ab)|[\r]/u)).toBeFalsy()
  })

  it('handles unicode set enabled character classes', () => {
    expect(analyzeShadowing(/ab|\p{Script=Greek}/v)).toBeFalsy()
  })

  it('ignores unicode properties that can expand to emoji strings', () => {
    expect(analyzeShadowing(/\p{RGI_Emoji}|./v)).toBeFalsy()
  })

  it('detects overlaps coming from negated property escapes', () => {
    expect(analyzeShadowing(/\P{Script=Greek}B|\P{Script=Greek}/u)).toBeTruthy()
  })

  it('detects overlaps when negated property escapes live inside classes', () => {
    expect(analyzeShadowing(/Aa|\P{Script=Greek}/u)).toBeTruthy()
  })

  it('caches unicode property regexes between analyses', () => {
    let propertyWithoutValue = /\p{ASCII}/u
    let propertyWithValue = /\p{Script=Latin}/u

    expect(analyzeShadowing(propertyWithoutValue)).toBeFalsy()
    expect(analyzeShadowing(propertyWithoutValue)).toBeFalsy()

    expect(analyzeShadowing(propertyWithValue)).toBeFalsy()
    expect(analyzeShadowing(propertyWithValue)).toBeFalsy()
  })

  it('treats unsupported unicode properties as non-shadowing', () => {
    let literal = parseRegExpLiteral(/\p{Script=Latin}/u)
    let property = literal.pattern.alternatives[0]!
      .elements[0]! as CharacterUnicodePropertyCharacterSet

    property.key = 'NotARealProperty' as typeof property.key

    expect(
      hasShadowingAlternatives({
        alternatives: literal.pattern.alternatives,
        flags: literal.flags.raw,
      }),
    ).toBeFalsy()
  })

  it('skips invalid property escapes nested inside character classes', () => {
    // eslint-disable-next-line regexp/no-useless-character-class
    let literal = parseRegExpLiteral(/Aa|[\p{Script=Latin}]/u)
    let characterClass = literal.pattern.alternatives[1]!
      .elements[0]! as CharacterClass
    let propertyElement = characterClass.elements.find(
      element => element.type === 'CharacterSet',
    ) as CharacterUnicodePropertyCharacterSet

    propertyElement.key = 'NotARealProperty' as typeof propertyElement.key

    expect(
      hasShadowingAlternatives({
        alternatives: literal.pattern.alternatives,
        flags: literal.flags.raw,
      }),
    ).toBeFalsy()
  })

  it('detects overlaps when digit escapes appear inside classes', () => {
    expect(analyzeShadowing(/1a|[\d_]/u)).toBeTruthy()
  })

  it('detects overlaps coming from space escapes inside classes', () => {
    expect(analyzeShadowing(/\u{20}a|[\s_]/u)).toBeTruthy()
  })

  it(String.raw`detects overlaps caused by \w escapes inside classes`, () => {
    expect(analyzeShadowing(/Aa|\w/u)).toBeTruthy()
  })

  it('detects underscore-prefixed literals shadowed by word character classes', () => {
    expect(analyzeShadowing(/_a|\w/u)).toBeTruthy()
  })

  it('skips comparisons when the other alternative has no deterministic prefix', () => {
    // eslint-disable-next-line no-useless-backreference, regexp/no-useless-backreference
    expect(analyzeShadowing(/(?<name>a)|\k<name>/u)).toBeFalsy()
  })

  it('treats unknown character-set kinds as safe to ignore', () => {
    // eslint-disable-next-line regexp/prefer-d, regexp/no-useless-character-class
    let literal = parseRegExpLiteral(/1a|[\d]/u)
    let characterClass = literal.pattern.alternatives[1]!
      .elements[0]! as CharacterClass
    let digitElement = characterClass.elements.find(
      element => element.type === 'CharacterSet',
    ) as CharacterSet

    digitElement.kind = 'unknown-kind' as CharacterSet['kind']

    expect(
      hasShadowingAlternatives({
        alternatives: literal.pattern.alternatives,
        flags: literal.flags.raw,
      }),
    ).toBeFalsy()
  })

  it('ignores unexpected elements inside character classes when checking overlaps', () => {
    // eslint-disable-next-line regexp/prefer-d, regexp/no-useless-character-class
    let literal = parseRegExpLiteral(/\dA|[\d]/u)
    let characterClass = literal.pattern.alternatives[1]!
      .elements[0]! as CharacterClass

    let mutableElements =
      characterClass.elements as unknown as CharacterClassElement[]
    mutableElements.unshift({
      type: 'UnknownElement',
    } as unknown as CharacterClassElement)

    expect(
      hasShadowingAlternatives({
        alternatives: literal.pattern.alternatives,
        flags: literal.flags.raw,
      }),
    ).toBeFalsy()
  })

  it('falls through class elements that never match the probed character', () => {
    // eslint-disable-next-line regexp/no-useless-character-class
    let literal = parseRegExpLiteral(/a|[b]a/u)
    let characterClass = literal.pattern.alternatives[1]!
      .elements[0]! as CharacterClass

    let mutableElements =
      characterClass.elements as unknown as CharacterClassElement[]
    mutableElements.unshift({
      type: 'UnknownElement',
    } as unknown as CharacterClassElement)

    expect(
      hasShadowingAlternatives({
        alternatives: literal.pattern.alternatives,
        flags: literal.flags.raw,
      }),
    ).toBeFalsy()
  })

  it('falls through unknown character class elements before evaluating overlaps', () => {
    let literal = parseRegExpLiteral(/ab|cd/u)
    // eslint-disable-next-line regexp/no-useless-character-class
    let characterClass = parseRegExpLiteral(/[a]/u).pattern.alternatives[0]!
      .elements[0]! as CharacterClass

    let mutableElements =
      characterClass.elements as unknown as CharacterClassElement[]
    mutableElements.unshift({
      type: 'UnknownElement',
    } as unknown as CharacterClassElement)

    let spy = vi.spyOn(firstCharacterPathsModule, 'getFirstCharacterPaths')

    spy
      .mockImplementationOnce(() => [
        {
          matcher: { type: 'character', value: code('z') },
          requiresMore: true,
          canMatchMore: true,
        },
      ])
      .mockImplementationOnce(() => [
        {
          matcher: { type: 'character-class', value: characterClass },
          requiresMore: false,
          canMatchMore: false,
        },
      ])

    expect(
      hasShadowingAlternatives({
        alternatives: literal.pattern.alternatives,
        flags: literal.flags.raw,
      }),
    ).toBeFalsy()
  })

  it('evaluates negated character classes during overlap detection with custom prefixes', () => {
    let negatedClass = parseRegExpLiteral(/[^a]/u).pattern.alternatives[0]!
      .elements[0]! as CharacterClass

    expect(
      analyzeShadowingWithPaths([
        [
          {
            matcher: { type: 'character', value: code('a') },
            requiresMore: true,
            canMatchMore: true,
          },
        ],
        [
          {
            matcher: { type: 'character-class', value: negatedClass },
            requiresMore: false,
            canMatchMore: false,
          },
        ],
      ]),
    ).toBeFalsy()
  })

  it('skips overlaps when character classes rely on string-based property escapes', () => {
    let literal = parseRegExpLiteral(/ab|cd/u)
    let emojiClassWrapper = parseRegExpLiteral(/[ab]/u)
    let emojiClass = emojiClassWrapper.pattern.alternatives[0]!
      .elements[0]! as CharacterClass
    let emojiSet = parseRegExpLiteral(/\p{RGI_Emoji}/v).pattern.alternatives[0]!
      .elements[0]! as CharacterSet

    emojiClass.unicodeSets = false
    emojiClass.elements = [
      {
        ...emojiSet,
        parent: emojiClass,
        strings: true,
      } as CharacterClassElement,
    ]
    let spy = vi.spyOn(firstCharacterPathsModule, 'getFirstCharacterPaths')

    spy
      .mockImplementationOnce(() => [
        {
          matcher: { type: 'character', value: code('x') },
          requiresMore: true,
          canMatchMore: true,
        },
      ])
      .mockImplementationOnce(() => [
        {
          matcher: { type: 'character-class', value: emojiClass },
          requiresMore: false,
          canMatchMore: false,
        },
      ])

    expect(
      hasShadowingAlternatives({
        alternatives: literal.pattern.alternatives,
        flags: literal.flags.raw,
      }),
    ).toBeFalsy()
  })

  it('skips overlaps when character sets rely on string-based property escapes', () => {
    let literal = parseRegExpLiteral(/ab|cd/u)
    let emojiSet = parseRegExpLiteral(/\p{RGI_Emoji}/v).pattern.alternatives[0]!
      .elements[0]! as CharacterSet
    let spy = vi.spyOn(firstCharacterPathsModule, 'getFirstCharacterPaths')

    spy
      .mockImplementationOnce(() => [
        {
          matcher: { type: 'character', value: code('a') },
          requiresMore: true,
          canMatchMore: true,
        },
      ])
      .mockImplementationOnce(() => [
        {
          matcher: { type: 'character-set', value: emojiSet },
          requiresMore: false,
          canMatchMore: false,
        },
      ])

    expect(
      hasShadowingAlternatives({
        alternatives: literal.pattern.alternatives,
        flags: literal.flags.raw,
      }),
    ).toBeFalsy()
  })

  it('treats unicode-set based character classes as inconclusive overlaps', () => {
    let literal = parseRegExpLiteral(/ab|cd/u)
    // eslint-disable-next-line regexp/no-useless-character-class
    let unicodeLiteral = parseRegExpLiteral(/[a]/v)
    let unicodeClass = unicodeLiteral.pattern.alternatives[0]!
      .elements[0]! as CharacterClass
    let spy = vi.spyOn(firstCharacterPathsModule, 'getFirstCharacterPaths')

    spy
      .mockImplementationOnce(() => [
        {
          matcher: { type: 'character', value: code('x') },
          requiresMore: true,
          canMatchMore: true,
        },
      ])
      .mockImplementationOnce(() => [
        {
          matcher: { type: 'character-class', value: unicodeClass },
          requiresMore: false,
          canMatchMore: false,
        },
      ])

    expect(
      hasShadowingAlternatives({
        alternatives: literal.pattern.alternatives,
        flags: literal.flags.raw,
      }),
    ).toBeFalsy()
  })

  it('respects the dotAll flag when wildcard escapes live inside classes', () => {
    let codePoints = [
      '\n'.codePointAt(0)!,
      '\r'.codePointAt(0)!,
      0x2028,
      0x2029,
    ]

    for (let codePoint of codePoints) {
      expectDotAllOverlapFor(codePoint)
    }
  })

  it('detects overlaps when wildcard matchers originate from character sets', () => {
    let classLiteral = parseRegExpLiteral(/[a-z]b/u)
    let classMatcher = classLiteral.pattern.alternatives[0]!
      .elements[0]! as CharacterClass
    let dotLiteral = parseRegExpLiteral(/./u)
    let dotMatcher = dotLiteral.pattern.alternatives[0]!
      .elements[0]! as CharacterSet

    expect(
      analyzeShadowingWithPaths([
        [
          {
            matcher: { type: 'character-class', value: classMatcher },
            requiresMore: true,
            canMatchMore: true,
          },
        ],
        [
          {
            matcher: { type: 'character-set', value: dotMatcher },
            requiresMore: false,
            canMatchMore: false,
          },
        ],
      ]),
    ).toBeTruthy()
  })

  it('detects overlaps when complementary property escapes form a wildcard class', () => {
    let propertyWrapper = parseRegExpLiteral(/[a-z]/u)
    let propertyClass = propertyWrapper.pattern.alternatives[0]!
      .elements[0]! as CharacterClass
    let asciiSet = parseRegExpLiteral(/\p{ASCII}/u).pattern.alternatives[0]!
      .elements[0]! as CharacterSet
    let nonAsciiSet = parseRegExpLiteral(/\P{ASCII}/u).pattern.alternatives[0]!
      .elements[0]! as CharacterSet

    propertyClass.elements = [
      {
        ...asciiSet,
        parent: propertyClass,
      } as CharacterClassElement,
      {
        ...nonAsciiSet,
        parent: propertyClass,
      } as CharacterClassElement,
    ]
    let classMatcher = parseRegExpLiteral(/[a-z]z/u).pattern.alternatives[0]!
      .elements[0]! as CharacterClass

    expect(
      analyzeShadowingWithPaths([
        [
          {
            matcher: { type: 'character-class', value: classMatcher },
            requiresMore: true,
            canMatchMore: true,
          },
        ],
        [
          {
            matcher: { type: 'character-class', value: propertyClass },
            requiresMore: false,
            canMatchMore: false,
          },
        ],
      ]),
    ).toBeTruthy()
  })

  it('ignores string-based property escapes when checking wildcard classes', () => {
    let emojiClassWrapper = parseRegExpLiteral(/[ab]/u)
    let emojiClass = emojiClassWrapper.pattern.alternatives[0]!
      .elements[0]! as CharacterClass
    let emojiSet = parseRegExpLiteral(/\p{RGI_Emoji}/v).pattern.alternatives[0]!
      .elements[0]! as CharacterSet

    emojiClass.unicodeSets = false
    emojiClass.elements = [
      {
        ...emojiSet,
        parent: emojiClass,
        strings: true,
      } as CharacterClassElement,
    ]
    let classMatcher = parseRegExpLiteral(/[a-z]n/u).pattern.alternatives[0]!
      .elements[0]! as CharacterClass

    expect(
      analyzeShadowingWithPaths([
        [
          {
            matcher: { type: 'character-class', value: classMatcher },
            requiresMore: true,
            canMatchMore: true,
          },
        ],
        [
          {
            matcher: { type: 'character-class', value: emojiClass },
            requiresMore: false,
            canMatchMore: false,
          },
        ],
      ]),
    ).toBeFalsy()
  })

  it('falls back gracefully when encountering unknown character set kinds', () => {
    let patchedClass = parseRegExpLiteral(/[a-z]n/u).pattern.alternatives[0]!
      .elements[0]! as CharacterClass
    let wildcardClass = parseRegExpLiteral(/[\s\S]/u).pattern.alternatives[0]!
      .elements[0]! as CharacterClass

    let mutableElements =
      wildcardClass.elements as unknown as CharacterClassElement[]

    for (let index = 0; index < mutableElements.length; index++) {
      let element = mutableElements[index]!

      if (element.type === 'CharacterSet') {
        mutableElements[index] = {
          ...element,
          kind: 'custom-kind',
        } as unknown as CharacterClassElement
      }
    }

    expect(
      analyzeShadowingWithPaths([
        [
          {
            matcher: { type: 'character-class', value: patchedClass },
            requiresMore: true,
            canMatchMore: true,
          },
        ],
        [
          {
            matcher: { type: 'character-class', value: wildcardClass },
            requiresMore: false,
            canMatchMore: false,
          },
        ],
      ]),
    ).toBeFalsy()
  })

  it('skips wildcard detection when a class is missing its element list', () => {
    let patchedClass = parseRegExpLiteral(/[a-z]n/u).pattern.alternatives[0]!
      .elements[0]! as CharacterClass
    let wildcardClass = parseRegExpLiteral(/[\s\S]/u).pattern.alternatives[0]!
      .elements[0]! as CharacterClass

    ;(
      wildcardClass as unknown as { elements?: CharacterClass['elements'] }
    ).elements = undefined

    expect(
      analyzeShadowingWithPaths([
        [
          {
            matcher: { type: 'character-class', value: patchedClass },
            requiresMore: true,
            canMatchMore: true,
          },
        ],
        [
          {
            matcher: { type: 'character-class', value: wildcardClass },
            requiresMore: false,
            canMatchMore: false,
          },
        ],
      ]),
    ).toBeFalsy()
  })

  it('detects overlaps when wildcard character sets follow multi-character classes', () => {
    expect(analyzeShadowing(/[a-z]a|./u)).toBeTruthy()
  })

  it('detects overlaps when a wildcard branch could swallow escaped code points', () => {
    let literal = parseRegExpLiteral(/\\(?:[0-9a-f]{1,6}[\t\n\f\r ]?|[\s\S])/iu)
    let group = literal.pattern.alternatives[0]!.elements[1]! as CapturingGroup

    expect(
      hasShadowingAlternatives({
        alternatives: group.alternatives,
        flags: literal.flags.raw,
      }),
    ).toBeTruthy()
  })
})
