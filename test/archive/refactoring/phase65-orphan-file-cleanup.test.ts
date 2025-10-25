/**
 * Phase 65 Step 1: Orphan 파일 정리
 *
 * 목적: src 디렉터리 내 orphan 파일 (실제 프로덕션에서 사용되지 않는 파일) 정리
 * - 대상: src/shared/services/media/normalizers/legacy/twitter.ts
 * - 전략: 테스트 전용 유틸리티를 test 디렉터리로 이동
 * - 검증: dependency-cruiser에서 orphan 경고 제거
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { execSync } from 'node:child_process';

describe('Phase 65 Step 1: Orphan 파일 정리', () => {
  const ROOT = process.cwd();
  const LEGACY_TWITTER_PATH = join(ROOT, 'src/shared/services/media/normalizers/legacy/twitter.ts');
  const TEST_UTILS_PATH = join(ROOT, 'test/utils/legacy/twitter-normalizers.ts');

  describe('RED: Orphan 파일 존재 검증', () => {
    it('legacy twitter normalizer가 src에 존재한다', () => {
      // RED: 아직 이동하지 않음
      expect(existsSync(LEGACY_TWITTER_PATH)).toBe(true);
    });

    it('legacy twitter normalizer가 프로덕션 코드에서 import되지 않는다', () => {
      const srcFiles: string[] = [];

      function scanDirectory(dir: string): void {
        const files = readdirSync(dir);

        files.forEach((file: string) => {
          const fullPath = join(dir, file);
          const stat = statSync(fullPath);

          if (stat.isDirectory()) {
            if (file !== 'node_modules' && file !== 'legacy') {
              scanDirectory(fullPath);
            }
          } else if (/\.(ts|tsx)$/.test(file) && !file.includes('.test.')) {
            srcFiles.push(fullPath);
          }
        });
      }

      scanDirectory(join(ROOT, 'src'));

      let importCount = 0;
      srcFiles.forEach(filePath => {
        if (filePath === LEGACY_TWITTER_PATH) return; // 자기 자신 제외

        const content = readFileSync(filePath, 'utf-8');
        if (
          content.includes('normalizers/legacy/twitter') ||
          content.includes('normalizeTweetLegacy') ||
          content.includes('normalizeUserLegacy')
        ) {
          importCount++;
        }
      });

      expect(importCount).toBe(0); // 프로덕션 코드에서 사용하지 않음
    });

    it('legacy twitter normalizer가 테스트에서만 사용된다', () => {
      const testFilePath = join(
        ROOT,
        'test/unit/shared/services/media/twitter-video-legacy-normalizer.test.ts'
      );

      expect(existsSync(testFilePath)).toBe(true);

      const testContent = readFileSync(testFilePath, 'utf-8');
      expect(testContent).toContain('normalizers/legacy/twitter');
      expect(testContent).toContain('normalizeTweetLegacy');
      expect(testContent).toContain('normalizeUserLegacy');
    });

    it('dependency-cruiser에서 orphan 경고가 있다', () => {
      try {
        const output = execSync('npm run deps:check', {
          encoding: 'utf-8',
          stdio: 'pipe',
        });

        // orphan 경고 존재 확인
        expect(output).toContain('no-orphans');
        expect(output).toContain('twitter.ts');
      } catch (error: any) {
        // deps:check가 실패하더라도 출력을 확인
        const output = error.stdout || error.message;
        expect(output).toContain('no-orphans');
      }
    });
  });

  describe('GREEN: 파일 이동 후 검증', () => {
    it('legacy twitter normalizer가 test/utils로 이동되었다', () => {
      expect(existsSync(LEGACY_TWITTER_PATH)).toBe(false);
      expect(existsSync(TEST_UTILS_PATH)).toBe(true);
    });

    it('이동 후에도 테스트가 통과한다', () => {
      const testFilePath = join(
        ROOT,
        'test/unit/shared/services/media/twitter-video-legacy-normalizer.test.ts'
      );

      const testContent = readFileSync(testFilePath, 'utf-8');
      // 새 경로로 import 변경되어야 함
      expect(testContent).toContain('utils/legacy/twitter-normalizers');
    });

    it('dependency-cruiser에서 orphan 경고가 없다', () => {
      const output = execSync('npm run deps:check', {
        encoding: 'utf-8',
        stdio: 'pipe',
      });

      // orphan 경고가 twitter.ts에 대해 없어야 함
      expect(output).not.toContain('twitter.ts');
      expect(output).toContain('0 dependency violations');
    });
  });
});
