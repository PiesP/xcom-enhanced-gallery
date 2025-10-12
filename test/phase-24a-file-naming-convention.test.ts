/**
 * @fileoverview Phase 24-A: src/shared 소형 디렉터리 파일명 규칙 검증
 */

import { describe, it, expect } from 'vitest';
import { readdirSync } from 'node:fs';
import { join, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SHARED_ROOT = join(__dirname, '..', 'src', 'shared');
const TARGET_DIRECTORIES = [
  'browser',
  'container',
  'dom',
  'error',
  'external',
  'loader',
  'logging',
  'memory',
] as const;

const DISALLOWED_PASCAL_FILES = new Set([
  'BrowserService.ts',
  'BrowserUtils.ts',
  'AppContainer.ts',
  'ServiceHarness.ts',
  'DOMCache.ts',
  'DOMEventManager.ts',
  'SelectorRegistry.ts',
  'ErrorHandler.ts',
  'MemoryTracker.ts',
]);

describe('Phase 24-A: shared 디렉터리 파일명 규칙', () => {
  it('대상 디렉터리 내 .ts 파일은 kebab-case 여야 한다', () => {
    const violations: string[] = [];

    for (const directory of TARGET_DIRECTORIES) {
      const directoryPath = join(SHARED_ROOT, directory);
      const entries = readdirSync(directoryPath, { withFileTypes: true });

      entries.forEach(entry => {
        if (!entry.isFile()) {
          return;
        }

        const extension = extname(entry.name);
        if (extension !== '.ts' && extension !== '.tsx') {
          return;
        }

        const isKebabCase = /^[a-z0-9]+(?:-[a-z0-9]+)*\.(?:ts|tsx)$/.test(entry.name);
        if (!isKebabCase) {
          violations.push(join(directory, entry.name));
        }
      });
    }

    expect(violations).toEqual([]);
  });

  it('기존 PascalCase 파일명이 제거되어야 한다', () => {
    const existing: string[] = [];

    for (const directory of TARGET_DIRECTORIES) {
      const directoryPath = join(SHARED_ROOT, directory);
      const entries = new Set(readdirSync(directoryPath));

      DISALLOWED_PASCAL_FILES.forEach(fileName => {
        if (entries.has(fileName)) {
          existing.push(join(directory, fileName));
        }
      });
    }

    expect(existing).toEqual([]);
  });
});
