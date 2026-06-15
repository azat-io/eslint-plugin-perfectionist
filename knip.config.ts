import type { KnipConfig } from 'knip'

export default {
  ignore: ['test/fixtures/**', 'svelte.config.ts'],
  entry: ['index.ts'],
} satisfies KnipConfig
