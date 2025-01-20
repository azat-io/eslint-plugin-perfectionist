import type { HighlighterCore } from 'shiki'

import { createJavaScriptRegexEngine } from 'shiki/engine/javascript'
import { computed, onMount, atom, task } from 'nanostores'
import { createHighlighterCore } from 'shiki/core'

import { colorTheme } from '../utils/shiki-theme'

let shikiHighlighter = atom<HighlighterCore | null>(null)

let jsEngine = createJavaScriptRegexEngine()

export let shiki = computed([shikiHighlighter], highlighter => ({
  theme: 'css-variables',
  highlighter,
}))

onMount(shikiHighlighter, () => {
  task(async () => {
    let highlighter = await createHighlighterCore({
      langs: [import('@shikijs/langs/bash'), import('@shikijs/langs/tsx')],
      themes: [colorTheme],
      engine: jsEngine,
    })

    shikiHighlighter.set(highlighter)
  })
})
