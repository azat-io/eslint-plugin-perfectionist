import { compare as createNaturalCompare } from 'natural-orderby'

interface Character {
  uppercaseCharacterCodePoint?: number
  lowercaseCharacterCodePoint?: number
  codePoint: number
  value: string
}

type UnicodePlaneName =
  | 'supplementaryMultilingual'
  | 'supplementaryIdeographic'
  | 'tertiaryIdeographic'
  | 'basicMultilingual'

interface UnicodePlane {
  start: number
  end: number
}

/**
 * Utility class to build alphabets
 */
export class Alphabet {
  /**
   * https://en.wikipedia.org/wiki/Plane_(Unicode)
   */
  private static readonly _PLANES: Record<UnicodePlaneName, UnicodePlane> = {
    supplementaryMultilingual: { start: 0x10000, end: 0x1ffff }, // Supplementary Multilingual Plane (SMP)
    supplementaryIdeographic: { start: 0x20000, end: 0x2ffff }, // Supplementary Ideographic Plane (SIP)
    tertiaryIdeographic: { start: 0x30000, end: 0x3ffff }, // Tertiary Ideographic Plane
    basicMultilingual: { start: 0x0000, end: 0xffff }, // Basic Multilingual Plane (BMP)
  }

  private _characters: Character[] = []

  private constructor(characters: Character[]) {
    this._characters = characters
  }

  /**
   * Generates an alphabet from the given characters
   * @param {string|string[]} values - The characters to generate the alphabet from
   * @returns {Alphabet} - The wrapped alphabet
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
   * Generates an alphabet containing relevant characters from the Unicode standard
   * Contains the Unicode planes 0 and 1.
   * @returns {Alphabet} - The generated alphabet
   */
  public static generateRecommendedAlphabet(): Alphabet {
    return Alphabet._generateAlphabetToRange(0x1ffff + 1)
  }

  /**
   * Generates an alphabet containing all characters from the Unicode standard
   * except for irrelevant Unicode planes
   * Contains the Unicode planes 0, 1, 2 and 3.
   * @returns {Alphabet} - The generated alphabet
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
   * Generates an alphabet containing relevant characters from the Unicode standard
   * @param {number} maxCodePoint - The maximum code point to generate the alphabet to
   * @returns {Alphabet} - The generated alphabet
   */
  private static _generateAlphabetToRange(maxCodePoint: number): Alphabet {
    let totalCharacters: Character[] = Array.from(
      { length: maxCodePoint },
      (_, i) => Alphabet._convertCodepointToCharacter(i),
    )
    return new Alphabet(totalCharacters)
  }

