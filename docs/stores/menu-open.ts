import { atom } from 'nanostores'

export let menuOpen = atom(false)

export let toggleMenu = (): void => {
  menuOpen.set(!menuOpen.get())
}
