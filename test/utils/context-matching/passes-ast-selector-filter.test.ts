import { describe, expect, it } from 'vitest'

import { passesAstSelectorFilter } from '../../../utils/context-matching/passes-ast-selector-filter'

describe('passes-ast-selector-filter', () => {
  it.each([undefined, ''])(
    'returns true if `matchesAstSelector` is %s',
    matchesAstSelector => {
      let matchedAstSelectors = new Set(['TSTypeAnnotation'])

      expect(
        passesAstSelectorFilter({ matchedAstSelectors, matchesAstSelector }),
      ).toBeTruthy()
    },
  )

  it('returns true if `matchedAstSelectors` contains `matchesAstSelector`', () => {
    let matchedAstSelectors = new Set(['TSTypeAnnotation', 'ClassBody'])

    expect(
      passesAstSelectorFilter({
        matchesAstSelector: 'TSTypeAnnotation',
        matchedAstSelectors,
      }),
    ).toBeTruthy()
  })

  it('returns false if `matchedAstSelectors` does not contain `matchesAstSelector`', () => {
    let matchedAstSelectors = new Set(['TSTypeAnnotation'])

    expect(
      passesAstSelectorFilter({
        matchesAstSelector: 'ClassBody',
        matchedAstSelectors,
      }),
    ).toBeFalsy()
  })
})
