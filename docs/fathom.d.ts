interface Fathom {
  /**
   * Manually track a page view.
   *
   * @param opts - Optional parameters.
   * @param opts.url - Override the page URL.
   * @param opts.referrer - Override the referrer.
   */
  trackPageview(options?: { referrer?: string; url?: string }): void

  /**
   * Track a custom event.
   *
   * @param eventName - The name of the event to track.
   * @param opts - Optional parameters.
   * @param opts._value - Numeric value to associate with the event (e.g., price
   *   in cents).
   */
  trackEvent(eventName: string, options?: { _value?: number }): void

  /**
   * Enable tracking for the current user Reverses the effect of
   * blockTrackingForMe().
   */
  enableTrackingForMe(): void

  /**
   * Block tracking for the current user Useful for respecting user privacy
   * preferences.
   */
  blockTrackingForMe(): void
}

declare global {
  // eslint-disable-next-line prefer-let/prefer-let
  var fathom: undefined | Fathom
}

// eslint-disable-next-line unicorn/require-module-specifiers
export {}
