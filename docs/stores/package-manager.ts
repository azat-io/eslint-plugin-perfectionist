import type { WritableAtom } from 'nanostores'

import { persistentAtom } from '@nanostores/persistent'
import { atom } from 'nanostores'

export let packageManagers = ['npm', 'pnpm', 'yarn', 'bun'] as const

type PackageManager = (typeof packageManagers)[number]

let defaultPackageManager: PackageManager = 'npm'

export let packageManager: WritableAtom<PackageManager> =
  import.meta.env.SSR ?
    atom<PackageManager>(defaultPackageManager)
  : persistentAtom<PackageManager>('package-manager', defaultPackageManager)
