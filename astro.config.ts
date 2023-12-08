import { defineConfig } from 'astro/config'
import svelte from '@astrojs/svelte'

export default defineConfig({
  i18n: {
    routing: {
      prefixDefaultLocale: true,
      strategy: 'pathname',
    },
    locales: ['en', 'ru'],
    defaultLocale: 'en',
  },
  site: 'https://eslint-plugin-perfectionist.azat.io',
  publicDir: './docs/public',
  integrations: [svelte()],
  compressHTML: true,
  srcDir: './docs',
})
