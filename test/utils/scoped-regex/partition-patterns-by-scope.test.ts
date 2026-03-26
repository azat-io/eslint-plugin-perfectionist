import { describe, expect, it } from 'vitest'

import { partitionPatternsByScope } from '../../../utils/scoped-regex/partition-patterns-by-scope'

describe('partition-patterns-by-scope', () => {
  it('puts a string pattern into shallowScopePatterns', () => {
    expect(partitionPatternsByScope('foo')).toEqual({
      shallowScopePatterns: ['foo'],
      deepScopePatterns: [],
    })
  })

  it('puts an object pattern without scope into shallowScopePatterns', () => {
    let pattern = { pattern: 'foo', flags: 'i' }

    expect(partitionPatternsByScope(pattern)).toEqual({
      shallowScopePatterns: [pattern],
      deepScopePatterns: [],
    })
  })

  it('puts an object pattern with shallow scope into shallowScopePatterns', () => {
    let pattern = { scope: 'shallow' as const, pattern: 'foo' }

    expect(partitionPatternsByScope(pattern)).toEqual({
      shallowScopePatterns: [pattern],
      deepScopePatterns: [],
    })
  })

  it('puts an object pattern with deep scope into deepScopePatterns', () => {
    let pattern = { scope: 'deep' as const, pattern: 'foo' }

    expect(partitionPatternsByScope(pattern)).toEqual({
      deepScopePatterns: [pattern],
      shallowScopePatterns: [],
    })
  })

  it('partitions an array of mixed patterns by scope', () => {
    let shallowString = 'foo'
    let shallowObject = { pattern: 'bar', flags: 'i' }
    let deepObject = { scope: 'deep' as const, pattern: 'baz' }

    expect(
      partitionPatternsByScope([shallowString, shallowObject, deepObject]),
    ).toEqual({
      shallowScopePatterns: [shallowString, shallowObject],
      deepScopePatterns: [deepObject],
    })
  })
})
