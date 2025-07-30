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

export async function getStaticPaths(): Promise<
  {
    params: {
      slug: string
    }
    props: CollectionEntry<'configs'>
  }[]
> {
  let rules = await getCollection('configs')
  return rules.map(currentRule => ({
    params: {
      slug: currentRule.id,
    },
    props: currentRule,
  }))
}

export async function GET({ props }: Props): Promise<ImageResponse> {
  return await openGraph(props.id)
}
