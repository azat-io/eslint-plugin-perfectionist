import 'astro/astro-jsx'

declare global {
  namespace JSX {
    type Element = HTMLElement
    type IntrinsicElements = astroHTML.JSX.IntrinsicElements
  }
}
