import type { APIRoute } from 'astro'

import { getCollection } from 'astro:content'

export const GET: APIRoute = async () => {
  let rules = (await getCollection('rules')).toSorted((first, second) =>
    first.id.localeCompare(second.id),
  )

  let lines = [
    '# Playground',
    '',
    'Try ESLint Plugin Perfectionist in the browser: paste code, pick a rule and a sorting style, and press Sort to apply the autofix.',
    'ESLint runs in a web worker on your device, so the code is never sent to a server.',
    '',
    '- [Open the Playground](/playground)',
    '',
    '## What runs',
    '',
    '- ESLint with the TypeScript parser. Code is parsed as TSX, so JSX, plain JavaScript and most TypeScript work.',
    '- Perfectionist built from the `main` branch. It can be ahead of the latest release; the page shows the exact versions.',
    '- Either one rule or all rules of the recommended configs. Rules run with their default options and `settings.perfectionist` set to the chosen `type` and `order`.',
    '',
    '## Link format',
    '',
    'The state lives in the URL hash, written like a query string: `/playground#rule=sort-objects&type=line-length`.',
    'Parameters equal to their defaults can be left out.',
    '',
    '| Parameter | Values | Default |',
    '| --- | --- | --- |',
    '| `v` | `1` | `1` |',
    '| `rule` | A rule name, such as `sort-imports` | All rules of the recommended configs |',
    '| `type` | `alphabetical`, `natural`, `line-length` | `alphabetical` |',
    '| `order` | `asc`, `desc` | `desc` for `line-length`, `asc` otherwise |',
    '| `code` | UTF-8 code compressed with raw deflate and encoded as base64url | The example of the rule, or the homepage example when `rule` is not set |',
    '',
    '## Differences from running ESLint locally',
    '',
    "- Only `type` and `order` have controls. Set other options with a comment in the code, such as `/* eslint perfectionist/sort-objects: ['error', { partitionByComment: true }] */`.",
    '- `sort-arrays` sorts only arrays with `as const`, because the rule needs `useConfigurationIf` to run. A comment can set another `useConfigurationIf`.',
    '- Syntax that only works in `.ts` files does not parse: write `<T,>(value: T) => value` instead of `<T>(value: T) => value`, and `value as Type` instead of `<Type>value`.',
    "- ESLint's built-in rules and other plugins are not loaded, so comments that configure them are ignored.",
    "- Strings are compared with the browser's `Intl`, which can order some characters differently from Node.js.",
    '',
    '## Rules',
    '',
    ...rules.map(
      rule =>
        `- [${rule.data.title}](/rules/${rule.id}.md): [open the example](/playground#rule=${rule.id})`,
    ),
    '',
  ]

  return new Response(lines.join('\n'), {
    headers: {
      'content-type': 'text/markdown; charset=utf-8',
    },
  })
}
