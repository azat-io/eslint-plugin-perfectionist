import { defaultLocale, translations } from '../locales'

export let getLocaleFromUrl = (url: URL) => {
  let [, lang] = url.pathname.split('/')

  if (lang && lang in translations) {
    return lang as keyof typeof translations
  }

  return defaultLocale
}
