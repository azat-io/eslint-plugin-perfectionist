import type { AppliedConfig, SortingOrder, SortingType } from './lint-config'

import { getDefaultOptions } from './rule-options'

/**
 * What the Playground lints with, as the config snippets need it.
 */
export interface ConfigInput {
  /**
   * Rule setup of the last lint, or `null` before the first result and when the
   * Options field could not be read.
   */
  config: AppliedConfig | null

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

/**
 * Lines longer than this are broken, as Prettier does.
 */
const PRINT_WIDTH = 80

/**
 * Settings keys that the sorting controls set, in the order the docs write
 * them.
 */
const SORTING_KEYS = ['type', 'order']

let pluginPrefix = 'perfectionist/'

/**
 * Builds an `eslint.config.js` that lints the way the Playground does. The
 * sorting goes into the options of each rule entry, as the docs write it, and
 * other shared settings from the Options field stay in `settings`.
 *
 * @param input - Rule, sorting and the setup of the last lint.
 * @returns File content.
 */
export function getConfigFile({
  config,
  order,
  rule,
  type,
}: ConfigInput): string {
  let settings = config?.settings ?? { order, type }
  let sorting = pickSorting(settings)
  let otherSettings = omit(settings, new Set(SORTING_KEYS))
  let hasOtherSettings = Object.keys(otherSettings).length > 0
  let entries: [string, unknown][] = []
  if (rule) {
    let options = config?.options ?? getDefaultOptions(rule)
    entries.push([rule, ['error', ...withSorting(options, sorting)]])
  } else if (config) {
    let inlineEntries = Object.entries(config.inline)
    for (let [name, options] of inlineEntries) {
      entries.push([name, ['error', ...withSorting(options, sorting)]])
    }
  }
  let preset =
    rule === null && !hasOtherSettings ?
      getPreset(String(settings['type']), String(settings['order']))
    : undefined
  let lines = [...FILE_HEADER]
  if (rule === null && !preset) {
    lines.push(
      "let { rules } = perfectionist.configs['recommended-alphabetical']",
      '',
    )
  }
  lines.push('export default [')
  if (preset) {
    lines.push(`  perfectionist.configs['${preset}'],`)
  }
  if (!preset || entries.length > 0) {
    lines.push('  {')
    if (!preset) {
      lines.push('    plugins: { perfectionist },')
    }
    lines.push('    rules: {')
    if (rule === null && !preset) {
      lines.push(
        "      ...Object.fromEntries(Object.keys(rules).map(name => [name, 'error'])),",
      )
    }
    for (let [name, value] of entries) {
      let key = `'${pluginPrefix}${name}': `
      lines.push(`      ${key}${formatValue(value, 6, key.length)},`)
    }
    lines.push('    },')
    let sharedSettings =
      rule === null && !preset ?
        { ...sorting, ...otherSettings }
      : otherSettings
    if (Object.keys(sharedSettings).length > 0) {
      let prefix = 'perfectionist: '
      lines.push(
        '    settings: {',
        `      ${prefix}${formatValue(sharedSettings, 6, prefix.length)},`,
        '    },',
      )
    }
    lines.push('  },')
  }
  lines.push(']', '')
  return lines.join('\n')
}

/**
 * Formats a value the way Prettier would write it in a config: on one line when
 * it fits, otherwise one item per line with trailing commas.
 *
 * @param value - Options, an array or a single value.
 * @param indent - Columns before the line the value starts on.
 * @param offset - Columns taken on that line before the value, such as a key.
 * @returns JavaScript source of the value.
 */
export function formatValue(value: unknown, indent = 0, offset = 0): string {
  let flat = formatFlat(value)
  if (
    typeof value !== 'object' ||
    value === null ||
    indent + offset + flat.length <= PRINT_WIDTH
  ) {
    return flat
  }
  let inner = ' '.repeat(indent + 2)
  let close = ' '.repeat(indent)
  if (Array.isArray(value)) {
    let items = value.map(item => `${inner}${formatValue(item, indent + 2)},`)
    return ['[', ...items, `${close}]`].join('\n')
  }
  let items = Object.entries(value).map(([key, entry]) => {
    let name = `${formatKey(key)}: `
    return `${inner}${name}${formatValue(entry, indent + 2, name.length)},`
  })
  return ['{', ...items, `${close}}`].join('\n')
}

/**
 * Adds the sorting to each options object of a rule entry, unless the object
 * sets it itself. A rule entry without options gets an object with the sorting
 * alone.
 *
 * @param options - Options of the rule after the severity.
 * @param sorting - Sorting type and order.
 * @returns Options with the sorting.
 */
export function withSorting(
  options: unknown[],
  sorting: Record<string, unknown>,
): unknown[] {
  if (options.length === 0) {
    return [sorting]
  }
  return options.map(option =>
    isObject(option) ?
      { ...omit(sorting, new Set(Object.keys(option))), ...option }
    : option,
  )
}

/**
 * Returns the sorting type and order from shared settings.
 *
 * @param settings - `settings.perfectionist`.
 * @returns Type and order, in this order.
 */
export function pickSorting(
  settings: Record<string, unknown>,
): Record<string, unknown> {
  return Object.fromEntries(
    SORTING_KEYS.filter(key => Object.hasOwn(settings, key)).map(key => [
      key,
      settings[key],
    ]),
  )
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
  return `settings: { perfectionist: ${formatFlat(pickSorting({ order, type }))} }`
}

/**
 * Returns the text the Options field starts with: the options the rule runs
 * with when nothing is set, so the field can be edited right away.
 *
 * @param rule - Rule name without the plugin prefix.
 * @returns Options object as JavaScript source.
 */
export function getDefaultOptionsText(rule: string): string {
  return formatValue(getDefaultOptions(rule)[0] ?? {})
}

/**
 * Returns the recommended config that sorts every rule the same way.
 *
 * @param type - Sorting type.
 * @param order - Sorting order.
 * @returns Config name, or `undefined` when no preset matches.
 */
export function getPreset(type: string, order: string): undefined | string {
  return PRESETS[`${type} ${order}`]
}

/**
 * Formats a value on one line.
 *
 * @param value - Value to format.
 * @returns JavaScript source of the value.
 */
function formatFlat(value: unknown): string {
  if (typeof value === 'string') {
    return formatString(value)
  }
  if (Array.isArray(value)) {
    return `[${value.map(formatFlat).join(', ')}]`
  }
  if (isObject(value)) {
    let entries = Object.entries(value).map(
      ([key, entry]) => `${formatKey(key)}: ${formatFlat(entry)}`,
    )
    return entries.length > 0 ? `{ ${entries.join(', ')} }` : '{}'
  }
  return String(value)
}

/**
 * Writes a string in single quotes. Line breaks and other control characters
 * are escaped, so the literal stays on one line.
 *
 * @param value - String to write.
 * @returns String literal.
 */
function formatString(value: string): string {
  let escaped = JSON.stringify(value)
    .slice(1, -1)
    .replaceAll(String.raw`\"`, '"')
    .replaceAll("'", String.raw`\'`)
  return `'${escaped}'`
}

function omit(
  object: Record<string, unknown>,
  keys: Set<string>,
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(object).filter(([key]) => !keys.has(key)),
  )
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function formatKey(key: string): string {
  return /^[$A-Z_a-z][\w$]*$/u.test(key) ? key : formatString(key)
}
