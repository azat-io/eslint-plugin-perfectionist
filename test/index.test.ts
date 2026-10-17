import { describe, expect, it } from 'vitest'
import { Linter } from 'eslint'

import plugin from '../index'

describe('index', () => {
  it.each([
    'recommended-alphabetical',
    'recommended-line-length',
    'recommended-natural',
    'recommended-custom',
  ] as const)('registers the exported plugin in %s config', name => {
    expect(plugin.configs[name].plugins?.['perfectionist']).toBe(plugin)
  })

  it.each([
    [
      'before',
      [
        { plugins: { perfectionist: plugin } },
        plugin.configs['recommended-natural'],
      ],
    ],
    [
      'after',
      [
        plugin.configs['recommended-natural'],
        { plugins: { perfectionist: plugin } },
      ],
    ],
  ])(
    'allows to register the plugin %s a recommended config',
    (_position, config) => {
      let linter = new Linter({ configType: 'flat' })

      let messages = linter.verify('let o = { b: 1, a: 2 }', config, 'file.js')

      expect(messages.map(message => message.ruleId)).toEqual([
        'perfectionist/sort-objects',
      ])
    },
  )
})
