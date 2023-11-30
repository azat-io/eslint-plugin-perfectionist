import { defineConfig } from 'astro/config'

export default defineConfig({
  site: 'https://eslint-plugin-perfectionist.azat.io',
  publicDir: './docs/public',
  compressHTML: true,
  srcDir: './docs',
})
