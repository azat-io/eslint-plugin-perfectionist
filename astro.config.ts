import { defineConfig } from 'astro/config'

export default defineConfig({
  publicDir: './docs/public',
  compressHTML: true,
  srcDir: './docs',
})
