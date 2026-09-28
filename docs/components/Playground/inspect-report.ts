import { reportAllErrors as reportBlockErrors } from '../../../utils/report-all-errors'
import { recordBlock } from './inspection'

/**
 * Stands in for the plugin's `reportAllErrors` in the Playground worker: it
 * records the block for the groups inspector, then reports as usual. The
 * `playground-shims` Vite plugin points the rules here; the published plugin is
 * not changed.
 *
 * @param parameters - Block, options and context from the rule.
 */
export let reportAllErrors: typeof reportBlockErrors = parameters => {
  recordBlock(parameters)
  reportBlockErrors(parameters)
}
