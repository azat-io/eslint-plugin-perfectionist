import { transformerNotationDiff } from '@shikijs/transformers'
import { svgoOptimizer, defineConfig } from 'astro/config'
import rehypeExternalLinks from 'rehype-external-links'
import { browserslistToTargets } from 'lightningcss'
import { unified } from '@astrojs/markdown-remark'
import svelteSvg from '@poppanator/sveltekit-svg'
import remarkSectionize from 'remark-sectionize'
import browserslist from 'browserslist'
import sitemap from '@astrojs/sitemap'
import svelte from '@astrojs/svelte'
import mdx from '@astrojs/mdx'

import { remarkHeadings } from './docs/plugins/remark-headings'
import { colorTheme } from './docs/utils/shiki-theme'

let site = 'https://perfectionist.dev'
let guidePageRegex = new RegExp(`^${site}/guide$`, 'u')

export default defineConfig({
  markdown: {
    processor: unified({
      rehypePlugins: [
        [
          rehypeExternalLinks,
          {
            rel: ['noopener', 'noreferrer'],
            target: '_blank',
          },
        ],
      ],
      remarkPlugins: [remarkSectionize, remarkHeadings],
    }),
    shikiConfig: {
      transformers: [
        transformerNotationDiff({
          matchAlgorithm: 'v3',
        }),
      ],
      theme: colorTheme,
    },
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
    optimizeDeps: {
      exclude: ['shiki-magic-move'],
    },
    resolve: {
      noExternal: ['shiki-magic-move'],
    },
    plugins: [
      // @ts-ignore
      svelteSvg(),
    ],
  },
  integrations: [
    svelte(),
    sitemap({
      filter: page => !guidePageRegex.test(page),
    }),
    mdx(),
  ],
  experimental: {
    svgOptimizer: svgoOptimizer(),
    clientPrerender: true,
  },
  build: {
    inlineStylesheets: 'always',
    format: 'file',
  },
  prefetch: {
    defaultStrategy: 'hover',
  },
  server: {
    port: 3000,
    host: true,
  },
  publicDir: './docs/public',
  compressHTML: true,
  srcDir: './docs',
  root: './docs',
  site,
})
