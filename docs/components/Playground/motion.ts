import type { KeyedTokensInfo } from '@shikijs/magic-move/types'

import { MagicMoveRenderer } from '@shikijs/magic-move/renderer'

import { isPermutation } from './frame'

export interface Animator {
  /**
   * Animates from one frame to another. Resolves when the animation has ended
   * or the signal aborts.
   *
   * @param from - Frame matching the code on screen, split into words.
   * @param to - Target frame with keys synced to `from`.
   * @param signal - Stops waiting early, for example when the island unmounts.
   */
  animate(
    from: KeyedTokensInfo,
    to: KeyedTokensInfo,
    signal: AbortSignal,
  ): Promise<void>
  replace(frame: KeyedTokensInfo): void
}

interface SettlingPromise extends Promise<void> {
  resolve(): void
}

let duration = 500

/**
 * Stagger delays grow with the index of every animated token, so the total
 * spread is capped instead of the per-token step.
 */
let staggerBudget = 400

/**
 * Wraps `MagicMoveRenderer` for the playground editor.
 *
 * The renderer waits for the end of each element's transitions by calling
 * `getAnimations()` on every animated element right after a forced reflow. That
 * call gets slower with every running transition, which made the homepage demo
 * block the main thread for about 190 ms. The durations are known in advance,
 * so a timer per element replaces it. The patch is applied only when the
 * private method exists.
 *
 * @param container - Element the renderer draws into.
 * @param initial - First frame. It is rendered once, because the renderer skips
 *   enter animations until its first `render()`.
 * @returns Methods to animate between frames or swap them at once.
 */
export function createAnimator(
  container: HTMLElement,
  initial: KeyedTokensInfo,
): Animator {
  let renderer = new MagicMoveRenderer(container, {
    animateContainer: true,
    containerStyle: false,
    easing: 'ease',
    stagger: 0,
    duration,
  })
  let settleAfter = duration * 2

  if (typeof Reflect.get(renderer, 'registerTransitionEnd') === 'function') {
    Object.defineProperty(renderer, 'registerTransitionEnd', {
      value: (_element: Element, onEnd: () => void) => (): SettlingPromise => {
        let timer: ReturnType<typeof setTimeout> | undefined
        let settled = false
        let resolvePromise: (() => void) | undefined
        let promise = new Promise<void>(resolve => {
          resolvePromise = resolve
        })
        function settle(): void {
          if (!settled) {
            settled = true
            clearTimeout(timer)
            onEnd()
            resolvePromise?.()
          }
        }
        timer = setTimeout(settle, settleAfter)
        return Object.assign(promise, { resolve: settle })
      },
    })
  }

  void renderer.render(initial)

  return {
    async animate(from, to, signal) {
      let permutation = isPermutation(from, to)
      let stagger = Math.min(3, staggerBudget / Math.max(to.tokens.length, 1))
      let delay = permutation ? renderer.options.delayContainer : 0.7
      Object.assign(renderer.options, {
        delayMove: permutation ? 0 : 0.3,
        stagger,
      })
      settleAfter = duration * (1 + delay) + stagger * to.tokens.length + 50

      renderer.replace(from)
      let aborted = new Promise<void>(resolve => {
        signal.addEventListener('abort', () => resolve(), { once: true })
      })
      await Promise.race([renderer.render(to), aborted])
    },
    replace(frame) {
      renderer.replace(frame)
    },
  }
}
