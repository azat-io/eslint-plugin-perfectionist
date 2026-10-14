import { describe, expect, it } from 'vitest'

import { isContextOptionMatching } from '../../../utils/context-matching/is-context-option-matching'

describe('is-context-option-matching', () => {
  it('returns true if the option has no `useConfigurationIf`', () => {
    expect(
      isContextOptionMatching({
        matchedAstSelectors: new Set(),
        nodeNames: ['bar'],
        options: {},
      }),
    ).toBeTruthy()
  })

  it('returns true if all conditions of `useConfigurationIf` are met', () => {
    expect(
      isContextOptionMatching({
        options: {
          useConfigurationIf: {
            matchesAstSelector: 'ClassBody',
            allNamesMatchPattern: 'bar',
          },
        },
        matchedAstSelectors: new Set(['ClassBody']),
        nodeNames: ['bar1', 'bar2'],
      }),
    ).toBeTruthy()
  })

  it('returns false if `allNamesMatchPattern` is not met', () => {
    expect(
      isContextOptionMatching({
        options: {
          useConfigurationIf: {
            matchesAstSelector: 'ClassBody',
            allNamesMatchPattern: 'foo',
          },
        },
        matchedAstSelectors: new Set(['ClassBody']),
        nodeNames: ['bar1', 'bar2'],
      }),
    ).toBeFalsy()
  })

  it('returns false if `matchesAstSelector` is not met', () => {
    expect(
      isContextOptionMatching({
        options: {
          useConfigurationIf: {
            matchesAstSelector: 'TSTypeAnnotation',
            allNamesMatchPattern: 'bar',
          },
        },
        matchedAstSelectors: new Set(['ClassBody']),
        nodeNames: ['bar1', 'bar2'],
      }),
    ).toBeFalsy()
  })
})
