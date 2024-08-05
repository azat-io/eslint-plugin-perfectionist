import { describe, expect, it } from 'vitest'

import { generateOfficialGroups } from '../../rules/sort-classes/sort-classes-utils'

describe('sort-classes-utils', () => {
  it('sort-classes-utils: should generate official groups', () => {
    expect(
      generateOfficialGroups(
        ['private', 'abstract', 'override'],
        ['get-method', 'method'],
      ),
    ).toEqual([
      'private-abstract-override-get-method',
      'private-override-abstract-get-method',
      'abstract-private-override-get-method',
      'abstract-override-private-get-method',
      'override-abstract-private-get-method',
      'override-private-abstract-get-method',
      'private-abstract-get-method',
      'abstract-private-get-method',
      'private-override-get-method',
      'override-private-get-method',
      'abstract-override-get-method',
      'override-abstract-get-method',
      'private-get-method',
      'abstract-get-method',
      'override-get-method',
      'get-method',
      'private-abstract-override-method',
      'private-override-abstract-method',
      'abstract-private-override-method',
      'abstract-override-private-method',
      'override-abstract-private-method',
      'override-private-abstract-method',
      'private-abstract-method',
      'abstract-private-method',
      'private-override-method',
      'override-private-method',
      'abstract-override-method',
      'override-abstract-method',
      'private-method',
      'abstract-method',
      'override-method',
      'method',
    ])
  })
})
