import type { TSESTree } from '@typescript-eslint/types'

import { AST_NODE_TYPES } from '@typescript-eslint/types'

/**
 * Options read from the Options field.
 */
export interface ReadOptions {
  /**
   * `settings.perfectionist` from a pasted config, or `null` when there is
   * none.
   */
  settings: Record<string, unknown> | null

  /**
   * Options of the rule after the severity, or `null` when the text sets only
   * shared settings.
   */
  options: unknown[] | null
}

/**
 * Why the Options field could not be read.
 */
export interface OptionsError {
  /**
   * 1-based line and column in the Options field, or `null` when the error is
   * about the whole text.
   */
  position: { column: number; line: number } | null

  /**
   * What is wrong.
   */
  message: string
}

/**
 * Parses JavaScript into an AST and throws on syntax errors.
 */
export type ParseProgram = (code: string) => TSESTree.Program

/**
 * One way to read the text: how it is wrapped before parsing, and whether the
 * wrapped text is a single value that can be the options themselves.
 */
interface Reading {
  /**
   * Text added before the field text. It ends with a line break, so lines of
   * the field shift by one and columns stay as they are.
   */
  prefix: string

  /**
   * Text added after the field text.
   */
  suffix: string

  /**
   * The text is parsed as one expression.
   */
  value: boolean
}

/**
 * Thrown for a value the Playground cannot evaluate without running code.
 */
class UnsupportedValueError extends Error {
  public node: TSESTree.Node

  public constructor(
    message: string,
    options: { node: TSESTree.Node } & ErrorOptions,
  ) {
    super(message, options)
    this.name = 'UnsupportedValueError'
    this.node = options.node
  }
}

const READINGS: Record<'properties' | 'module' | 'value', Reading> = {
  properties: { prefix: '({\n', suffix: '\n})', value: true },
  value: { prefix: '(\n', suffix: '\n)', value: true },
  module: { value: false, prefix: '', suffix: '' },
}

const SEVERITIES = new Set<unknown>(['error', 'warn', 'off', 0, 1, 2])

/**
 * Keys of a config object. An object with them is a config, not options.
 */
const CONFIG_KEYS = new Set([
  'languageOptions',
  'linterOptions',
  'plugins',
  'ignores',
  'extends',
  'rules',
  'files',
])

/**
 * Wrappers that only change the type of a value, such as `as const`.
 */
const TYPE_ASSERTIONS = new Set<AST_NODE_TYPES>([
  AST_NODE_TYPES.TSSatisfiesExpression,
  AST_NODE_TYPES.TSNonNullExpression,
  AST_NODE_TYPES.TSAsExpression,
])

let pluginPrefix = 'perfectionist/'

/**
 * Reads the rule options from the Options field. The field takes an options
 * object, a rule entry such as `'perfectionist/sort-imports': ['error',
 * {...}]`, a `rules` block or a whole `eslint.config.js`. Only plain values are
 * read, so nothing in the text runs.
 *
 * @param text - Text of the Options field.
 * @param rule - Rule name without the plugin prefix.
 * @param parse - Parser for JavaScript and TypeScript.
 * @returns Options and settings, or an error with its position in the field.
 */
export function readOptions(
  text: string,
  rule: string,
  parse: ParseProgram,
): OptionsError | ReadOptions {
  let order = getReadingOrder(text)
  let firstError: OptionsError | null = null
  for (let name of order) {
    let reading = READINGS[name]
    let program: TSESTree.Program
    try {
      program = parse(`${reading.prefix}${text}${reading.suffix}`)
    } catch (error) {
      firstError ??= toSyntaxError(error, reading)
      continue
    }
    try {
      return readProgram(program, rule, reading)
    } catch (error) {
      if (error instanceof UnsupportedValueError) {
        return toFieldError(error.message, error.node.loc.start, reading)
      }
      throw error
    }
  }
  return (
    firstError ?? {
      message: 'The options could not be read.',
      position: null,
    }
  )
}

/**
 * Finds the options of the rule in a parsed text.
 *
 * @param program - Parsed text.
 * @param rule - Rule name without the plugin prefix.
 * @param reading - How the text was wrapped.
 * @returns Options and settings.
 */
