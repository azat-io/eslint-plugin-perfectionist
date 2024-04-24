import type { HighlighterCore } from 'shiki'

import { computed, onMount, atom, task } from 'nanostores'
import { getSingletonHighlighter } from 'shiki'

import { colorTheme } from '../utils/shiki-theme'

let shikiHighlighter = atom<HighlighterCore | null>(null)

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
    })

    shikiHighlighter.set(highlighter)
  })
})
