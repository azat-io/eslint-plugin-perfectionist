import type { Config } from 'stylelint'

export default {
  overrides: [
    {
      files: ['**/*.astro', '**/*.svelte'],
      customSyntax: 'postcss-html',
    },
  ],
  extends: '@azat-io/stylelint-config',
  ignoreFiles: ['coverage/**/*'],
} satisfies Config
