import builtinModules from 'virtual:playground-builtin-modules'

/**
 * The plugin requires `typescript` only to resolve imports through a tsconfig.
 * A throwing `require` sends it to its path-based fallback.
 *
 * @returns A `require` that always throws.
 */
export function createRequire(): () => never {
  return () => {
    throw new Error('require() is not available in the browser')
  }
}

export default { builtinModules, createRequire }

export { default as builtinModules } from 'virtual:playground-builtin-modules'
