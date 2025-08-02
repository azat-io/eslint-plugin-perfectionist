import { compare as createNaturalCompare } from 'natural-orderby'

import { convertBooleanToSign } from './convert-boolean-to-sign'

interface Character {
  uppercaseCharacterCodePoint?: number
  lowercaseCharacterCodePoint?: number
  codePoint: number
  value: string
}

/** Utility class to build alphabets. */
export class Alphabet {
  private _characters: Character[] = []

  private constructor(characters: Character[]) {
    this._characters = characters
  }

  /**
   * Generates an alphabet from the given characters.
   *
   * @param values - The characters to generate the alphabet from.
   * @returns - The wrapped alphabet.
   */
  public static generateFrom(values: string[] | string): Alphabet {
    let arrayValues = typeof values === 'string' ? [...values] : values
    if (arrayValues.length !== new Set(arrayValues).size) {
      throw new Error('The alphabet must not contain repeated characters')
    }
    if (arrayValues.some(value => value.length !== 1)) {
      throw new Error('The alphabet must contain single characters')
    }
    return new Alphabet(
      arrayValues.map(value =>
        Alphabet._convertCodepointToCharacter(value.codePointAt(0)!),
      ),
    )
  }

  /**
   * Generates an alphabet containing relevant characters from the Unicode
   * standard. Contains the Unicode planes 0 and 1.
   *
   * @returns - The generated alphabet.
   */
  public static generateRecommendedAlphabet(): Alphabet {
    return Alphabet._generateAlphabetToRange(0x1ffff + 1)
  }

  /**
   * Generates an alphabet containing all characters from the Unicode standard
   * except for irrelevant Unicode planes. Contains the Unicode planes 0, 1, 2
   * and 3.
   *
   * @returns - The generated alphabet.
   */
  public static generateCompleteAlphabet(): Alphabet {
    return Alphabet._generateAlphabetToRange(0x3ffff + 1)
  }

  private static _convertCodepointToCharacter(codePoint: number): Character {
    let character = String.fromCodePoint(codePoint)
    let lowercaseCharacter = character.toLowerCase()
    let uppercaseCharacter = character.toUpperCase()
    return {
      value: character,
      codePoint,
      ...(lowercaseCharacter === character
        ? null
        : {
            lowercaseCharacterCodePoint: lowercaseCharacter.codePointAt(0)!,
          }),
      ...(uppercaseCharacter === character
        ? null
        : {
            uppercaseCharacterCodePoint: uppercaseCharacter.codePointAt(0)!,
          }),
    }
  }

  /**
   * Generates an alphabet containing relevant characters from the Unicode
   * standard.
   *
   * @param maxCodePoint - The maximum code point to generate the alphabet to.
   * @returns - The generated alphabet.
   */
  private static _generateAlphabetToRange(maxCodePoint: number): Alphabet {
    let totalCharacters: Character[] = Array.from(
      { length: maxCodePoint },
      (_, i) => Alphabet._convertCodepointToCharacter(i),
    )
    return new Alphabet(totalCharacters)
  }

  /**
   * For each character with a lower and upper case, permutes the two cases so
   * that the alphabet is ordered by the case priority entered.
   *
   * @example
   *   Alphabet.generateFrom('aAbBcdCD').prioritizeCase('uppercase') // Returns 'AaBbCDcd'.
   *
   * @param casePriority - The case to prioritize.
   * @returns - The same alphabet instance with the cases prioritized.
   */
  public prioritizeCase(casePriority: 'lowercase' | 'uppercase'): this {
    let charactersWithCase = this._getCharactersWithCase()
    // Permutes each uppercase character with its lowercase one.
    let parsedIndexes = new Set<number>()
    let indexByCodePoints = this._characters.reduce<
      Record<number, undefined | number>
    >((indexByCodePoint, character, index) => {
      indexByCodePoint[character.codePoint] = index
      return indexByCodePoint
    }, {})
    for (let { character, index } of charactersWithCase) {
      if (parsedIndexes.has(index)) {
        continue
      }
      parsedIndexes.add(index)
      let otherCharacterIndex =
        indexByCodePoints[
          character.uppercaseCharacterCodePoint ??
            character.lowercaseCharacterCodePoint!
        ]

      if (otherCharacterIndex === undefined) {
        continue
      }
      parsedIndexes.add(otherCharacterIndex)
      let isCharacterUppercase = !character.uppercaseCharacterCodePoint
      if (isCharacterUppercase) {
        if (
          (casePriority === 'uppercase' && index < otherCharacterIndex) ||
          (casePriority === 'lowercase' && index > otherCharacterIndex)
        ) {
          continue
        }
      } else {
        if (
          (casePriority === 'uppercase' && index > otherCharacterIndex) ||
          (casePriority === 'lowercase' && index < otherCharacterIndex)
        ) {
          continue
        }
      }
      this._characters[index] = this._characters[otherCharacterIndex]!
      this._characters[otherCharacterIndex] = character
    }
    return this
  }

