/**
 * @fileoverview RED 테스트: Console 직접 사용 금지 (logger 사용 강제)
 * TDD Phase: RED → GREEN → REFACTOR
 */

import { describe, it, expect } from 'vitest';
import { readFile } from 'fs/promises';
import { resolve } from 'path';
import { glob } from 'glob';

declare const process: {
  cwd(): string;
};

describe('Logger Usage Enforcement (RED)', () => {
  it('should not use console directly in runtime code', async () => {
    const srcPattern = resolve(process.cwd(), 'src/**/*.{ts,tsx}');
    const files = await glob(srcPattern.replace(/\\/g, '/'));

    const violations: string[] = [];

    for (const file of files) {
      // 빌드 관련 파일은 제외 (ESLint 규칙에서도 허용)
      if (file.includes('/build/') || file.includes('\\build\\')) {
        continue;
      }

      // logger.ts 자체는 제외 (console을 사용해야 함)
      if (file.includes('/logging/logger.ts') || file.includes('\\logging\\logger.ts')) {
        continue;
      }

      const content = await readFile(file, 'utf-8');

      // console.log, console.warn, console.error 등 직접 사용 검사
      const consoleUsageRegex = /\bconsole\.(log|warn|error|info|debug|trace)\s*\(/g;
      const matches = content.match(consoleUsageRegex);

      if (matches) {
        // 주석 내 사용은 제외
        const nonCommentMatches = matches.filter(match => {
          const lines = content.split('\n');
          return !lines.some(line => line.trim().startsWith('//') && line.includes(match));
        });

        if (nonCommentMatches.length > 0) {
          violations.push(`${file}: ${nonCommentMatches.join(', ')}`);
        }
      }
    }

    // RED: console 직접 사용이 있으면 실패해야 함
    if (violations.length > 0) {
      console.log('Remaining console violations:', violations);
    }
    expect(violations).toHaveLength(0);
  });

  it('should use logger import in files that need logging', async () => {
    const filesWithConsole = [
      'src/shared/utils/cleanup/CleanupValidator.ts',
      'src/shared/utils/cleanup/OrphanFileCleanup.ts',
    ];

    for (const file of filesWithConsole) {
      const filePath = resolve(process.cwd(), file);
      try {
        const content = await readFile(filePath, 'utf-8');

        // logger import가 있어야 함
        expect(content).toMatch(/import.*logger.*from.*logger/);
      } catch (error) {
        if (error.code !== 'ENOENT') throw error;
      }
    }
  });
});
