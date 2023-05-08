let config = require('@azat-io/eslint-config-typescript')

module.exports = [
  ...config,
  {
    ignores: ['**/.vitepress/cache/**/*'],
  },
]
