import { persistentAtom } from '@nanostores/persistent'
import { onSet } from 'nanostores'

type Theme = 'light' | 'dark'

let systemTheme: Theme = window.matchMedia('(prefers-color-scheme: dark)')
  .matches
  ? 'dark'
  : 'light'

export let theme = persistentAtom<Theme>('theme', systemTheme)

export let toggleTheme = () => {
  theme.set(theme.get() === 'light' ? 'dark' : 'light')
}

onSet(theme, ({ newValue }) => {
  document.documentElement.setAttribute(
    'data-theme',
    newValue === 'dark' ? 'dark' : 'light',
  )
})
