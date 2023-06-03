import lightningcss from 'vite-plugin-lightningcss'
import { createWriteStream } from 'fs'
import { defineConfig } from 'vitepress'
import { SitemapStream } from 'sitemap'
import path from 'path'

import {
  description,
  changelog,
  keywords,
  homepage,
  version,
  github,
  title,
  image,
} from './meta'

let links: { url: string; lastmod?: number }[] = []

export default defineConfig({
  base: '/',
  title,
  description,
  head: [
    [
      'meta',
      {
        name: 'theme-color',
        content: '#252529',
      },
    ],
    [
      'link',
      {
        rel: 'icon',
        sizes: 'any',
        href: '/favicon.ico',
      },
    ],
    [
      'link',
      {
        rel: 'icon',
        type: 'image/svg+xml',
        href: '/favicon.svg',
      },
    ],
    [
      'meta',
      {
        name: 'author',
        content: 'Azat S.',
      },
    ],
    [
      'meta',
      {
        name: 'keywords',
        content: keywords.join(', '),
      },
    ],
    [
      'meta',
      {
        property: 'og:title',
        content: title,
      },
    ],
    [
      'meta',
      {
        property: 'og:description',
        content: description,
      },
    ],
    [
      'meta',
      {
        property: 'og:url',
        content: homepage,
      },
    ],
    [
      'meta',
      {
        property: 'og:image',
        content: image,
      },
    ],
    [
      'meta',
      {
        name: 'twitter:title',
        content: title,
      },
    ],
    [
      'meta',
      {
        name: 'twitter:creator',
        content: '@azat_io',
      },
    ],
    [
      'meta',
      {
        name: 'twitter:description',
        content: description,
      },
    ],
    [
      'meta',
      {
        name: 'twitter:image',
        content: image,
      },
    ],
    [
      'meta',
      {
        name: 'twitter:card',
        content: 'summary_large_image',
      },
    ],
    [
      'link',
      {
        rel: 'mask-icon',
        href: '/favicon.svg',
        color: '#252529',
      },
    ],
    [
      'link',
      {
        rel: 'apple-touch-icon',
        href: '/apple-touch-icon.png',
        sizes: '180x180',
      },
    ],
    [
      'script',
      {
        async: '',
        src: 'https://analytics.azat.io/script.js',
        'data-website-id': 'c69a8be1-771a-4504-b778-4d247c1069aa',
      },
    ],
  ],

  lastUpdated: true,

  markdown: {
    theme: {
      light: 'github-light',
      dark: 'github-dark',
    },
  },

  themeConfig: {
    logo: '/logo.svg',

    search: {
      provider: 'local',
    },

    nav: [
      {
        text: 'Guide',
        link: '/guide/introduction',
        activeMatch: '^/guide/',
      },
      {
        text: 'Configs',
        link: '/configs/',
        activeMatch: '^/configs/',
      },
      {
        text: 'Rules',
        link: '/rules/',
        activeMatch: '^/rules/',
      },
      {
        text: `v${version}`,
        items: [
          {
            text: 'Changelog ',
            link: changelog,
          },
        ],
      },
    ],

    sidebar: {
      '/': [
        {
          text: 'Guide',
          items: [
            {
              text: 'Introduction',
              link: '/guide/introduction',
            },
            {
              text: 'Getting Started',
              link: '/guide/getting-started',
            },
          ],
        },
        {
          text: 'Configs',
          items: [
            {
              text: 'recommended-alphabetical',
              link: '/configs/recommended-alphabetical',
            },
            {
              text: 'recommended-natural',
              link: '/configs/recommended-natural',
            },
            {
              text: 'recommended-line-length',
              link: '/configs/recommended-line-length',
            },
          ],
        },
        {
          text: 'Rules',
          items: [
            {
              text: 'sort-array-includes',
              link: '/rules/sort-array-includes',
            },
            {
              text: 'sort-enums',
              link: '/rules/sort-enums',
            },
            {
              text: 'sort-imports',
              link: '/rules/sort-imports',
            },
            {
              text: 'sort-interfaces',
              link: '/rules/sort-interfaces',
            },
            {
              text: 'sort-jsx-props',
              link: '/rules/sort-jsx-props',
            },
            {
              text: 'sort-map-elements',
              link: '/rules/sort-map-elements',
            },
            {
              text: 'sort-named-exports',
              link: '/rules/sort-named-exports',
            },
            {
              text: 'sort-named-imports',
              link: '/rules/sort-named-imports',
            },
            {
              text: 'sort-objects',
              link: '/rules/sort-objects',
            },
            {
              text: 'sort-union-types',
              link: '/rules/sort-union-types',
            },
          ],
        },
      ],
    },

    socialLinks: [
      {
        icon: 'github',
        link: github,
      },
    ],

    editLink: {
      pattern: `${github}/tree/main/docs/:path`,
      text: 'Suggest changes to this page',
    },

    footer: {
      message: 'Released under the MIT License',
      copyright: 'Copyright © Azat S.',
    },
  },

  cleanUrls: true,

  vite: {
    plugins: [lightningcss()],
  },

  transformHtml: (_, id, { pageData }) => {
    if (!/[/\\]404\.html$/.test(id)) {
      links.push({
        url: pageData.relativePath.replace(/((^|\/)index)?\.md$/, '$2'),
        lastmod: pageData.lastUpdated,
      })
    }
  },

  buildEnd: async ({ outDir }) => {
    let sitemap = new SitemapStream({
      hostname: 'https://eslint-plugin-perfectionist.azat.io/',
    })

    let writeStream = createWriteStream(path.resolve(outDir, 'sitemap.xml'))

    sitemap.pipe(writeStream)
    links.forEach(link => sitemap.write(link))
    sitemap.end()

    await new Promise(resolve => writeStream.on('finish', resolve))
  },
})
