/**
 * ESLint and the TypeScript parser read `process` while loading. The shim is
 * imported first by the lint worker only, so the page itself never looks like
 * Node to other libraries.
 */
if (!('process' in globalThis)) {
  Object.defineProperty(globalThis, 'process', {
    value: {
      nextTick: (
        callback: (...values: unknown[]) => void,
        ...values: unknown[]
      ) => queueMicrotask(() => callback(...values)),
      emitWarning: () => {},
      platform: 'browser',
      cwd: () => '/',
      browser: true,
      versions: {},
      argv: [],
      env: {},
    },
    configurable: true,
    writable: true,
  })
}
