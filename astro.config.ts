import { defineConfig } from 'astro/config'
import svelte from '@astrojs/svelte'

export default defineConfig({
  site: 'https://eslint-plugin-perfectionist.azat.io',
  publicDir: './docs/public',
  integrations: [svelte()],
  compressHTML: true,
  srcDir: './docs',
})
