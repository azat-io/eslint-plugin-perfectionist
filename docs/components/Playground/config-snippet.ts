import type { SortingOrder, SortingType } from './lint-config'

import { REQUIRED_OPTIONS } from './rule-options'

/**
 * What the Playground lints with, as the config snippets need it.
 */
export interface ConfigInput {
  /**
   * Options from `eslint` comments in the code, keyed by rule name without the
   * plugin prefix. Values are the source text after the colon.
   */
  inline: Map<string, string>

  /**
   * Rule name without the plugin prefix, or `null` for all rules of the
   * recommended configs.
   */
  rule: string | null

  /**
   * Sorting order from the controls.
   */
  order: SortingOrder

  /**
   * Sorting type from the controls.
   */
  type: SortingType
}

const PRESETS: Partial<Record<string, string>> = {
  'alphabetical asc': 'recommended-alphabetical',
  'line-length desc': 'recommended-line-length',
  'natural asc': 'recommended-natural',
}

const FILE_HEADER = [
  '// eslint.config.js',
  "import perfectionist from 'eslint-plugin-perfectionist'",
  '',
]

let pluginPrefix = 'perfectionist/'

/**
 * Builds an `eslint.config.js` that lints the way the Playground does. Options
 * from `eslint` comments in the code become the rule entries, and the sorting
 * from the controls goes to the shared settings, as in the Playground.
 *
 * @param input - Rule, sorting and options from comments.
 * @returns File content.
 */
export function getConfigFile({
  inline,
  order,
  rule,
  type,
}: ConfigInput): string {
  let preset = getPreset(type, order)
  let inlineRules = [...inline].filter(
    ([name]) => rule === null || name === rule,
  )
  if (rule === null && preset && inlineRules.length === 0) {
    return [
      ...FILE_HEADER,
      `export default [perfectionist.configs['${preset}']]`,
      '',
    ].join('\n')
  }
  let lines = [...FILE_HEADER]
  if (rule === null) {
    lines.push(
      "let { rules } = perfectionist.configs['recommended-alphabetical']",
      '',
    )
  }
  lines.push(
    'export default [',
    '  {',
    '    plugins: { perfectionist },',
    '    rules: {',
  )
  if (rule === null) {
    lines.push(
      "      ...Object.fromEntries(Object.keys(rules).map(name => [name, 'error'])),",
    )
  } else if (!inline.has(rule)) {
    lines.push(`      ${getRuleSnippet(rule, type, order)},`)
  }
  for (let [name, value] of inlineRules) {
    lines.push(`      '${pluginPrefix}${name}': ${value},`)
  }
  lines.push('    },')
  if (rule === null || inlineRules.length > 0) {
    lines.push(`    ${getSettingsSnippet(type, order)},`)
  }
  lines.push('  },', ']', '')
  return lines.join('\n')
}

/**
 * Finds rule options set by `eslint` comments in the code, such as `/* eslint
 * perfectionist/sort-imports: ['error', { ... }] *\/`. They replace the options
 * of the rule for this code, so a config snippet has to include them.
 *
 * @param code - Code in the editor.
 * @returns Source text of each rule's value, by rule name.
 */
export function findInlineOptions(code: string): Map<string, string> {
  let result = new Map<string, string>()
  let comments = code.matchAll(/\/\*\s*eslint\s(?<body>[\s\S]*?)\*\//gu)
  for (let match of comments) {
    let entries = splitTopLevel(match.groups!['body']!)
    for (let entry of entries) {
      let colon = entry.indexOf(':')
      let name = entry.slice(0, colon).trim()
      if (colon !== -1 && name.startsWith(pluginPrefix)) {
        result.set(
          name.slice(pluginPrefix.length),
          entry.slice(colon + 1).trim(),
        )
      }
    }
  }
  return result
}

/**
 * Formats a value the way the docs write options in a config.
 *
 * @param value - Options, an array or a single value.
 * @returns JavaScript source of the value.
 */
export function formatValue(value: unknown): string {
  if (typeof value === 'string') {
    return `'${value.replaceAll('\\', '\\\\').replaceAll("'", String.raw`\'`)}'`
  }
  if (Array.isArray(value)) {
    return `[${value.map(formatValue).join(', ')}]`
  }
  if (value && typeof value === 'object') {
    let entries = Object.entries(value).map(
      ([key, entry]) => `${key}: ${formatValue(entry)}`,
    )
    return `{ ${entries.join(', ')} }`
  }
  return String(value)
}

/**
 * Returns the config entry of one rule with the chosen sorting.
 *
 * @param rule - Rule name without the plugin prefix.
 * @param type - Sorting type.
 * @param order - Sorting order.
 * @returns Entry such as `'perfectionist/sort-enums': ['error', {...}]`.
 */
export function getRuleSnippet(
  rule: string,
  type: SortingType,
  order: SortingOrder,
): string {
  let options = { order, type, ...REQUIRED_OPTIONS[rule] }
  return `'${pluginPrefix}${rule}': ['error', ${formatValue(options)}]`
}

/**
 * Returns the shared settings entry with the chosen sorting.
 *
 * @param type - Sorting type.
 * @param order - Sorting order.
 * @returns Entry such as `settings: { perfectionist: {...} }`.
 */
export function getSettingsSnippet(
  type: SortingType,
  order: SortingOrder,
): string {
  return `settings: { perfectionist: ${formatValue({ order, type })} }`
}

/**
 * Returns the recommended config that sorts every rule the same way.
 *
 * @param type - Sorting type.
 * @param order - Sorting order.
 * @returns Config name, or `undefined` when no preset matches.
 */
export function getPreset(
  type: SortingType,
  order: SortingOrder,
): undefined | string {
  return PRESETS[`${type} ${order}`]
}

/**
 * Splits the body of an `eslint` comment into its `name: value` entries at
 * commas outside brackets and strings.
 *
 * @param text - Comment body.
 * @returns Entries in order.
 */
function splitTopLevel(text: string): string[] {
  let entries: string[] = []
  let depth = 0
  let quote: string | null = null
  let start = 0
  for (let index = 0; index < text.length; index++) {
    let character = text[index]!
    if (quote) {
      if (character === '\\') {
        index++
      } else if (character === quote) {
        quote = null
      }
      continue
    }
    if (['"', "'", '`'].includes(character)) {
      quote = character
    } else if ('([{'.includes(character)) {
      depth++
    } else if (')]}'.includes(character)) {
      depth--
    } else if (character === ',' && depth === 0) {
      entries.push(text.slice(start, index))
      start = index + 1
    }
  }
  entries.push(text.slice(start))
  return entries
}
