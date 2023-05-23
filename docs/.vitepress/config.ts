import lightningcss from 'vite-plugin-lightningcss'
import { defineConfig } from 'vitepress'

import { github, description, keywords, changelog, title, homepage, image, version } from './meta'

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
  ],

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
              text: 'sort-object-keys',
              link: '/rules/sort-object-keys',
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
})