function readProgram(
  program: TSESTree.Program,
  rule: string,
  reading: Reading,
): OptionsError | ReadOptions {
  let entries = new Map<string, TSESTree.Property>()
  let settings: TSESTree.Property | null = null
  for (let node of walk(program)) {
    if (node.type !== AST_NODE_TYPES.Property) {
      continue
    }
    let key = getKey(node)
    if (key?.startsWith(pluginPrefix) && !entries.has(key)) {
      entries.set(key, node)
    } else if (key === 'settings' && !settings) {
      settings = findProperty(node.value, 'perfectionist')
    }
  }
  let settingsValue = settings ? readSettings(settings) : null
  let entry = entries.get(`${pluginPrefix}${rule}`)
  if (entry) {
    return { options: readEntry(entry.value), settings: settingsValue }
  }
  let others = Array.from(entries.keys(), key => key.slice(pluginPrefix.length))
  if (!settingsValue && others.length > 0) {
    return {
      message: `These are options for ${others.join(', ')}, not ${rule}. Pick that rule, or paste the options of ${rule}.`,
      position: null,
    }
  }
  if (settingsValue) {
    return { settings: settingsValue, options: null }
  }
  let value = reading.value ? getExpression(program) : null
  if (value?.type === AST_NODE_TYPES.ArrayExpression) {
    return { options: readEntry(value), settings: null }
  }
  if (
    value?.type === AST_NODE_TYPES.ObjectExpression &&
    value.properties.every(property => !CONFIG_KEYS.has(getKey(property) ?? ''))
  ) {
    return { options: [evaluate(value)], settings: null }
  }
  return {
    message: `Paste an options object, an entry for ${pluginPrefix}${rule} or your eslint.config.js.`,
    position: null,
  }
}

/**
 * Evaluates a node that holds only plain values: objects, arrays, strings,
 * numbers, booleans and `null`.
 *
 * @param expression - Expression to evaluate.
 * @returns The value.
 */
function evaluate(expression: TSESTree.Node): unknown {
  let node = unwrap(expression)
  switch (node.type) {
    case AST_NODE_TYPES.ObjectExpression:
      return evaluateObject(node)
    case AST_NODE_TYPES.UnaryExpression:
      if (
        (node.operator === '-' || node.operator === '+') &&
        node.argument.type === AST_NODE_TYPES.Literal &&
        typeof node.argument.value === 'number'
      ) {
        return node.operator === '-' ?
            -node.argument.value
          : node.argument.value
      }
      break
    case AST_NODE_TYPES.ArrayExpression:
      return node.elements.map(element => {
        if (!element || element.type === AST_NODE_TYPES.SpreadElement) {
          throw new UnsupportedValueError(
            'Spread and empty array items are not supported. Write the values out.',
            { node: element ?? node },
          )
        }
        return evaluate(element)
      })
    case AST_NODE_TYPES.TemplateLiteral:
      if (node.expressions.length === 0) {
        return node.quasis[0]!.value.cooked
      }
      break
    case AST_NODE_TYPES.Literal:
      if ('regex' in node) {
        throw new UnsupportedValueError(
          "Regular expressions don't pass the options schema. Use a string, such as '^react$'.",
          { node },
        )
      }
      if (typeof node.value !== 'bigint') {
        return node.value
      }
      break
    // No default
  }
  throw new UnsupportedValueError(
    'Only plain values are supported here: objects, arrays, strings, numbers and booleans.',
    { node },
  )
}

function evaluateObject(
  node: TSESTree.ObjectExpression,
): Record<string, unknown> {
  let result: Record<string, unknown> = {}
  for (let property of node.properties) {
    if (property.type === AST_NODE_TYPES.SpreadElement) {
      throw new UnsupportedValueError(
        'Spread is not supported. Write the properties out.',
        { node: property },
      )
    }
    let key = getKey(property)
    if (key === null || property.shorthand || property.kind !== 'init') {
      throw new UnsupportedValueError(
        'Only plain values are supported here: objects, arrays, strings, numbers and booleans.',
        { node: property },
      )
    }
    let { value } = property
    if (
      value.type === AST_NODE_TYPES.Identifier &&
      value.name === 'undefined'
    ) {
      continue
    }
    result[key] = evaluate(value)
  }
  return result
}

function getErrorStart(error: unknown): { column: number; line: number } {
  if (typeof error === 'object' && error !== null && 'location' in error) {
    let { location } = error as {
      location?: { start?: { column?: unknown; line?: unknown } }
    }
    let start = location?.start
    if (typeof start?.line === 'number' && typeof start.column === 'number') {
      return { column: start.column, line: start.line }
    }
  }
  return { column: 0, line: 1 }
}

