import './process-shim'

import type { Linter as ESLintLinter } from 'eslint'

import { Linter } from 'eslint/universal'

import type { WorkerMessage, LintRequest } from './lint-config'

import { lintCode } from './lint-config'

/**
 * The parts of the worker global scope the linter uses.
 */
interface WorkerScope {
  /**
   * Listens for lint requests.
   */
  addEventListener(
    type: 'message',
    listener: (event: MessageEvent<LintRequest>) => void,
  ): void

  /**
   * Sends a result or a status to the page.
   */
  postMessage(message: WorkerMessage): void
}

/**
 * Position of a TypeScript parse error.
 */
interface ParseErrorLocation {
  /**
   * 1-based line and 0-based column where the error starts.
   */
  start?: { column?: unknown; line?: unknown }
}

type ServiceParser = Extract<ESLintLinter.Parser, { parseForESLint: unknown }>

let scope: unknown = globalThis
let worker = scope as WorkerScope

let linter = new Linter({ cwd: '/' })

let parserPromise = loadParser()

worker.addEventListener('message', event => {
  void lint(event.data)
})

try {
  await parserPromise
  worker.postMessage({ eslint: Linter.version, kind: 'ready' })
} catch (error) {
  worker.postMessage({
    message: error instanceof Error ? error.message : String(error),
    kind: 'load-failed',
  })
}

function restorePosition(error: unknown): void {
  if (typeof error !== 'object' || error === null || !('location' in error)) {
    return
  }
  let start = (error.location as ParseErrorLocation | undefined)?.start
  if (typeof start?.line !== 'number' || typeof start.column !== 'number') {
    return
  }
  Reflect.defineProperty(error, 'lineNumber', {
    configurable: true,
    value: start.line,
  })
  Reflect.defineProperty(error, 'column', {
    value: start.column,
    configurable: true,
  })
}

async function lint({ id, ...request }: LintRequest): Promise<void> {
  let parser: ESLintLinter.Parser
  try {
    parser = await parserPromise
  } catch {
    /* The failure is already reported with the `load-failed` message. */
    return
  }
  let startedAt = performance.now()
  let result = lintCode(linter, request, parser)
  worker.postMessage({ ...result, ms: performance.now() - startedAt, id })
}

/**
 * Loads the TypeScript parser. Bundlers expose its CommonJS exports either on
 * the namespace or on `default`; without this check ESLint would silently fall
 * back to espree and fail on the first `interface`.
 *
 * @returns The parser module.
 */
async function loadParser(): Promise<ESLintLinter.Parser> {
  let parserModule: unknown = await import('@typescript-eslint/parser')
  let candidates = [parserModule, getDefaultExport(parserModule)]
  let parser = candidates.find(isParser)
  if (!parser) {
    throw new Error('@typescript-eslint/parser does not export parseForESLint')
  }
  return withCodePositions(parser)
}

/**
 * Keeps parse errors at their place in the code. The TypeScript parser gives
 * the position through `lineNumber` and `column` getters, but errors in Firefox
 * and Safari have own properties with these names that point into the parser's
 * JavaScript, and ESLint reads those instead.
 *
 * @param parser - TypeScript parser.
 * @returns Parser whose errors carry the position in the parsed code.
 */
function withCodePositions(parser: ServiceParser): ESLintLinter.Parser {
  let wrapped = {
    parseForESLint: (text: string, options?: unknown) => {
      try {
        return parser.parseForESLint(text, options)
      } catch (error) {
        restorePosition(error)
        throw error
      }
    },
  }
  return parser.meta ? { ...wrapped, meta: parser.meta } : wrapped
}

function isParser(value: unknown): value is ServiceParser {
  return (
    typeof value === 'object' &&
    value !== null &&
    'parseForESLint' in value &&
    typeof value.parseForESLint === 'function'
  )
}

function getDefaultExport(value: unknown): unknown {
  return typeof value === 'object' && value !== null && 'default' in value ?
      value.default
    : null
}
