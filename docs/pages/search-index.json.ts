import type { APIRoute } from 'astro'

import { getCollection } from 'astro:content'

import type { SearchCollection } from '../utils/search'

import { createSearchIndexItem } from '../utils/search'

let collections: SearchCollection[] = ['guide', 'configs', 'rules']

export const GET: APIRoute = async () => {
  let items = await Promise.all(
    collections.map(async collection => {
      let entries = await getCollection(collection)
      return Promise.all(
        entries.map(entry => createSearchIndexItem(collection, entry)),
      )
    }),
  )

  return new Response(JSON.stringify(items.flat()), {
    headers: {
      'content-type': 'application/json; charset=utf-8',
    },
  })
}
