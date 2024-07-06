import { persistentAtom } from '@nanostores/persistent'

export let packageManagers = ['npm', 'pnpm', 'yarn', 'bun'] as const

type PackageManager = (typeof packageManagers)[number]

export let packageManager = persistentAtom<PackageManager>(
  'package-manager',
  'npm',
)
