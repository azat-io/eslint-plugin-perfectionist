import { defineCollection } from 'astro:content'
import { glob } from 'astro/loaders'
import { z } from 'astro/zod'
import path from 'node:path'

let guide = defineCollection({
  schema: z.object({
    keywords: z.array(z.string()).optional(),
    description: z.string(),
    title: z.string(),
  }),
  loader: glob({
    base: path.join(import.meta.dirname, 'content', 'guide'),
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
    base: path.join(import.meta.dirname, 'content', 'configs'),
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
    base: path.join(import.meta.dirname, 'content', 'rules'),
    pattern: '**/*.mdx',
  }),
})

export let collections = {
  configs,
  guide,
  rules,
}