  /**
   * For each character with a lower and upper case, permutes the two cases
   * so that the alphabet is ordered by the case priority entered
   * @param {string} casePriority - The case to prioritize
   * @returns {Alphabet} - The same alphabet instance with the cases prioritized
   * @example
   * Alphabet.generateFrom('aAbBcdCD')
   * .prioritizeCase('uppercase')
   * // Returns 'AaBbCDcd'
   */
  public prioritizeCase(casePriority: 'lowercase' | 'uppercase'): this {
    let charactersWithCase = this._getCharactersWithCase()
    // Permutes each uppercase character with its lowercase one
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
      // eslint-disable-next-line no-undefined
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
      this._characters[index] = this._characters[otherCharacterIndex]
      this._characters[otherCharacterIndex] = character
    }
    return this
  }

  /**
   * Adds specific characters to the end of the alphabet
   * @param {string|string[]} values - The characters to push to the alphabet
   * @returns {Alphabet} - The same alphabet instance without the specified characters
   * @example
   * Alphabet.generateFrom('ab')
   * .pushCharacters('cd')
   * // Returns 'abcd'
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
   * Permutes characters with cases so that all characters with the entered case are put before the other characters
   * @param {string} caseToComeFirst - The case to put before the other characters
   * @returns {Alphabet} - The same alphabet instance with all characters with case before all the characters with the other case
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
      this._characters[element.index] = orderedCharacters[i].character
    }
    return this
  }

  /**
   * Places a specific character right before another character in the alphabet
   * @param {object} params - The parameters for the operation
   * @param {string} params.characterBefore - The character to come before characterAfter
   * @param {string} params.characterAfter - The target character
   * @returns {Alphabet} - The same alphabet instance with the specific character prioritized
   * @example
   * Alphabet.generateFrom('ab-cd/')
   * .placeCharacterBefore({ characterBefore: '/', characterAfter: '-' })
   * // Returns 'ab/-cd'
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
   * Places a specific character right after another character in the alphabet
   * @param {object} params - The parameters for the operation
   * @param {string} params.characterBefore - The target character
   * @param {string} params.characterAfter - The character to come after characterBefore
   * @returns {Alphabet} - The same alphabet instance with the specific character prioritized
   * @example
   * Alphabet.generateFrom('ab-cd/')
   * .placeCharacterAfter({ characterBefore: '/', characterAfter: '-' })
   * // Returns 'abcd/-'
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
   * Removes specific characters from the alphabet by their Unicode plane
   * @param {string} planeName - The Unicode plane to remove characters from
   * @returns {Alphabet} - The same alphabet instance without the characters from the specified Unicode plane
   */
  public removeUnicodePlane(
    planeName: Exclude<
      UnicodePlaneName,
      | 'supplementaryPrivateUseArea'
      | 'supplementarySpecialPurpose'
      | 'unassigned'
    >,
  ): this {
    return this._removeUnicodePlane(planeName)
  }

  /**
   * Removes specific characters from the alphabet by their range
   * @param {string} planeName - The Unicode plane to remove characters from
   * @returns {Alphabet} - The same alphabet instance without the characters from the specified Unicode plane
   */
  public removeUnicodeRange({ start, end }: UnicodePlane): this {
    this._characters = this._characters.filter(
      ({ codePoint }) => codePoint < start || codePoint > end,
    )
    return this
  }

  /**
   * Sorts the alphabet by the sorting function provided
   * @param {Function} sortingFunction - The sorting function to use
   * @returns {Alphabet} - The same alphabet instance sorted by the sorting function provided
   */
  public sortBy(
    sortingFunction: (characterA: string, characterB: string) => number,
  ): this {
    this._characters.sort((a, b) => sortingFunction(a.value, b.value))
    return this
  }

  /**
   * Removes specific characters from the alphabet
   * @param {string|string[]} values - The characters to remove from the alphabet
   * @returns {Alphabet} - The same alphabet instance without the specified characters
   * @example
   * Alphabet.generateFrom('abcd')
   * .removeCharacters('dcc')
   * // Returns 'ab'
   */
  public removeCharacters(values: string[] | string): this {
    this._characters = this._characters.filter(
      ({ value }) => !values.includes(value),
    )
    return this
  }

  /**
   * Sorts the alphabet by the natural order of the characters using `natural-orderby`
   * @param {string} locale - The locale to use for sorting
   * @returns {Alphabet} - The same alphabet instance sorted by the natural order of the characters
   */
  public sortByNaturalSort(locale?: string): this {
    let naturalCompare = createNaturalCompare({
      locale,
    })
    return this.sortBy((a, b) => naturalCompare(a, b))
  }

  /**
   * Sorts the alphabet by the locale order of the characters
   * @param {Intl.LocalesArgument} locales - The locales to use for sorting
   * @returns {Alphabet} - The same alphabet instance sorted by the locale order of the characters
   */
  public sortByLocaleCompare(locales?: Intl.LocalesArgument): this {
    return this.sortBy((a, b) => a.localeCompare(b, locales))
  }

  /**
   * Sorts the alphabet by the character code point
   * @returns {Alphabet} - The same alphabet instance sorted by the character code point
   */
  public sortByCharCodeAt(): this {
    return this.sortBy((a, b) => (a.charCodeAt(0) < b.charCodeAt(0) ? -1 : 1))
  }

  /**
   * Retrieves the characters from the alphabet
   * @returns {string} The characters from the alphabet
   */
  public getCharacters(): string {
    return this._characters.map(({ value }) => value).join('')
  }

  /**
   * Reverses the alphabet
   * @returns {Alphabet} - The same alphabet instance reversed
   * @example
   * Alphabet.generateFrom('ab')
   * .reverse()
   * // Returns 'ba'
   */
  public reverse(): this {
    this._characters.reverse()
    return this
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
      ],
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

  private _removeUnicodePlane(planeName: UnicodePlaneName): this {
    return this.removeUnicodeRange(Alphabet._PLANES[planeName])
  }
}
