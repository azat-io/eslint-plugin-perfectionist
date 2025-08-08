import type { TypeOption } from '../types/common-options'

/** Options for custom sort configuration validation. */
interface Options {
  /** The sorting type selected by the user. */
  type: TypeOption

  /** Custom alphabet string for ordering when type is 'custom'. */
  alphabet: string
}

/**
 * Validates configuration when using custom sort type.
 *
 * Ensures that when a user selects 'custom' sorting type, they provide a valid
 * alphabet string. This prevents runtime errors and ensures the custom sorting
 * has a defined order to follow.
 *
 * The function is called at the beginning of every sorting rule's execution to
 * catch configuration errors early and provide clear error messages.
 *
 * @param options - Configuration options to validate.
 * @throws {Error} If type is 'custom' but alphabet is empty.
 */
export function validateCustomSortConfiguration({
  alphabet,
  type,
}: Options): void {
  if (type !== 'custom') {
    return
  }
  if (alphabet.length === 0) {
    throw new Error('`alphabet` option must not be empty')
  }
}
