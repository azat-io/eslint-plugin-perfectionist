import { describe, expect, it } from 'vitest'

import { generatePredefinedGroups } from '../utils/generate-predefined-groups'

describe('generate-predefined-groups', () => {
  it('should generate official groups', () => {
    expect(
      generatePredefinedGroups({
        modifiers: ['protected', 'abstract', 'override'],
        selectors: ['get-method', 'method'],
        cache: new Map(),
      }),
    ).toEqual([
      'protected-abstract-override-get-method',
      'protected-override-abstract-get-method',
      'abstract-protected-override-get-method',
      'abstract-override-protected-get-method',
      'override-abstract-protected-get-method',
      'override-protected-abstract-get-method',
      'protected-abstract-get-method',
      'abstract-protected-get-method',
      'protected-override-get-method',
      'override-protected-get-method',
      'abstract-override-get-method',
      'override-abstract-get-method',
      'protected-get-method',
      'abstract-get-method',
      'override-get-method',
      'get-method',
      'protected-abstract-override-method',
      'protected-override-abstract-method',
      'abstract-protected-override-method',
      'abstract-override-protected-method',
      'override-abstract-protected-method',
      'override-protected-abstract-method',
      'protected-abstract-method',
      'abstract-protected-method',
      'protected-override-method',
      'override-protected-method',
      'abstract-override-method',
      'override-abstract-method',
      'protected-method',
      'abstract-method',
      'override-method',
      'method',
    ])
  })
})