  /**
   * Adds specific characters to the end of the alphabet.
   *
   * @example
   *   Alphabet.generateFrom('ab').pushCharacters('cd')
   *   // Returns 'abcd'
   *
   * @param values - The characters to push to the alphabet.
   * @returns - The same alphabet instance without the specified characters.
   */
  public pushCharacters(values: string[] | string): this {
    let arrayValues = typeof values === 'string' ? [...values] : values
    let valuesSet = new Set(arrayValues)
    let valuesAlreadyExisting = this._characters.filter(({ value }) =>
      valuesSet.has(value),
    )
    if (valuesAlreadyExisting.length > 0) {
      throw new Error(
        `The alphabet already contains the characters ${valuesAlreadyExisting
          .slice(0, 5)
          .map(({ value }) => value)
          .join(', ')}`,
      )
    }
    if (arrayValues.some(value => value.length !== 1)) {
      throw new Error('Only single characters may be pushed')
    }
    this._characters.push(
      ...[...valuesSet].map(value =>
        Alphabet._convertCodepointToCharacter(value.codePointAt(0)!),
      ),
    )
    return this
  }

  /**
   * Permutes characters with cases so that all characters with the entered case
   * are put before the other characters.
   *
   * @param caseToComeFirst - The case to put before the other characters.
   * @returns - The same alphabet instance with all characters with case before
   *   all the characters with the other case.
   */
  public placeAllWithCaseBeforeAllWithOtherCase(
    caseToComeFirst: 'uppercase' | 'lowercase',
  ): this {
    let charactersWithCase = this._getCharactersWithCase()
    let orderedCharacters = [
      ...charactersWithCase.filter(character =>
        caseToComeFirst === 'uppercase'
          ? !character.character.uppercaseCharacterCodePoint
          : character.character.uppercaseCharacterCodePoint,
      ),
      ...charactersWithCase.filter(character =>
        caseToComeFirst === 'uppercase'
          ? character.character.uppercaseCharacterCodePoint
          : !character.character.uppercaseCharacterCodePoint,
      ),
    ]
    for (let [i, element] of charactersWithCase.entries()) {
      this._characters[element.index] = orderedCharacters[i]!.character
    }
    return this
  }

  /**
   * Places a specific character right before another character in the alphabet.
   *
   * @example
   *   Alphabet.generateFrom('ab-cd/').placeCharacterBefore({
   *     characterBefore: '/',
   *     characterAfter: '-',
   *   })
   *   // Returns 'ab/-cd'
   *
   * @param params - The parameters for the operation.
   * @param params.characterBefore - The character to come before
   *   characterAfter.
   * @param params.characterAfter - The target character.
   * @returns - The same alphabet instance with the specific character
   *   prioritized.
   */
  public placeCharacterBefore({
    characterBefore,
    characterAfter,
  }: {
    characterBefore: string
    characterAfter: string
  }): this {
    return this._placeCharacterBeforeOrAfter({
      characterBefore,
      characterAfter,
      type: 'before',
    })
  }

  /**
   * Places a specific character right after another character in the alphabet.
   *
   * @example
   *   Alphabet.generateFrom('ab-cd/').placeCharacterAfter({
   *     characterBefore: '/',
   *     characterAfter: '-',
   *   })
   *   // Returns 'abcd/-'
   *
   * @param params - The parameters for the operation.
   * @param params.characterBefore - The target character.
   * @param params.characterAfter - The character to come after characterBefore.
   * @returns - The same alphabet instance with the specific character
   *   prioritized.
   */
  public placeCharacterAfter({
    characterBefore,
    characterAfter,
  }: {
    characterBefore: string
    characterAfter: string
  }): this {
    return this._placeCharacterBeforeOrAfter({
      characterBefore,
      characterAfter,
      type: 'after',
    })
  }

