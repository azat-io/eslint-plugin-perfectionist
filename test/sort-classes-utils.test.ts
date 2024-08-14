import { describe, expect, it } from 'vitest'

import { generateOfficialGroups } from '../rules/sort-classes-utils'

describe('sort-classes-utils', () => {
  it('sort-classes-utils: should generate official groups', () => {
    expect(
      generateOfficialGroups(
        ['protected', 'abstract', 'override'],
        ['get-method', 'method'],
      ),
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
