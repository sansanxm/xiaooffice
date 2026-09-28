import fs from 'node:fs';

const SHEETS_DICT = JSON.parse(fs.readFileSync('tools/i18n-data/sheets-full-dict.json', 'utf8'));

export function translateSheetsItem(val, key) {
  if (SHEETS_DICT[key]) return SHEETS_DICT[key];
  if (SHEETS_DICT[val]) return SHEETS_DICT[val];
  return null;
}

export { SHEETS_DICT };