  /**
   * Removes specific characters from the alphabet by their range.
   *
   * @param range - The Unicode range to remove characters from.
   * @param range.start - The starting Unicode codepoint.
   * @param range.end - The ending Unicode codepoint.
   * @returns - The same alphabet instance without the characters from the
   *   specified range.
   */
  public removeUnicodeRange({
    start,
    end,
  }: {
    start: number
    end: number
  }): this {
    this._characters = this._characters.filter(
      ({ codePoint }) => codePoint < start || codePoint > end,
    )
    return this
  }

  /**
   * Sorts the alphabet by the sorting function provided.
   *
   * @param sortingFunction - The sorting function to use.
   * @returns - The same alphabet instance sorted by the sorting function
   *   provided.
   */
  public sortBy(
    sortingFunction: (characterA: string, characterB: string) => number,
  ): this {
    this._characters.sort((a, b) => sortingFunction(a.value, b.value))
    return this
  }

  /**
   * Removes specific characters from the alphabet.
   *
   * @example
   *   Alphabet.generateFrom('abcd').removeCharacters('dcc')
   *   // Returns 'ab'
   *
   * @param values - The characters to remove from the alphabet.
   * @returns - The same alphabet instance without the specified characters.
   */
  public removeCharacters(values: string[] | string): this {
    this._characters = this._characters.filter(
      ({ value }) => !values.includes(value),
    )
    return this
  }

  /**
   * Sorts the alphabet by the natural order of the characters using
   * `natural-orderby`.
   *
   * @param locale - The locale to use for sorting.
   * @returns - The same alphabet instance sorted by the natural order of the
   *   characters.
   */
  public sortByNaturalSort(locale?: string): this {
    let naturalCompare = createNaturalCompare({
      locale,
    })
    return this.sortBy((a, b) => naturalCompare(a, b))
  }

  /**
   * Sorts the alphabet by the character code point.
   *
   * @returns - The same alphabet instance sorted by the character code point.
   */
  public sortByCharCodeAt(): this {
    return this.sortBy((a, b) =>
      convertBooleanToSign(a.charCodeAt(0) > b.charCodeAt(0)),
    )
  }

  /**
   * Sorts the alphabet by the locale order of the characters.
   *
   * @param locales - The locales to use for sorting.
   * @returns - The same alphabet instance sorted by the locale order of the
   *   characters.
   */
  public sortByLocaleCompare(locales?: Intl.LocalesArgument): this {
    return this.sortBy((a, b) => a.localeCompare(b, locales))
  }

  /**
   * Retrieves the characters from the alphabet.
   *
   * @returns The characters from the alphabet.
   */
  public getCharacters(): string {
    return this._characters.map(({ value }) => value).join('')
  }

  private _placeCharacterBeforeOrAfter({
    characterBefore,
    characterAfter,
    type,
  }: {
    type: 'before' | 'after'
    characterBefore: string
    characterAfter: string
  }): this {
    let indexOfCharacterAfter = this._characters.findIndex(
      ({ value }) => value === characterAfter,
    )
    let indexOfCharacterBefore = this._characters.findIndex(
      ({ value }) => value === characterBefore,
    )
    if (indexOfCharacterAfter === -1) {
      throw new Error(`Character ${characterAfter} not found in alphabet`)
    }
    if (indexOfCharacterBefore === -1) {
      throw new Error(`Character ${characterBefore} not found in alphabet`)
    }
    if (indexOfCharacterBefore <= indexOfCharacterAfter) {
      return this
    }

    this._characters.splice(
      type === 'before' ? indexOfCharacterAfter : indexOfCharacterBefore + 1,
      0,
      this._characters[
        type === 'before' ? indexOfCharacterBefore : indexOfCharacterAfter
      ]!,
    )
    this._characters.splice(
      type === 'before' ? indexOfCharacterBefore + 1 : indexOfCharacterAfter,
      1,
    )
    return this
  }

  private _getCharactersWithCase(): { character: Character; index: number }[] {
    return this._characters
      .map((character, index) => {
        if (
          !character.uppercaseCharacterCodePoint &&
          !character.lowercaseCharacterCodePoint
        ) {
          return null
        }
        return {
          character,
          index,
        }
      })
      .filter(element => element !== null)
  }
}
