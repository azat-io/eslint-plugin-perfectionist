import type { Plugin } from 'vite'

import { builtinModules, createRequire } from 'node:module'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

interface BuildInfo {
  perfectionist: string
  commit: string | null
  typescript: string
  release: boolean
  parser: string
}

let builtinModulesId = 'virtual:playground-builtin-modules'
let resolvedBuiltinModulesId = `\0${builtinModulesId}`

let buildInfoId = 'virtual:playground-build-info'
let resolvedBuildInfoId = `\0${buildInfoId}`

let emptyRulesId = '\0playground-empty-eslint-rules'

let require = createRequire(import.meta.url)

/**
 * ESLint loads `esquery` with `require()`. The browser build of `esquery` has
 * only a default export, so `require()` would return an object without `parse`,
 * and every selector with a combinator, such as the one `sort-arrays` needs,
 * would throw. Its CommonJS build keeps the methods.
 */
let esqueryPath = createRequire(require.resolve('eslint/package.json')).resolve(
  'esquery',
)

/**
 * Browser stand-ins for the Node modules that ESLint, the TypeScript parser and
 * the plugin import. Keys are matched exactly, so `node:fs/promises` used by
 * server-side code never resolves to the `node:fs` stub.
 */
let shims = new Map(
  Object.entries({
    'node:module': 'module.ts',
    'node:util': 'utility.ts',
    'node:path': 'path.ts',
    tinyglobby: 'glob.ts',
    'node:url': 'url.ts',
    module: 'module.ts',
    'node:fs': 'fs.ts',
    util: 'utility.ts',
    path: 'path.ts',
    url: 'url.ts',
    fs: 'fs.ts',
  }).map(([id, file]) => [
    id,
    fileURLToPath(new URL(`playground-shims/${file}`, import.meta.url)),
  ]),
)

/**
 * Resolves Node built-ins to browser shims for the playground linter.
 *
 * It also replaces the map of ESLint's built-in rules with an empty one. The
 * playground lints only with Perfectionist, and the core rules make up about
 * half of the linter bundle. ESLint's `esquery` import gets the CommonJS
 * build.
 *
 * Register it for the client environment, for worker bundles and for the
 * dependency optimizer. Server-side environments must keep the real modules.
 *
 * @returns A Vite plugin.
 */
export function playgroundShims(): Plugin {
  return {
    resolveId: (id, importer) => {
      if (id === builtinModulesId) {
        return resolvedBuiltinModulesId
      }
      if (
        id === '../rules' &&
        importer?.endsWith('/eslint/lib/config/default-config.js')
      ) {
        return emptyRulesId
      }
      if (
        id === 'esquery' &&
        importer?.endsWith('/eslint/lib/linter/esquery.js')
      ) {
        return esqueryPath
      }
      return shims.get(id)
    },
    load: id => {
      if (id === resolvedBuiltinModulesId) {
        return `export default ${JSON.stringify(builtinModules)}`
      }
      if (id === emptyRulesId) {
        return 'module.exports = new Map()'
      }
      return null
    },
    name: 'playground-shims',
    enforce: 'pre',
  }
}

/**
 * Provides `virtual:playground-build-info`: the versions the playground runs
 * and the commit it was built from. The docs deploy from `main`, so the plugin
 * source can be ahead of the last release.
 *
 * @returns A Vite plugin.
 */
export function playgroundBuildInfo(): Plugin {
  return {
    load: id =>
      id === resolvedBuildInfoId ?
        `export default ${JSON.stringify(readBuildInfo())}`
      : null,
    resolveId: id => (id === buildInfoId ? resolvedBuildInfoId : null),
    name: 'playground-build-info',
  }
}

function readBuildInfo(): BuildInfo {
  let perfectionist = readVersion('../../package.json')
  let commit = runGit(['rev-parse', '--short', 'HEAD'])
  return {
    release:
      runGit(['describe', '--tags', '--exact-match']) === `v${perfectionist}`,
    parser: readVersion('@typescript-eslint/parser/package.json'),
    typescript: readVersion('typescript/package.json'),
    perfectionist,
    commit,
  }
}

function runGit(parameters: string[]): string | null {
  try {
    return execFileSync('git', parameters, {
      stdio: ['ignore', 'pipe', 'ignore'],
      encoding: 'utf8',
    }).trim()
  } catch {
    return null
  }
}

function readVersion(packageJson: string): string {
  let { version } = require(packageJson) as { version: string }
  return version
}
