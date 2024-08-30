import type { HighlighterCore } from 'shiki'

import { createJavaScriptRegexEngine, getSingletonHighlighter } from 'shiki'
import { computed, onMount, atom, task } from 'nanostores'

import { colorTheme } from '../utils/shiki-theme'

let shikiHighlighter = atom<HighlighterCore | null>(null)

let jsEngine = createJavaScriptRegexEngine()

export let shiki = computed([shikiHighlighter], highlighter => ({
  theme: 'css-variables',
  highlighter,
}))

onMount(shikiHighlighter, () => {
  task(async () => {
    let highlighter = await getSingletonHighlighter({
      langs: [
        import('shiki/langs/svelte.mjs'),
        import('shiki/langs/astro.mjs'),
        import('shiki/langs/bash.mjs'),
        import('shiki/langs/vue.mjs'),
        import('shiki/langs/tsx.mjs'),
        import('shiki/langs/js.mjs'),
      ],
      themes: [colorTheme],
      engine: jsEngine,
    })

    shikiHighlighter.set(highlighter)
  })
})
