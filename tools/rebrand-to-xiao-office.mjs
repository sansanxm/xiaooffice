import fs from 'node:fs';
import path from 'node:path';

// 1. Update productName in all packages
const packagesWithProductName = [
  'apps/shell/package.json',
  'apps/docs/package.json',
  'apps/sheets/package.json',
  'apps/slides/package.json',
  'apps/pdf/package.json',
  'apps/markdown/package.json',
  'apps/html/package.json'
];

for (const p of packagesWithProductName) {
  const fullPath = path.resolve(p);
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    content = content.replace(/"productName":\s*"GenOffice([^"]*)"/g, '"productName": "Xiao Office$1"');
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`Updated productName in ${p}`);
  }
}

// 2. Update electron-builder.cjs
const builderConfigPath = path.resolve('apps/shell/electron-builder.cjs');
if (fs.existsSync(builderConfigPath)) {
  let builder = fs.readFileSync(builderConfigPath, 'utf8');
  builder = builder.replace(/productName:\s*'GenOffice'/g, "productName: 'Xiao Office'");
  builder = builder.replace(/'GenOffice\$/g, "'Xiao Office$");
  builder = builder.replace(/GenOffice-intel/g, 'XiaoOffice-intel');
  fs.writeFileSync(builderConfigPath, builder, 'utf8');
  console.log(`Updated electron-builder.cjs`);
}

// 3. Update titles in shell main process
const shellIndexPath = path.resolve('apps/shell/src/main/index.ts');
if (fs.existsSync(shellIndexPath)) {
  let idx = fs.readFileSync(shellIndexPath, 'utf8');
  idx = idx.replace(/title:\s*'GenOffice'/g, "title: 'Xiao Office'");
  idx = idx.replace(/throw new Error\('GenOffice is not ready'\)/g, "throw new Error('Xiao Office is not ready')");
  fs.writeFileSync(shellIndexPath, idx, 'utf8');
  console.log(`Updated apps/shell/src/main/index.ts`);
}

// 4. Update html titles
const htmlFiles = [
  'apps/shell/src/renderer/index.html',
  'apps/docs/src/renderer/index.html',
  'apps/sheets/src/renderer/index.html',
  'apps/slides/src/renderer/index.html',
  'apps/pdf/src/renderer/index.html',
  'apps/markdown/src/renderer/index.html',
  'apps/html/src/renderer/index.html',
  'apps/shell/src/renderer/update.html',
  'apps/shell/src/renderer/pdf-password.html'
];
for (const hf of htmlFiles) {
  const full = path.resolve(hf);
  if (fs.existsSync(full)) {
    let html = fs.readFileSync(full, 'utf8');
    html = html.replace(/<title>GenOffice(.*?)<\/title>/g, '<title>Xiao Office$1</title>');
    html = html.replace(/alt="GenOffice"/g, 'alt="Xiao Office"');
    fs.writeFileSync(full, html, 'utf8');
    console.log(`Updated ${hf}`);
  }
}

// 5. Update Home.tsx logo alt
const homePath = path.resolve('apps/shell/src/renderer/src/Home.tsx');
if (fs.existsSync(homePath)) {
  let home = fs.readFileSync(homePath, 'utf8');
  home = home.replace(/alt="GenOffice"/g, 'alt="Xiao Office"');
  fs.writeFileSync(homePath, home, 'utf8');
  console.log(`Updated Home.tsx`);
}

// 6. Update strings.ts
const stringsPath = path.resolve('apps/shell/src/renderer/src/strings.ts');
if (fs.existsSync(stringsPath)) {
  let strings = fs.readFileSync(stringsPath, 'utf8');
  strings = strings.replace(/GenOffice/g, 'Xiao Office');
  fs.writeFileSync(stringsPath, strings, 'utf8');
  console.log(`Updated strings.ts`);
}

// 7. Change "Genspark AI" to "Gemini AI" in Ribbons
const ribbonFiles = [
  'apps/docs/src/renderer/components/Ribbon.tsx',
  'apps/slides/src/renderer/components/RibbonHomeTab.tsx',
  'apps/slides/src/renderer/App.tsx',
  'apps/sheets/src/renderer/ExcelShell.tsx',
  'apps/markdown/src/renderer/components/Ribbon.tsx',
  'apps/html/src/renderer/components/Ribbon.tsx',
  'apps/pdf/src/renderer/App.tsx'
];

for (const rf of ribbonFiles) {
  const full = path.resolve(rf);
  if (fs.existsSync(full)) {
    let content = fs.readFileSync(full, 'utf8');
    content = content.replace(/Genspark AI/g, 'Gemini AI');
    fs.writeFileSync(full, content, 'utf8');
    console.log(`Updated ${rf}`);
  }
}

// 8. Update aiPanelTitle in all ai localization files
const aiLocaleFiles = [
  'apps/docs/src/renderer/i18n/ai/vi.ts',
  'apps/docs/src/renderer/i18n/ai/en.ts',
  'apps/slides/src/renderer/i18n/ai/vi.ts',
  'apps/slides/src/renderer/i18n/ai/en.ts',
  'apps/sheets/src/renderer/i18n/ai/vi.ts',
  'apps/sheets/src/renderer/i18n/ai/en.ts',
  'apps/pdf/src/renderer/i18n/ai/vi.ts',
  'apps/pdf/src/renderer/i18n/ai/en.ts',
  'apps/markdown/src/renderer/i18n/ai/vi.ts',
  'apps/markdown/src/renderer/i18n/ai/en.ts',
  'apps/html/src/renderer/i18n/ai/vi.ts',
  'apps/html/src/renderer/i18n/ai/en.ts'
];

for (const alf of aiLocaleFiles) {
  const full = path.resolve(alf);
  if (fs.existsSync(full)) {
    let content = fs.readFileSync(full, 'utf8');
    content = content.replace(/"aiPanelTitle":\s*"Genspark"/g, '"aiPanelTitle": "Gemini AI"');
    fs.writeFileSync(full, content, 'utf8');
    console.log(`Updated aiPanelTitle in ${alf}`);
  }
}

// 9. Update default AI provider to Gemini in packages/ai-provider
const providersPath = path.resolve('packages/ai-provider/src/providers.ts');
if (fs.existsSync(providersPath)) {
  let content = fs.readFileSync(providersPath, 'utf8');
  content = content.replace(/provider:\s*'genspark',/g, "provider: 'gemini',");
  fs.writeFileSync(providersPath, content, 'utf8');
  console.log(`Updated default AI provider to gemini in providers.ts`);
}

const mediaPath = path.resolve('packages/ai-provider/src/media.ts');
if (fs.existsSync(mediaPath)) {
  let content = fs.readFileSync(mediaPath, 'utf8');
  content = content.replace(/imageProvider:\s*'genspark'/g, "imageProvider: 'gemini'");
  content = content.replace(/analysisProvider:\s*'genspark'/g, "analysisProvider: 'gemini'");
  content = content.replace(/videoAnalysisProvider:\s*'genspark'/g, "videoAnalysisProvider: 'gemini'");
  fs.writeFileSync(mediaPath, content, 'utf8');
  console.log(`Updated default media providers to gemini in media.ts`);
}

// 10. Update search settings in packages/ai-provider
const searchSettingsPath = path.resolve('packages/ai-provider/src/search-settings.ts');
if (fs.existsSync(searchSettingsPath)) {
  let content = fs.readFileSync(searchSettingsPath, 'utf8');
  // Update AI_SEARCH_PROVIDERS labels
  content = content.replace(
    /\{ id: 'serper', label: 'Serper', keyPlaceholder: 'Serper API key', imageSearch: true \}/,
    `{ id: 'serper', label: 'Google Search (Serper)', keyPlaceholder: 'Serper API key', imageSearch: true }`
  );
  fs.writeFileSync(searchSettingsPath, content, 'utf8');
  console.log(`Updated AI_SEARCH_PROVIDERS in search-settings.ts`);
}

console.log('Rebranding and Gemini defaults applied successfully!');
