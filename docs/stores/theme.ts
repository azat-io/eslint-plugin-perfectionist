import { persistentAtom } from '@nanostores/persistent'
import { onSet } from 'nanostores'

type Theme = 'light' | 'dark'

let systemTheme: Theme = globalThis.matchMedia('(prefers-color-scheme: dark)')
  .matches
  ? 'dark'
  : 'light'

export let theme = persistentAtom<Theme>('theme', systemTheme)

export let toggleTheme = (): void => {
  theme.set(theme.get() === 'light' ? 'dark' : 'light')
}

onSet(theme, ({ newValue }) => {
  document.documentElement.dataset.theme =
    newValue === 'dark' ? 'dark' : 'light'
})
