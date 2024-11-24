/// <reference types="@poppanator/sveltekit-svg/dist/svg" />
/// <reference path="../.astro/types.d.ts" />
/// <reference path=".astro/types.d.ts" />
/// <reference types="astro/client" />

declare module '*.svg?raw' {
  let content: string
  export default content
}
