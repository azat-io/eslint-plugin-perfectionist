import { defineCollection, z } from 'astro:content'
import { glob } from 'astro/loaders'
import path from 'node:path'

let guide = defineCollection({
  schema: z.object({
    keywords: z.array(z.string()).optional(),
    description: z.string(),
    title: z.string(),
  }),
  loader: glob({
    base: path.join(import.meta.dirname, 'guide'),
    pattern: '**/*.mdx',
  }),
})

let configs = defineCollection({
  schema: z.object({
    keywords: z.array(z.string()).optional(),
    shortDescription: z.string(),
    description: z.string(),
    title: z.string(),
  }),
  loader: glob({
    base: path.join(import.meta.dirname, 'configs'),
    pattern: '**/*.mdx',
  }),
})

let rules = defineCollection({
  schema: z.object({
    keywords: z.array(z.string()).optional(),
    deprecated: z.boolean().optional(),
    shortDescription: z.string(),
    description: z.string(),
    title: z.string(),
  }),
  loader: glob({
    base: path.join(import.meta.dirname, 'rules'),
    pattern: '**/*.mdx',
  }),
})

export let collections = {
  configs,
  guide,
  rules,
}
