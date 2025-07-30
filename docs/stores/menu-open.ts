import { atom } from 'nanostores'

export let menuOpen = atom(false)

export function toggleMenu(): void {
  menuOpen.set(!menuOpen.get())
}
