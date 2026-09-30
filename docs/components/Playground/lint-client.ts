import type { WorkerMessage, LintRequest, LintResult } from './lint-config'

export interface LintClient {
  /**
   * Sets the code and settings to lint. Every call starts a new revision, so
   * results for earlier input are dropped.
   *
   * @param input - Code and rule settings.
   * @param options - `immediate` skips the typing delay.
   * @returns The new revision.
   */
  update(input: LintInput, options?: { immediate?: boolean }): number

  /**
   * Stops the worker and all timers.
   */
  destroy(): void

  /**
   * Drops the current result without linting, for example for code over the
   * size limit. Starts a new revision like `update`.
   */
  clear(): void

  /**
   * Lints the latest input again, for example after it timed out.
   */
  retry(): void

  /**
   * Starts the worker. Called once the page is shown, not while the browser
   * only prepares it in the background.
   */
  start(): void
}

export interface LintState {
  /**
   * Result for the latest input, or `null` while that input is being linted.
   * `timeout` means the worker was stopped because linting took too long.
   */
  result: { kind: 'timeout' } | LintResult | null

  /**
   * ESLint version the worker runs, once it is ready.
   */
  eslintVersion: string | null

  /**
   * Why the worker could not load, when it failed.
   */
  failure: string | null

  /**
   * Whether the worker is loading, ready or failed to load.
   */
  status: LintStatus

  /**
   * Number of the latest input. Results for older numbers are dropped.
   */
  revision: number

  /**
   * The linter has not become ready within `slowAfter` milliseconds.
   */
  slow: boolean
}

export interface LintClientOptions {
  /**
   * Called with the new state after every change.
   */
  onChange(state: LintState): void

  /**
   * Creates the lint worker. Vite only bundles a worker created with a literal
   * `new Worker(new URL(...), { type: 'module' })`, so the caller owns it.
   */
  createWorker(): LintWorker

  /**
   * Milliseconds of loading after which the state reports `slow`.
   */
  slowAfter?: number

  /**
   * Milliseconds a lint may run before the worker is stopped.
   */
  timeout?: number

  /**
   * Milliseconds to wait after typing before the latest input is sent.
   */
  delay?: number
}

/**
 * The parts of `Worker` the client uses.
 */
interface LintWorker {
  /**
   * Listens for results and for load errors.
   */
  addEventListener(
    type: 'message' | 'error',
    listener: (event: Event) => void,
  ): void

  /**
   * Sends a lint request.
   */
  postMessage(message: LintRequest): void

  /**
   * Stops the worker at once.
   */
  terminate(): void
}

type LintStatus = 'loading' | 'failed' | 'ready'

type Timer = ReturnType<typeof setTimeout>

type LintInput = Omit<LintRequest, 'id'>

export const INITIAL_LINT_STATE: LintState = {
  eslintVersion: null,
  status: 'loading',
  failure: null,
  result: null,
  revision: 0,
  slow: false,
}

/**
 * Creates a client that talks to the lint worker.
 *
 * At most one request is in flight. Input that changes meanwhile waits and only
 * its latest version is sent. A request that runs longer than `timeout` stops
 * the worker: its revision gets the `timeout` result, a fresh worker starts,
 * and later input is linted as usual.
 *
 * @param options - Worker factory, change listener and timings in ms.
 * @returns Methods to feed input, start the worker and tear everything down.
 */
export function createLintClient({
  slowAfter = 20_000,
  timeout = 15_000,
  createWorker,
  delay = 200,
  onChange,
}: LintClientOptions): LintClient {
  let state = INITIAL_LINT_STATE
  let worker: LintWorker | null = null
  let input: LintInput | null = null
  let inFlight: number | null = null
  let delayTimer: undefined | Timer
  let watchdog: undefined | Timer
  let slowTimer: undefined | Timer

  function setState(changes: Partial<LintState>): void {
    state = { ...state, ...changes }
    onChange(state)
  }

  function spawn(): void {
    let current = createWorker()
    worker = current
    current.addEventListener('message', event => {
      if (worker === current) {
        handleMessage(event)
      }
    })
    current.addEventListener('error', () => {
      if (worker === current) {
        fail('The linter could not be loaded.')
      }
    })
    slowTimer = setTimeout(() => setState({ slow: true }), slowAfter)
  }

  function handleMessage(event: Event): void {
    let { data } = event as MessageEvent<WorkerMessage>
    if (data.kind === 'ready') {
      clearTimeout(slowTimer)
      setState({ eslintVersion: data.eslint, status: 'ready', slow: false })
      send()
      return
    }
    if (data.kind === 'load-failed') {
      fail(data.message)
      return
    }
    clearTimeout(watchdog)
    inFlight = null
    let { id, ms, ...result } = data
    if (id === state.revision) {
      setState({ result })
    }
    send()
  }

  function send(): void {
    if (
      !worker ||
      !input ||
      delayTimer ||
      inFlight !== null ||
      state.result !== null ||
      state.status !== 'ready'
    ) {
      return
    }
    inFlight = state.revision
    worker.postMessage({ ...input, id: state.revision })
    watchdog = setTimeout(handleTimeout, timeout)
  }

  function handleTimeout(): void {
    let timedOut = inFlight
    stop()
    setState(
      timedOut === state.revision ?
        { result: { kind: 'timeout' }, status: 'loading' }
      : { status: 'loading' },
    )
    spawn()
  }

  function fail(message: string): void {
    stop()
    setState({ failure: message, status: 'failed', slow: false })
  }

  function stop(): void {
    clearTimeout(watchdog)
    clearTimeout(slowTimer)
    worker?.terminate()
    worker = null
    inFlight = null
  }

  return {
    update(nextInput, { immediate = false } = {}) {
      input = nextInput
      clearTimeout(delayTimer)
      delayTimer = undefined
      setState({ revision: state.revision + 1, result: null })
      if (immediate) {
        send()
      } else {
        delayTimer = setTimeout(() => {
          delayTimer = undefined
          send()
        }, delay)
      }
      return state.revision
    },
    clear() {
      input = null
      clearTimeout(delayTimer)
      delayTimer = undefined
      setState({ revision: state.revision + 1, result: null })
    },
    destroy() {
      clearTimeout(delayTimer)
      delayTimer = undefined
      stop()
    },
    retry() {
      setState({ result: null })
      send()
    },
    start() {
      if (!worker) {
        spawn()
      }
    },
  }
}
