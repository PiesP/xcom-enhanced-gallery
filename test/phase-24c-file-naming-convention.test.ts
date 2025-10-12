/**
 * Phase 24-C: src/shared 대형 디렉터리 파일명 kebab-case 검증
 *
 * 대상: services/, utils/
 * 목표: PascalCase 파일명을 kebab-case로 통일하여 코드베이스 일관성 확보
 */

import { describe, expect, it } from 'vitest';
import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

describe('Phase 24-C: Large directories file naming convention', () => {
  const targetDirs = ['services', 'utils'];
  const srcSharedPath = join(process.cwd(), 'src', 'shared');

  // kebab-case 패턴: 소문자 + 하이픈, 의미론적 suffix 허용 (.types, .interfaces, .test, .spec 등)
  const kebabCasePattern = /^[a-z0-9]+(?:-[a-z0-9]+)*(?:\.[a-z]+)?\.(?:ts|tsx)$/;

  it('should enforce kebab-case for all .ts/.tsx files in services/ directory', () => {
    const servicesPath = join(srcSharedPath, 'services');
    const violations: string[] = [];

    function scanDirectory(dirPath: string): void {
      const entries = readdirSync(dirPath);

      for (const entry of entries) {
        const fullPath = join(dirPath, entry);
        const stat = statSync(fullPath);

        if (stat.isDirectory()) {
          scanDirectory(fullPath);
        } else if (entry.endsWith('.ts') || entry.endsWith('.tsx')) {
          if (!kebabCasePattern.test(entry)) {
            const relativePath = fullPath.replace(srcSharedPath, 'src/shared').replace(/\\/g, '/');
            violations.push(relativePath);
          }
        }
      }
    }

    scanDirectory(servicesPath);

    if (violations.length > 0) {
      const message = [
        'Found PascalCase files in services/ directory:',
        ...violations.map(v => `  - ${v}`),
        '',
        'All files must follow kebab-case naming convention.',
        'Example: MediaService.ts → media-service.ts',
      ].join('\n');

      expect.fail(message);
    }

    expect(violations).toHaveLength(0);
  });

  it('should enforce kebab-case for all .ts/.tsx files in utils/ directory', () => {
    const utilsPath = join(srcSharedPath, 'utils');
    const violations: string[] = [];

    function scanDirectory(dirPath: string): void {
      const entries = readdirSync(dirPath);

      for (const entry of entries) {
        const fullPath = join(dirPath, entry);
        const stat = statSync(fullPath);

        if (stat.isDirectory()) {
          scanDirectory(fullPath);
        } else if (entry.endsWith('.ts') || entry.endsWith('.tsx')) {
          if (!kebabCasePattern.test(entry)) {
            const relativePath = fullPath.replace(srcSharedPath, 'src/shared').replace(/\\/g, '/');
            violations.push(relativePath);
          }
        }
      }
    }

    scanDirectory(utilsPath);

    if (violations.length > 0) {
      const message = [
        'Found PascalCase files in utils/ directory:',
        ...violations.map(v => `  - ${v}`),
        '',
        'All files must follow kebab-case naming convention.',
        'Example: DOMBatcher.ts → dom-batcher.ts',
      ].join('\n');

      expect.fail(message);
    }

    expect(violations).toHaveLength(0);
  });
});
