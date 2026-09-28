import { aiStrings } from './strings-ai'
import { appStrings } from './strings-app'
import { dialogStrings } from './strings-dialogs'

export const strings = {
  en: { ...appStrings.en, ...dialogStrings.en, ...aiStrings.en },
  vi: { ...appStrings.vi, ...dialogStrings.vi, ...aiStrings.vi },
}
