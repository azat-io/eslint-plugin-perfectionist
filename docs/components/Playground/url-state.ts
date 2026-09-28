import type { SortingOrder, SortingType } from './lint-config'

/**
 * State read from a link. Fields the link does not set hold their defaults.
 */
export interface DecodedState extends Omit<PlaygroundState, 'code'> {
  /**
   * Code from the link, or `null` when the link keeps the example of the rule.
   */
  code: string | null

  /**
   * Some value in the link is unknown and was replaced by its default.
   */
  invalid: boolean

  /**
   * The code in the link could not be read.
   */
  broken: boolean
}

/**
 * What a playground link restores.
 */
export interface PlaygroundState {
  /**
   * Single rule to run, or `null` for all recommended rules.
   */
  rule: string | null
  order: SortingOrder
  type: SortingType
  code: string
}

const SORTING_TYPES: SortingType[] = ['alphabetical', 'natural', 'line-length']

/**
 * Links longer than this may be cut off by chat apps and issue trackers.
 */
export const LONG_LINK_LENGTH = 8000

/**
 * Hash format version. A link without `v` is read as version 1, so links from
 * the docs can omit it.
 */
const VERSION = '1'

/**
 * Decoded code longer than this is rejected, so a small link cannot inflate
 * into a huge string.
 */
const DECODED_SIZE_LIMIT = 1_000_000

/**
 * Longer `code` values are rejected before decoding. Code at the editor limit
 * encodes to far fewer characters.
 */
const ENCODED_SIZE_LIMIT = 300_000

/**
 * Compressed bytes are fed to the decompressor in slices this small. WebKit
 * inflates a whole input chunk at once, so one large chunk could expand to
 * hundreds of megabytes before the size limit sees it.
 */
const INPUT_CHUNK_SIZE = 1024

/**
 * Reads the state from a URL hash. Unknown values fall back to their defaults
 * and set `invalid`; unreadable code sets `broken`.
 *
 * @param hash - Hash with or without `#`.
 * @param rules - Rule ids the playground knows.
 * @returns Decoded state.
 */
export async function decodeState(
  hash: string,
  rules: string[],
): Promise<DecodedState> {
  let parameters = new URLSearchParams(hash.replace(/^#/u, ''))
  let result: DecodedState = {
    type: 'alphabetical',
    invalid: false,
    broken: false,
    order: 'asc',
    rule: null,
    code: null,
  }
  let version = parameters.get('v')
  if (version !== null && version !== VERSION) {
    return { ...result, broken: true }
  }

  let rule = parameters.get('rule')
  if (rule !== null) {
    if (rules.includes(rule)) {
      result.rule = rule
    } else {
      result.invalid = true
    }
  }

  let type = parameters.get('type')
  let knownType = SORTING_TYPES.find(value => value === type)
  if (knownType) {
    result.type = knownType
  } else if (type !== null) {
    result.invalid = true
  }

  let order = parameters.get('order')
  result.order = getDefaultOrder(result.type)
  if (order === 'asc' || order === 'desc') {
    result.order = order
  } else if (order !== null) {
    result.invalid = true
  }

  let code = parameters.get('code')
  if (code !== null) {
    try {
      result.code = await decompress(code)
    } catch {
      result.broken = true
    }
  }
  return result
}

/**
 * Encodes the state for the URL hash. Values equal to their defaults are left
 * out, so the example of the current rule adds no code to the link. The version
 * is always there: a link without a hash restores the last state of the tab, so
 * even the default state needs one.
 *
 * @param state - State to encode.
 * @param example - Example code of the current rule.
 * @returns Hash without `#`.
 */
export async function encodeState(
  state: PlaygroundState,
  example: string,
): Promise<string> {
  let parameters = new URLSearchParams()
  if (state.rule) {
    parameters.set('rule', state.rule)
  }
  if (state.type !== 'alphabetical') {
    parameters.set('type', state.type)
  }
  if (state.order !== getDefaultOrder(state.type)) {
    parameters.set('order', state.order)
  }
  if (state.code !== example) {
    parameters.set('code', await compress(state.code))
  }
  let rest = parameters.toString()
  return rest ? `v=${VERSION}&${rest}` : `v=${VERSION}`
}

/**
 * Checks that the browser can run the playground: a module worker for the
 * linter and raw deflate for links. Reading the `type` option is the only way
 * to detect module workers; the invalid URL stops before any request.
 *
 * @returns Whether the playground can run.
 */
export function isSupported(): boolean {
  let moduleWorkers = false
  try {
    Reflect.construct(CompressionStream, ['deflate-raw'])
    Reflect.construct(DecompressionStream, ['deflate-raw'])
    Reflect.construct(Worker, [
      'http://[',
      {
        get type(): 'module' {
          moduleWorkers = true
          return 'module'
        },
      },
    ])
  } catch {
    return moduleWorkers
  }
  return moduleWorkers
}

/**
 * Returns the order used when a link does not set one: longest lines first for
 * line length, A to Z otherwise.
 *
 * @param type - Sorting type.
 * @returns Default order for the type.
 */
export function getDefaultOrder(type: SortingType): SortingOrder {
  return type === 'line-length' ? 'desc' : 'asc'
}

async function decompress(value: string): Promise<string> {
  if (value.length > ENCODED_SIZE_LIMIT) {
    throw new RangeError('The code in the link is too large.')
  }
  // eslint-disable-next-line unicorn/prefer-uint8array-base64 -- Chrome 109 and Safari 17 lack Uint8Array.fromBase64
  let binary = atob(value.replaceAll('-', '+').replaceAll('_', '/'))
  let bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index++) {
    bytes[index] = binary.codePointAt(index)!
  }
  let size = 0
  let limit = new TransformStream<Uint8Array, Uint8Array>({
    transform(chunk, controller) {
      size += chunk.byteLength
      if (size > DECODED_SIZE_LIMIT) {
        controller.error(new RangeError('The code in the link is too large.'))
      } else {
        controller.enqueue(chunk)
      }
    },
  })
  let offset = 0
  let source = new ReadableStream<BufferSource>(
    {
      pull(controller) {
        if (offset >= bytes.length) {
          controller.close()
          return
        }
        controller.enqueue(bytes.subarray(offset, offset + INPUT_CHUNK_SIZE))
        offset += INPUT_CHUNK_SIZE
      },
    },
    { highWaterMark: 0 },
  )
  let stream = source
    .pipeThrough(new DecompressionStream('deflate-raw'))
    .pipeThrough(limit)
  let response = new Response(stream)
  let decoder = new TextDecoder('utf-8', { fatal: true })
  return decoder.decode(await response.arrayBuffer())
}

async function compress(text: string): Promise<string> {
  let blob = new Blob([text])
  let stream = blob.stream().pipeThrough(new CompressionStream('deflate-raw'))
  let response = new Response(stream)
  let bytes = new Uint8Array(await response.arrayBuffer())
  let binary = ''
  for (let byte of bytes) {
    binary += String.fromCodePoint(byte)
  }
  // eslint-disable-next-line unicorn/prefer-uint8array-base64 -- Chrome 109 and Safari 17 lack Uint8Array#toBase64
  return btoa(binary)
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replace(/[=]+$/u, '')
}
