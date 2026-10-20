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

import {
  playgroundBuildInfo,
  playgroundShims,
} from './docs/plugins/playground-shims'
import { remarkHeadings } from './docs/plugins/remark-headings'
import { colorTheme } from './docs/utils/shiki-theme'

let site = 'https://perfectionist.dev'
let guidePageRegex = new RegExp(`^${site}/guide$`, 'u')

export default defineConfig({
  vite: {
    optimizeDeps: {
      include: [
        'astro/virtual-modules/transitions-events.js',
        'astro/virtual-modules/transitions-router.js',
        'astro/virtual-modules/transitions-swap-functions.js',
        'astro/virtual-modules/transitions-types.js',
        'eslint/universal',
        '@typescript-eslint/parser',
        '@typescript-eslint/types',
        '@typescript-eslint/utils/ast-utils',
        '@typescript-eslint/utils/eslint-utils',
        'natural-orderby',
      ],
      rolldownOptions: {
        plugins: [playgroundShims()],
      },
      exclude: ['@shikijs/magic-move'],
    },
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
      playgroundBuildInfo(),
      {
        ...playgroundShims(),
        applyToEnvironment: environment =>
          environment.config.consumer === 'client',
      },
    ],
    worker: {
      plugins: () => [playgroundShims()],
      format: 'es',
    },
    resolve: {
      noExternal: ['@shikijs/magic-move'],
    },
  },
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
