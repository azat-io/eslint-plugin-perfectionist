import lightningcss from 'vite-plugin-lightningcss'
import { defineConfig } from 'vitepress'

import {
  contributing,
  description,
  repository,
  changelog,
  keywords,
  homepage,
  version,
  title,
  image,
} from './meta'
import plugin from '../../index'

let links: { lastmod?: number; url: string }[] = []

let { configs, rules } = plugin

export default defineConfig({
  base: '/',
  title,
  description,
  head: [
    [
      'meta',
      {
        name: 'theme-color',
        content: '#1e1e20',
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
            text: 'Changelog',
            link: changelog,
          },
          {
            text: 'Contributing',
            link: contributing,
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
              text: 'Why',
              link: '/guide/why',
            },
            {
              text: 'Integrations',
              link: '/guide/integrations',
            },
            {
              text: 'Getting Started',
              link: '/guide/getting-started',
            },
          ],
        },
        {
          text: 'Configs',
          items: Object.keys(configs).map(config => ({
            text: config,
            link: `/configs/${config}`,
          })),
        },
        {
          text: 'Rules',
          items: Object.keys(rules).map(rule => ({
            text: rule,
            link: `/rules/${rule}`,
          })),
        },
      ],
    },

    socialLinks: [
      {
        icon: 'github',
        link: repository,
      },
    ],

    editLink: {
      pattern: `${repository}/tree/main/docs/:path`,
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

  sitemap: {
    hostname: 'https://eslint-plugin-perfectionist.azat.io/',
  },
})
