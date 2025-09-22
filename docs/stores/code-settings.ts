import { persistentMap } from '@nanostores/persistent'

export let codeSettings = persistentMap<Record<string, string>>('code:', {
  'package-manager': 'npm',
})
