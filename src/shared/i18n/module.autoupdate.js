/* global console, process */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const MODULE_DIR = path.dirname(fileURLToPath(import.meta.url));
const LANG_DIR = path.join(MODULE_DIR, 'languages');

export function resolveModuleKeys() {
  const languageEntries = fs
    .readdirSync(LANG_DIR, { withFileTypes: true })
    .filter(entry => entry.isFile() && entry.name.endsWith('.ts'))
    .map(entry => `languages/${entry.name.replace(/\.ts$/, '')}`)
    .sort();

  return ['language-types', 'translation-registry', ...languageEntries];
}

export function readExistingVersions(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const match = content.match(/moduleVersions\s*=\s*({[\s\S]*?})\s*as const/);
  if (!match) {
    return {};
  }

  try {
    const normalized = match[1].replace(/'/g, '"').replace(/,\s*}/g, '}').replace(/,\s*]/g, ']');
    return JSON.parse(normalized);
  } catch (error) {
    console.warn('[i18n] module-versions.ts 파싱 실패:', error);
    return {};
  }
}

export function buildModuleVersions(existing = {}) {
  const map = {};
  for (const key of resolveModuleKeys()) {
    const value = existing[key];
    map[key] = typeof value === 'number' && Number.isFinite(value) ? value : 1;
  }
  return map;
}

export function formatModuleVersionsContent(map) {
  const entries = Object.entries(map)
    .map(([key, value]) => `  '${key}': ${value},`)
    .join('\n');

  return (
    `// ⚠️ 이 파일은 module.autoupdate.js에 의해 유지됩니다.\n` +
    `// 모듈을 추가/삭제했다면 module.autoupdate.js를 실행해 버전 맵을 동기화하세요.\n\n` +
    `export const moduleVersions = {\n${entries}\n} as const;\n\n` +
    `export type ModuleVersionKey = keyof typeof moduleVersions;\n\n` +
    `export function getModuleVersion(key: ModuleVersionKey): number {\n  return moduleVersions[key];\n}\n`
  );
}

export function writeModuleVersions(filePath, map) {
  const content = formatModuleVersionsContent(map);
  fs.writeFileSync(filePath, content, 'utf8');
}

function isCliInvocation(argv) {
  if (!Array.isArray(argv) || argv.length === 0) {
    return false;
  }
  const entry = argv[1];
  if (!entry) {
    return false;
  }
  return path.resolve(entry) === path.resolve(fileURLToPath(import.meta.url));
}

if (isCliInvocation(process.argv)) {
  const target = path.join(MODULE_DIR, 'module-versions.ts');
  const existing = readExistingVersions(target);
  const map = buildModuleVersions(existing);
  writeModuleVersions(target, map);
  console.log(`[i18n] module-versions.ts refreshed (${Object.keys(map).length} modules).`);
}
