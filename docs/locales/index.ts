import enFlag from '../flags/en.svg?raw'
import ruFlag from '../flags/ru.svg?raw'
import en from './en'
import ru from './ru'

type Locale = keyof typeof translations

export let translations = {
  en,
  ru,
}

export let locales: {
  originName: string
  name: string
  code: Locale
  icon: string
}[] = [
  {
    originName: 'English',
    name: 'English',
    icon: enFlag,
    code: 'en',
  },
  {
    originName: 'Русский',
    name: 'Russian',
    icon: ruFlag,
    code: 'ru',
  },
]

export let defaultLocale: Locale = 'en'
