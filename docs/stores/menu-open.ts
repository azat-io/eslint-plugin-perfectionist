import { atom } from 'nanostores'

export let menuOpen = atom(false)

export let toggleMenu = () => {
  menuOpen.set(!menuOpen.get())
}
