import { aiStrings } from './strings-ai'
import { appStrings } from './strings-app'
import { paneStrings } from './strings-panes'
import { ribbonStrings } from './strings-ribbon'

export const strings = {
  en: { ...appStrings.en, ...ribbonStrings.en, ...paneStrings.en, ...aiStrings.en },
  vi: { ...appStrings.vi, ...ribbonStrings.vi, ...paneStrings.vi, ...aiStrings.vi },
}
