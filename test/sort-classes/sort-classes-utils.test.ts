import { describe, expect, it } from 'vitest'

import { generateOfficialGroups } from '../../rules/sort-classes/sort-classes-utils'

describe('sort-classes-utils', () => {
  it('sort-classes-utils: should generate official groups', () => {
    expect(
      generateOfficialGroups(
        ['private', 'abstract', 'protected'],
        ['get-method', 'method'],
      ),
    ).toEqual([
      'private-abstract-protected-get-method',
      'private-protected-abstract-get-method',
      'abstract-private-protected-get-method',
      'abstract-protected-private-get-method',
      'protected-abstract-private-get-method',
      'protected-private-abstract-get-method',
      'private-abstract-get-method',
      'abstract-private-get-method',
      'private-protected-get-method',
      'protected-private-get-method',
      'abstract-protected-get-method',
      'protected-abstract-get-method',
      'private-get-method',
      'abstract-get-method',
      'protected-get-method',
      'get-method',
      'private-abstract-protected-method',
      'private-protected-abstract-method',
      'abstract-private-protected-method',
      'abstract-protected-private-method',
      'protected-abstract-private-method',
      'protected-private-abstract-method',
      'private-abstract-method',
      'abstract-private-method',
      'private-protected-method',
      'protected-private-method',
      'abstract-protected-method',
      'protected-abstract-method',
      'private-method',
      'abstract-method',
      'protected-method',
      'method',
    ])
  })
})
