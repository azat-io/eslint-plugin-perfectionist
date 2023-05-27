let eslintPlugin = require('eslint-plugin-eslint-plugin/configs/all')
let config = require('@azat-io/eslint-config-typescript')

module.exports = [
  ...config,
  eslintPlugin,
  {
    ignores: ['**/.vitepress/cache/**/*'],
  },
  {
    rules: {
      'eslint-plugin/require-meta-docs-url': 'off',
      'eslint-plugin/require-meta-docs-description': [
        'error',
        { pattern: '^Enforce' },
      ],
    },
  },
]
