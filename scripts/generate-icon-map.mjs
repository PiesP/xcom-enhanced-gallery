#!/usr/bin/env node
/**
 * generate-icon-map.mjs
 * ICN-R5 REFACTOR: 아이콘 동적 import 맵 자동 생성 스텁 (ESM)
 */
import { readdirSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function main() {
  const heroDir = resolve(__dirname, '../src/shared/components/ui/Icon/hero');
  const files = readdirSync(heroDir).filter(f => /^Hero[A-Za-z0-9].*\.tsx$/.test(f));
  const cacheDir = resolve(__dirname, '../.cache');
  mkdirSync(cacheDir, { recursive: true });
  writeFileSync(
    resolve(cacheDir, 'icon-map-stub.json'),
    JSON.stringify({ generatedAt: new Date().toISOString(), files }, null, 2),
    'utf8'
  );
}

main();
