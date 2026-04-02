import type { MapStore } from 'nanostores'

import { persistentMap } from '@nanostores/persistent'
import { map } from 'nanostores'

let initialCodeSettings: Record<string, string> = {
  'package-manager': 'npm',
  'config-type': 'legacy',
}

export let codeSettings: MapStore<Record<string, string>> =
  import.meta.env.SSR ?
    map(initialCodeSettings)
  : persistentMap('code:', initialCodeSettings)
