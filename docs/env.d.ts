/// <reference types="@poppanator/sveltekit-svg/dist/svg" />
/// <reference path="../.astro/types.d.ts" />
/// <reference path=".astro/types.d.ts" />
/// <reference types="astro/client" />

declare module '*.svg?raw' {
  let content: string
  export default content
}

declare module 'remark-sectionize' {
  import type { Plugin } from 'unified'
  import type { Root } from 'mdast'

  let plugin: Plugin<object, Root>
  export default plugin
}
