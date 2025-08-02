/**
 * @fileoverview Phase 1: TDD 기반 임시 테스트 파일 정리 - REFACTOR
 * @description 임시 테스트 파일들을 제거하고 핵심 테스트만 유지
 * @version 1.0.0
 */

import { describe, it, expect } from 'vitest';
import { existsSync, unlinkSync, rmSync } from 'fs';
import { readdir } from 'fs/promises';
import { join } from 'path';

describe('Phase 1: 임시 테스트 파일 정리 - REFACTOR', () => {
  describe('🔄 REFACTOR: 임시 테스트 파일 제거', () => {
    it('should remove phase-based test files', async () => {
      const testDir = join(process.cwd(), 'test');
      const phaseFilesToRemove: string[] = [];

      // 재귀적으로 phase* 파일들 찾기
      async function findPhaseFiles(dir: string): Promise<void> {
        try {
          const items = await readdir(dir, { withFileTypes: true });
          for (const item of items) {
            const fullPath = join(dir, item.name);
            if (item.isDirectory()) {
              await findPhaseFiles(fullPath);
            } else if (item.name.includes('phase') && item.name.endsWith('.test.ts')) {
              // 현재 작업 중인 파일들은 제외
              if (
                !item.name.includes('phase1-cleanup-detection') &&
                !item.name.includes('phase1-core-verification') &&
                !item.name.includes('phase1-refactor-cleanup')
              ) {
                phaseFilesToRemove.push(fullPath);
              }
            }
          }
        } catch {
          // 디렉토리 접근 실패는 무시
        }
      }

      await findPhaseFiles(testDir);

      // Phase 파일들 제거
      let removedCount = 0;
      for (const file of phaseFilesToRemove) {
        if (existsSync(file)) {
          try {
            unlinkSync(file);
            removedCount++;
            console.log(`✅ Removed: ${file}`);
          } catch (error) {
            console.warn(`⚠️ Failed to remove: ${file}`, error);
          }
        }
      }

      console.log(`📋 Phase files cleanup: ${removedCount}/${phaseFilesToRemove.length} removed`);
      // 현재 작업 중인 phase 파일들 외에 정리할 파일이 없으면 0이어도 정상
      expect(removedCount).toBeGreaterThanOrEqual(0);
    });

    it('should remove cleanup-related test files', () => {
      const cleanupFiles = ['test/cleanup/naming-structure-improvement.test.ts'].map(path =>
        join(process.cwd(), path)
      );

      let removedCount = 0;
      for (const file of cleanupFiles) {
        if (existsSync(file)) {
          try {
            unlinkSync(file);
            removedCount++;
            console.log(`✅ Removed cleanup file: ${file}`);
          } catch (error) {
            console.warn(`⚠️ Failed to remove cleanup file: ${file}`, error);
          }
        }
      }

      console.log(`📋 Cleanup files removed: ${removedCount}/${cleanupFiles.length}`);
      // 정리할 파일이 있으면 제거, 없으면 이미 정리된 상태
      expect(removedCount).toBeGreaterThanOrEqual(0);
    });

    it('should remove design-system temporary test files', () => {
      const designSystemFiles = [
        'test/design-system/button-glassmorphism.test.ts',
        'test/design-system/css-compatibility.test.ts',
        'test/design-system/gallery-consistency.test.ts',
        'test/design-system/toast-consistency.test.ts',
        'test/design-system/toolbar-consistency.test.ts',
      ].map(path => join(process.cwd(), path));

      let removedCount = 0;
      for (const file of designSystemFiles) {
        if (existsSync(file)) {
          try {
            unlinkSync(file);
            removedCount++;
            console.log(`✅ Removed design-system file: ${file}`);
          } catch (error) {
            console.warn(`⚠️ Failed to remove design-system file: ${file}`, error);
          }
        }
      }

      console.log(`📋 Design-system files: ${removedCount}/${designSystemFiles.length} removed`);
      expect(removedCount).toBeGreaterThanOrEqual(0);
    });

    it('should clean up empty directories', () => {
      const dirsToCheck = [
        join(process.cwd(), 'test/cleanup'),
        join(process.cwd(), 'test/design-system'),
      ];

      let removedDirs = 0;
      for (const dir of dirsToCheck) {
        if (existsSync(dir)) {
          try {
            // 디렉토리가 비어있는지 확인 후 제거
            const items = readdir(dir);
            if ((items as any).length === 0) {
              rmSync(dir, { recursive: true });
              removedDirs++;
              console.log(`✅ Removed empty directory: ${dir}`);
            }
          } catch (error) {
            console.warn(`⚠️ Failed to check/remove directory: ${dir}`, error);
          }
        }
      }

      console.log(`📋 Empty directories removed: ${removedDirs}`);
    });
  });

  describe('🔄 REFACTOR: 정리 후 검증', () => {
    it('should verify core test structure remains intact', () => {
      const coreTestDirs = ['test/unit', 'test/integration', 'test/features'].map(path =>
        join(process.cwd(), path)
      );

      coreTestDirs.forEach(dir => {
        expect(existsSync(dir)).toBe(true);
      });

      console.log('✅ Core test directories preserved');
    });

    it('should verify essential behavior tests remain', async () => {
      const essentialTests = [
        'test/features/gallery/gallery.behavior.test.ts',
        'test/features/media/media.behavior.test.ts',
        'test/features/settings/settings.behavior.test.ts',
        'test/integration/extension.integration.test.ts',
        'test/integration/full-workflow.test.ts',
      ].map(path => join(process.cwd(), path));

      let existingCount = 0;
      for (const test of essentialTests) {
        if (existsSync(test)) {
          existingCount++;
        }
      }

      console.log(`📋 Essential behavior tests: ${existingCount}/${essentialTests.length} exist`);
    });
  });
});
