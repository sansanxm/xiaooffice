import { aiStrings } from './strings-ai'
import { appStrings } from './strings-app'

export const strings = {
  en: { ...appStrings.en, ...aiStrings.en },
  vi: { ...appStrings.vi, ...aiStrings.vi },
}
