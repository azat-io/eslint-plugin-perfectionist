import { describe, expect, it } from 'vitest'

import { Alphabet } from '../utils/alphabet'

describe('alphabet', () => {
  describe('generators', () => {
    describe('generateFrom', () => {
      it('allows to generate an alphabet from string', () => {
        expect(() => Alphabet.generateFrom('abc')).not.toThrow()
      })

      it('allows to generate an alphabet from array', () => {
        expect(() => Alphabet.generateFrom(['a', 'b', 'c'])).not.toThrow()
      })

      it('throws when a duplicate character is found in a string input', () => {
        expect(() => Alphabet.generateFrom('aa')).toThrow(
          'The alphabet must not contain repeated characters',
        )
      })

      it('throws when a duplicate character is found in an array input', () => {
        expect(() => Alphabet.generateFrom(['a', 'a'])).toThrow(
          'The alphabet must not contain repeated characters',
        )
      })

      it('throws when a non-single character is found in a array input', () => {
        expect(() => Alphabet.generateFrom(['ab'])).toThrow(
          'The alphabet must contain single characters',
        )
      })
    })

    describe('generateCompleteAlphabet', () => {
      it('allows to generate a complete alphabet', () => {
        expect(
          Alphabet.generateCompleteAlphabet().getCharacters(),
        ).toHaveLength(458752)
      })
    })

    describe('generateRecommendedAlphabet', () => {
      it('allows to generate the recommended alphabet', () => {
        let charactersThatShouldBeIncluded = [
          'a',
          'A',
          String(1),
          '<',
          '@',
          'ê',
          'Ê',
          '{',
          '[',
          '_',
          '$',
          '🙂',
        ]

        let generatedCharacters =
          Alphabet.generateRecommendedAlphabet().getCharacters()

        expect(generatedCharacters).toHaveLength(196608)
        for (let character of charactersThatShouldBeIncluded) {
          expect(generatedCharacters).toContain(character)
        }
      })
    })

    describe('adding/removing characters', () => {
      it('allows to push characters with string input', () => {
        expect(
          Alphabet.generateFrom('ab').pushCharacters('cdd').getCharacters(),
        ).toBe('abcd')
      })

      it('allows to push characters with array input', () => {
        expect(
          Alphabet.generateFrom('ab')
            .pushCharacters(['c', 'd', 'd'])
            .getCharacters(),
        ).toBe('abcd')
      })

      it('throws when a non-single character is found in a array input', () => {
        expect(() => Alphabet.generateFrom('').pushCharacters(['ab'])).toThrow(
          'Only single characters may be pushed',
        )
      })

      it('throws when pushing a character that already exists in the alphabet', () => {
        expect(() => Alphabet.generateFrom('ab').pushCharacters('ab')).toThrow(
          'The alphabet already contains the characters a, b',
        )
      })

      it('allows removing characters', () => {
        expect(
          Alphabet.generateFrom('ab').removeCharacters('aac').getCharacters(),
        ).toBe('b')
      })

      it('allows removing a Unicode plane', () => {
        expect(
          Alphabet.generateCompleteAlphabet()
            .removeUnicodePlane('basicMultilingual')
            .getCharacters(),
        ).toHaveLength(393216)
      })

      it('allows removing a Unicode range', () => {
        expect(
          Alphabet.generateCompleteAlphabet()
            .removeUnicodeRange({ start: 0, end: 9 })
            .getCharacters(),
        ).toHaveLength(458742)
      })
    })

    describe('sorters', () => {
      it('allows sorting by localeCompare', () => {
        expect(
          Alphabet.generateFrom('bac').sortByLocaleCompare().getCharacters(),
        ).toBe('abc')
      })

      it('allows sorting by natural sort', () => {
        expect(
          Alphabet.generateFrom('1bac2').sortByNaturalSort().getCharacters(),
        ).toBe('12abc')
      })

      it('allows sorting by charCodeAt', () => {
        expect(
          Alphabet.generateFrom('1bac2').sortByCharCodeAt().getCharacters(),
        ).toBe('12abc')
      })

      it('allows sorting by custom sorting function', () => {
        expect(
          Alphabet.generateFrom('1bac2')
            .sortBy((a, b) => {
              if (a === 'a') {
                return 1
              }
              if (b === 'a') {
                return -1
              }
              return 0
            })
            .getCharacters(),
        ).toBe('1bc2a')
      })
    })

    describe('misc utilities', () => {
      it('allows reversing the alphabet', () => {
        expect(Alphabet.generateFrom('abc').reverse().getCharacters()).toBe(
          'cba',
        )
      })

      describe('prioritizeCase', () => {
        it('allows to prioritize uppercase', () => {
          expect(
            Alphabet.generateFrom('aABbc!dCD')
              .prioritizeCase('uppercase')
              .getCharacters(),
          ).toBe('AaBbC!Dcd')
        })

        it('allows to prioritize lowercase', () => {
          expect(
            Alphabet.generateFrom('aABbcdCDe')
              .prioritizeCase('lowercase')
              .getCharacters(),
          ).toBe('aAbBcdCDe')
        })
      })

      describe('placeCharacterBefore', () => {
        it('allows to place a character before another', () => {
          expect(
            Alphabet.generateFrom('ab-cd/')
              .placeCharacterBefore({
                characterBefore: '/',
                characterAfter: '-',
              })
              .getCharacters(),
          ).toBe('ab/-cd')
        })

        it('does nothing if characterBefore is already before characterAfter', () => {
          expect(
            Alphabet.generateFrom('abcd')
              .placeCharacterBefore({
                characterBefore: 'b',
                characterAfter: 'd',
              })
              .getCharacters(),
          ).toBe('abcd')
        })

        it('throws when the characterBefore is not in the alphabet', () => {
          expect(() =>
            Alphabet.generateFrom('a').placeCharacterBefore({
              characterBefore: 'b',
              characterAfter: 'a',
            }),
          ).toThrow('Character b not found in alphabet')
        })

        it('throws when the characterAfter is not in the alphabet', () => {
          expect(() =>
            Alphabet.generateFrom('a').placeCharacterBefore({
              characterBefore: 'a',
              characterAfter: 'b',
            }),
          ).toThrow('Character b not found in alphabet')
        })
      })

      describe('placeCharacterAfter', () => {
        it('allows to place a character after another', () => {
          expect(
            Alphabet.generateFrom('ab-cd/')
              .placeCharacterAfter({
                characterBefore: '/',
                characterAfter: '-',
              })
              .getCharacters(),
          ).toBe('abcd/-')
        })

        it('does nothing if characterBefore is already after characterBefore', () => {
          expect(
            Alphabet.generateFrom('abcd')
              .placeCharacterAfter({
                characterBefore: 'b',
                characterAfter: 'd',
              })
              .getCharacters(),
          ).toBe('abcd')
        })

        it('throws when the characterBefore is not in the alphabet', () => {
          expect(() =>
            Alphabet.generateFrom('a').placeCharacterAfter({
              characterBefore: 'b',
              characterAfter: 'a',
            }),
          ).toThrow('Character b not found in alphabet')
        })

        it('throws when the characterAfter is not in the alphabet', () => {
          expect(() =>
            Alphabet.generateFrom('a').placeCharacterAfter({
              characterBefore: 'a',
              characterAfter: 'b',
            }),
          ).toThrow('Character b not found in alphabet')
        })
      })

      describe('placeAllWithCaseBeforeAllWithOtherCase', () => {
        it('allows to placing all uppercase before lowercase ones', () => {
          expect(
            Alphabet.generateFrom('aAbBcCdD')
              .placeAllWithCaseBeforeAllWithOtherCase('uppercase')
              .getCharacters(),
          ).toBe('ABCDabcd')
        })

        it('allows to placing all lowercase before uppercase ones', () => {
          expect(
            Alphabet.generateFrom('aAbBcCdD')
              .placeAllWithCaseBeforeAllWithOtherCase('lowercase')
              .getCharacters(),
          ).toBe('abcdABCD')
        })
      })
    })
  })
})
