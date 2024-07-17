import rehypeExternalLinks from 'rehype-external-links'
import { browserslistToTargets } from 'lightningcss'
import svelteSvg from '@poppanator/sveltekit-svg'
import remarkSectionize from 'remark-sectionize'
import { defineConfig } from 'astro/config'
import compress from '@playform/compress'
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
    shikiConfig: {
      transformers: [
        {
          pre: node => {
            delete node.properties.tabindex
            delete node.properties.style
          },
        },
      ],
      theme: colorTheme,
    },
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
  },
  integrations: [
    compress({
      JavaScript: true,
      Image: true,
      CSS: false,
      HTML: true,
      SVG: true,
    }),
    svelte({
      compilerOptions: {
        cssHash: ({ hash, css }) => `s-${hash(css)}`,
        discloseVersion: false,
      },
    }),
    sitemap({
      filter: page => !new RegExp(`^${site}/guide$`).test(page),
    }),
    mdx(),
  ],
  vite: {
    css: {
      lightningcss: {
        targets: browserslistToTargets(
          browserslist(null, {
            config: path.join(dirname, './.browserslistrc'),
          }),
        ),
      },
      transformer: 'lightningcss',
    },
    plugins: [
      // @ts-ignore
      svelteSvg(),
    ],
  },
  prefetch: {
    defaultStrategy: 'viewport',
    prefetchAll: true,
  },
  build: {
    inlineStylesheets: 'always',
    format: 'file',
  },
  experimental: {
    clientPrerender: true,
  },
  publicDir: path.join(dirname, './docs/public'),
  server: {
    port: 3000,
    host: true,
  },
  srcDir: path.join(dirname, './docs'),
  root: path.join(dirname, './docs'),
  compressHTML: true,
  site,
})
