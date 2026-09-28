import fs from 'node:fs';

const dict1 = JSON.parse(fs.readFileSync('tools/i18n-data/apps-panes-full-dict.json', 'utf8'));
const dict2 = JSON.parse(fs.readFileSync('tools/i18n-data/panes-full-dict.json', 'utf8'));
const dict3 = JSON.parse(fs.readFileSync('tools/i18n-data/apps-all-full-dict.json', 'utf8'));

const APPS_COMBINED = {
  ...dict1,
  ...dict2,
  ...dict3,
};

export function translateAppsItem(val, key) {
  if (APPS_COMBINED[key]) return APPS_COMBINED[key];
  if (APPS_COMBINED[val]) return APPS_COMBINED[val];
  return null;
}

export { APPS_COMBINED };
