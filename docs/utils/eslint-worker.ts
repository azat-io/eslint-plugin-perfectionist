import type { Linter } from 'eslint-linter-browserify'
import type { Linter as TLinter } from 'eslint'

import * as ESLint from 'eslint-linter-browserify'

interface Data {
  config: TLinter.Config
  code: string
}

let eslint: Linter | null = null

self.addEventListener('message', (event: MessageEvent<Data>): void => {
  let { config, code } = event.data
  if (!eslint) {
    eslint = new ESLint.Linter({
      configType: 'flat',
    })
  }
  try {
    if (typeof code !== 'string') {
      throw new TypeError('Code must be a string')
    }
    let messages = eslint.verify(code, config)
    postMessage(messages)
  } catch (error) {
    console.error('ESLint Worker Error:', error)
    postMessage([])
  }
})
