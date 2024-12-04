import type { CollectionEntry } from 'astro:content'
import type { ImageResponse } from '@vercel/og'

import { getCollection } from 'astro:content'

import { openGraph } from '../../../utils/open-graph'

interface Props {
  props: CollectionEntry<'configs'>
  params: {
    slug: string
  }
}

export let GET = async ({ props }: Props): Promise<ImageResponse> =>
  await openGraph(props.id)

export let getStaticPaths = async (): Promise<
  {
    params: {
      slug: string
    }
    props: CollectionEntry<'configs'>
  }[]
> => {
  let rules = await getCollection('configs')
  return rules.map(currentRule => ({
    params: {
      slug: currentRule.id,
    },
    props: currentRule,
  }))
}
