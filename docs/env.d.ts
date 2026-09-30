/// <reference types="@poppanator/sveltekit-svg/dist/svg" />
/// <reference path="../.astro/types.d.ts" />
/// <reference path=".astro/types.d.ts" />
/// <reference types="astro/client" />

declare module '*.svg?raw' {
  let content: string
  export default content
}

declare module 'virtual:playground-builtin-modules' {
  let builtinModules: string[]
  export default builtinModules
}

declare module 'virtual:playground-build-info' {
  let buildInfo: {
    perfectionist: string
    commit: string | null
    typescript: string
    release: boolean
  }
  export default buildInfo
}

interface Document {
  prerendering?: boolean
}
