import { transformerNotationDiff } from '@shikijs/transformers'
import rehypeExternalLinks from 'rehype-external-links'
import { browserslistToTargets } from 'lightningcss'
import svelteSvg from '@poppanator/sveltekit-svg'
import remarkSectionize from 'remark-sectionize'
import { defineConfig } from 'astro/config'
import { fileURLToPath } from 'node:url'
import browserslist from 'browserslist'
import sitemap from '@astrojs/sitemap'
import svelte from '@astrojs/svelte'
import mdx from '@astrojs/mdx'
import path from 'node:path'

import { remarkHeadings } from './docs/plugins/remark-headings'
import { colorTheme } from './docs/utils/shiki-theme'

let dirname = fileURLToPath(path.dirname(import.meta.url))
let site = 'https://perfectionist.dev'

export default defineConfig({
  markdown: {
    rehypePlugins: [
      [
        rehypeExternalLinks,
        {
          rel: ['noopener', 'noreferrer'],
          target: '_blank',
        },
      ],
    ],
    shikiConfig: {
      transformers: [
        transformerNotationDiff({
          matchAlgorithm: 'v3',
        }),
      ],
      theme: colorTheme,
    },
    remarkPlugins: [remarkSectionize, remarkHeadings],
  },
  vite: {
    css: {
      lightningcss: {
        targets: browserslistToTargets(
          browserslist(
            browserslist.loadConfig({ path: '.' }) ?? browserslist.defaults,
          ),
        ),
      },
      transformer: 'lightningcss',
    },
    plugins: [
      // @ts-ignore
      svelteSvg(),
    ],
  },
  integrations: [
    svelte(),
    sitemap({
      filter: page => !new RegExp(`^${site}/guide$`, 'u').test(page),
    }),
    mdx(),
  ],
  build: {
    inlineStylesheets: 'always',
    format: 'file',
  },
  experimental: {
    clientPrerender: true,
    svgo: true,
  },
  publicDir: path.join(dirname, './docs/public'),
  prefetch: {
    defaultStrategy: 'hover',
  },
  server: {
    port: 3000,
    host: true,
  },
  srcDir: path.join(dirname, './docs'),
  root: path.join(dirname, './docs'),
  compressHTML: true,
  site,
})
