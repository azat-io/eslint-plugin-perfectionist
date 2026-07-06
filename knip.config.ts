import type { KnipConfig } from 'knip'

export default {
  entry: ['index.ts', 'docs/netlify/edge-functions/markdown-negotiation.ts'],
  ignore: ['test/fixtures/**', 'svelte.config.ts'],
} satisfies KnipConfig
