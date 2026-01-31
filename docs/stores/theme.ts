import type { WritableAtom } from 'nanostores'

import { persistentAtom } from '@nanostores/persistent'
import { onSet, atom } from 'nanostores'

type Theme = 'light' | 'dark'

let systemTheme: Theme = 'light'
if (
  typeof globalThis.matchMedia === 'function' &&
  globalThis.matchMedia('(prefers-color-scheme: dark)').matches
) {
  systemTheme = 'dark'
}

export let theme: WritableAtom<Theme> =
  import.meta.env.SSR ?
    atom<Theme>(systemTheme)
  : persistentAtom<Theme>('theme', systemTheme)

export function toggleTheme(): void {
  theme.set(theme.get() === 'light' ? 'dark' : 'light')
}

if (!import.meta.env.SSR) {
  onSet(theme, ({ newValue }) => {
    document.documentElement.dataset['theme'] =
      newValue === 'dark' ? 'dark' : 'light'
  })
}
