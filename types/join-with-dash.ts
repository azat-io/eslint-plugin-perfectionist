import type { Join } from './join'

/** Joins an array of strings with a dash ('-') separator. */
export type JoinWithDash<T extends string[]> = Join<T, '-'>
