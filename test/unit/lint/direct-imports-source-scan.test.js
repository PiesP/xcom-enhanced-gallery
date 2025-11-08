/**
 * @fileoverview 소스 스캔: 금지된 직접 import(preact/signals/fflate) 사용 여부 검사
 * 정책: 외부 라이브러리는 vendors getter를 통해서만 접근
 */

import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, sep, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SRC_DIR = join(__dirname, '../../../src');

const FORBIDDEN_IMPORTS = [
  "from 'preact'",
  'from "preact"',
  "from 'preact/hooks'",
  'from "preact/hooks"',
  "from '@preact/signals'",
  'from "@preact/signals"',
  "from 'fflate'",
  'from "fflate"',
];

const IGNORED_DIRS = [
  `${sep}shared${sep}external${sep}vendors${sep}`,
  `${sep}external${sep}vendors${sep}`,
];

function listSourceFiles(dir) {
  const entries = readdirSync(dir);
  const files = [];
  for (const name of entries) {
    const full = join(dir, name);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      // vendors 경로는 제외
      const normalized = full.split('/').join(sep);
      if (IGNORED_DIRS.some(p => normalized.includes(p))) continue;
      files.push(...listSourceFiles(full));
    } else if (/\.(ts|tsx)$/.test(name)) {
      files.push(full);
    }
  }
  return files;
}

describe('의존성 getter 정책 - 직접 import 금지(소스 스캔)', () => {
  it('src/ 하위(.ts, .tsx)에서 금지된 직접 import가 없어야 한다(벤더 래퍼 제외)', () => {
    const files = listSourceFiles(SRC_DIR);
    const offenders = [];

    for (const file of files) {
      const lower = file.toLowerCase();
      if (lower.includes(`${sep}vendors${sep}`)) continue; // 안전장치: 파일 레벨에서도 제외
      const text = readFileSync(file, 'utf-8');
      const lines = text.split(/\r?\n/);
      lines.forEach((ln, idx) => {
        if (FORBIDDEN_IMPORTS.some(sig => ln.includes(sig))) {
          offenders.push({ file, line: idx + 1, text: ln.trim() });
        }
      });
    }

    const message = offenders.map(o => `${o.file}:${o.line} -> ${o.text}`).join('\n');

    expect(offenders.length, `금지된 직접 import 발견:\n${message}`).toBe(0);
  });
});
