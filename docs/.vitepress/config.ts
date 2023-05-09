import { defineConfig } from 'vitepress'

import { github, description, changelog, version } from './meta'

export default defineConfig({
  base: '/',
  title: 'Perfectionist',
  description,
  head: [
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
  ],

  markdown: {
    theme: {
      light: 'github-light',
      dark: 'github-dark',
    },
  },

  themeConfig: {
    logo: '/logo.svg',

    nav: [
      {
        text: 'Guide',
        link: '/guide/',
        activeMatch: '^/guide/',
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
              text: 'Getting Started',
              link: '/guide/',
            },
          ],
        },
        {
          text: 'Rules',
          items: [
            {
              text: 'sort-interfaces',
              link: '/rules/sort-interfaces',
            },
            {
              text: 'sort-jsx-props',
              link: '/rules/sort-jsx-props',
            },
            {
              text: 'sort-named-imports',
              link: '/rules/sort-named-imports',
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
})
