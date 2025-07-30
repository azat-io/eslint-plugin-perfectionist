import type { CollectionEntry } from 'astro:content'
import type { ImageResponse } from '@vercel/og'

import { getCollection } from 'astro:content'

import { openGraph } from '../../../utils/open-graph'

interface Props {
  props: CollectionEntry<'guide'>
  params: {
    slug: string
  }
}

export async function getStaticPaths(): Promise<
  {
    params: {
      slug: string
    }
    props: CollectionEntry<'guide'>
  }[]
> {
  let rules = await getCollection('guide')
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
