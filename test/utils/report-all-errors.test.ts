import { describe, expect, it, vi } from 'vitest'
import { Linter } from 'eslint'

import type * as MakeFixesModule from '../../utils/make-fixes'

import rule from '../../rules/sort-objects'

let makeFixesCalls = 0

vi.mock('../../utils/make-fixes', async importOriginal => {
  let original = await importOriginal<typeof MakeFixesModule>()
  return {
    ...original,
    makeFixes: (...parameters: Parameters<typeof original.makeFixes>) => {
      makeFixesCalls++
      return original.makeFixes(...parameters)
    },
  }
})

describe('report-all-errors', () => {
  it('builds the whole-list fix once per unsorted list, not once per report', () => {
    let keys = Array.from(
      { length: 200 },
      (_, index) => `k${String(200 - index).padStart(3, '0')}`,
    )
    let code = `let o = {\n${keys.map(key => `  ${key}: 1,`).join('\n')}\n}\n`
    let linter = new Linter({ configType: 'flat' })

    let messages = linter.verify(code, getConfig(), 'file.js')

    let fixTexts = new Set(messages.map(message => message.fix!.text))

    expect(messages).toHaveLength(199)
    expect(makeFixesCalls).toBe(1)
    expect(fixTexts.size).toBe(1)
  })

  function getConfig(): Linter.Config[] {
    return [
      {
        rules: {
          'perfectionist/sort-objects': [
            'error',
            { type: 'alphabetical', order: 'asc' },
          ],
        },
        plugins: { perfectionist: { rules: { 'sort-objects': rule } } },
        files: ['**/*.js'],
      },
    ] as unknown as Linter.Config[]
  }
})