/**
 * Reads the value of a rule entry: a severity alone, an array of the severity
 * and the options, or an array of options as rule tests write them.
 *
 * @param node - Value of the entry.
 * @returns Options after the severity.
 */
function readEntry(node: TSESTree.Node): unknown[] {
  let value = evaluate(node)
  if (SEVERITIES.has(value)) {
    return []
  }
  if (Array.isArray(value) && SEVERITIES.has(value[0])) {
    return value.slice(1)
  }
  if (Array.isArray(value) && value.length > 0 && value.every(isObject)) {
    return value
  }
  throw new UnsupportedValueError(
    "A rule entry is a severity or an array such as ['error', { ... }].",
    { node },
  )
}

/**
 * Orders the ways to read the text by what it looks like, so the error of the
 * most likely reading is the one shown.
 *
 * @param text - Text of the Options field.
 * @returns Names of the readings in order.
 */
function getReadingOrder(text: string): (keyof typeof READINGS)[] {
  let start = text.replace(/^(?:\s|\/\/[^\n]*|\/\*[\s\S]*?\*\/)*/u, '')
  if (/^[[{]/u.test(start)) {
    return ['value', 'properties', 'module']
  }
  if (/^(?:const|export|import|let|module|var)\b/u.test(start)) {
    return ['module', 'value', 'properties']
  }
  return ['properties', 'value', 'module']
}

function getKey(property: TSESTree.Node): string | null {
  if (property.type !== AST_NODE_TYPES.Property) {
    return null
  }
  let { computed, key } = property
  if (!computed && key.type === AST_NODE_TYPES.Identifier) {
    return key.name
  }
  if (key.type === AST_NODE_TYPES.Literal && typeof key.value !== 'object') {
    return String(key.value)
  }
  return null
}

/**
 * Yields every node of the tree, parents first.
 *
 * @param node - Root node.
 * @yields Nodes in source order.
 */
function* walk(node: TSESTree.Node): Generator<TSESTree.Node> {
  yield node
  for (let [key, value] of Object.entries(node)) {
    if (key === 'parent') {
      continue
    }
    let children: unknown[] = Array.isArray(value) ? value : [value]
    for (let child of children) {
      if (isNode(child)) {
        yield* walk(child)
      }
    }
  }
}

/**
 * Builds an error at a position in the wrapped text, moved to the Options
 * field.
 *
 * @param message - What is wrong.
 * @param start - 1-based line and 0-based column in the parsed text.
 * @param reading - How the text was wrapped.
 * @returns Error with a 1-based position in the field.
 */
function toFieldError(
  message: string,
  start: { column: number; line: number },
  reading: Reading,
): OptionsError {
  let shift = reading.prefix.split('\n').length - 1
  return {
    position: {
      line: Math.max(1, start.line - shift),
      column: start.column + 1,
    },
    message,
  }
}

function findProperty(
  node: TSESTree.Node,
  name: string,
): TSESTree.Property | null {
  if (node.type !== AST_NODE_TYPES.ObjectExpression) {
    return null
  }
  return (
    node.properties.find(
      (property): property is TSESTree.Property => getKey(property) === name,
    ) ?? null
  )
}

function readSettings(property: TSESTree.Property): Record<string, unknown> {
  let value = evaluate(property.value)
  if (!isObject(value)) {
    throw new UnsupportedValueError(
      'settings.perfectionist should be an object.',
      { node: property.value },
    )
  }
  return value
}

function getExpression(program: TSESTree.Program): TSESTree.Node | null {
  let [statement] = program.body
  return statement?.type === AST_NODE_TYPES.ExpressionStatement ?
      unwrap(statement.expression)
    : null
}

function toSyntaxError(error: unknown, reading: Reading): OptionsError {
  let message = error instanceof Error ? error.message : String(error)
  return toFieldError(message, getErrorStart(error), reading)
}

function isTypeAssertion(
  node: TSESTree.Node,
): node is
  | TSESTree.TSSatisfiesExpression
  | TSESTree.TSNonNullExpression
  | TSESTree.TSAsExpression {
  return TYPE_ASSERTIONS.has(node.type)
}

function isNode(value: unknown): value is TSESTree.Node {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as { type?: unknown }).type === 'string'
  )
}

/**
 * Skips type assertions around a value, such as `as const`.
 *
 * @param node - Expression.
 * @returns The expression inside the assertions.
 */
function unwrap(node: TSESTree.Node): TSESTree.Node {
  let current = node
  while (isTypeAssertion(current)) {
    current = current.expression
  }
  return current
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
