/**
 * Hues of the group colors, starting with the brand violet. They repeat after
 * the last one.
 */
const HUES = [281, 200, 150, 85, 35, 330, 240, 110]

/**
 * Returns the hue of a group entry, so its pills, bars and legend dot share a
 * color.
 *
 * @param slot - Index of the group entry, or `null` for elements outside of the
 *   groups.
 * @returns Hue in degrees, or `null` for no color.
 */
export function getSlotHue(slot: number | null): number | null {
  return slot === null ? null : HUES[slot % HUES.length]!
}
