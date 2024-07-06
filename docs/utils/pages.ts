import { getCollection } from 'astro:content'

let rules = await getCollection('rules')
let rulesLinks = rules.map(({ data: { title }, slug }) => ({
  url: `/rules/${slug}`,
  title,
}))

interface Page {
  redirect?: boolean
  title: string
  url: string
}

export let pages: ({ links: Page[] } & Page)[] = [
  {
    links: [
      {
        url: '/guide/introduction',
        title: 'Introduction',
      },
      {
        url: '/guide/integrations',
        title: 'Integrations',
      },
      {
        url: '/guide/getting-started',
        title: 'Getting Started',
      },
    ],
    title: 'Guide',
    redirect: true,
    url: '/guide',
  },
  {
    links: [
      {
        url: '/configs/recommended-alphabetical',
        title: 'recommended-alphabetical',
      },
      {
        url: '/configs/recommended-natural',
        title: 'recommended-natural',
      },
      {
        url: '/configs/recommended-line-length',
        title: 'recommended-line-length',
      },
    ],
    title: 'Configs',
    url: '/configs',
  },
  {
    links: rulesLinks,
    title: 'Rules',
    url: '/rules',
  },
]
