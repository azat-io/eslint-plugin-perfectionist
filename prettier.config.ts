import type { Config } from 'prettier'

export default {
  overrides: [
    {
      options: {
        parser: 'astro',
      },
      files: '*.astro',
    },
    {
      options: {
        parser: 'svelte',
      },
      files: '*.svelte',
    },
  ],
  plugins: [
    'prettier-plugin-astro',
    'prettier-plugin-svelte',
    'prettier-plugin-jsdoc',
  ],
  quoteProps: 'as-needed',
  arrowParens: 'avoid',
  bracketSpacing: true,
  trailingComma: 'all',
  singleQuote: true,
  endOfLine: 'lf',
  printWidth: 80,
  useTabs: false,
  semi: false,
  tabWidth: 2,
} satisfies Config
