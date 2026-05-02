import type { KnipConfig } from 'knip'

export default {
  entry: ['index.ts', 'docs/netlify/edge-functions/markdown-negotiation.ts'],
  ignore: ['test/fixtures/**'],
} satisfies KnipConfig
