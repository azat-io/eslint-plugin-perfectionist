import type { Join } from './join'

export type JoinWithDash<T extends string[]> = Join<T, '-'>
