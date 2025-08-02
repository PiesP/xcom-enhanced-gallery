/**
 * @fileoverview Phase 2: Utils 중복 제거 TDD 테스트
 * @description src/utils vs src/shared/utils 중복 해결
 * @phase RED-GREEN-REFACTOR
 */

import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';
import { describe, it, expect } from 'vitest';

const projectRoot = resolve(__dirname, '../..');
const srcUtilsPath = resolve(projectRoot, 'src/utils/index.ts');
const sharedUtilsPath = resolve(projectRoot, 'src/shared/utils');
const viteConfigPath = resolve(projectRoot, 'vite.config.ts');

describe('Phase 2: Utils 중복 제거 TDD', () => {
  describe('RED Phase: 중복 상태 검증', () => {
    it('src/utils/index.ts가 제거되어 중복이 해결되었다', () => {
      // GREEN: 중복이 해결된 상태임을 확인
      const utilsExists = existsSync(srcUtilsPath);
      const sharedUtilsExists = existsSync(sharedUtilsPath);

      expect(utilsExists).toBe(false); // 제거됨 (중복 해결)
      expect(sharedUtilsExists).toBe(true); // 이것은 유지
    });

    it('vite.config.ts가 src/shared/utils를 참조하고 있다', () => {
      const viteConfig = readFileSync(viteConfigPath, 'utf-8');
      const hasSharedUtilsAlias = viteConfig.includes(
        "'@/utils': path.resolve(__dirname, 'src/shared/utils')"
      );

      expect(hasSharedUtilsAlias).toBe(true); // 변경됨
    });

    it('테스트 파일들의 import가 수정되었다', () => {
      // 이제 테스트들이 직접 import를 사용하므로 @/utils 사용이 줄어들었다
      const testFiles = [
        'test/unit/shared/logger-import.test.ts',
        'test/unit/main/main-initialization.test.ts',
      ];

      let hasDirectImport = false;

      testFiles.forEach(testFile => {
        const fullPath = resolve(projectRoot, testFile);
        if (existsSync(fullPath)) {
          const content = readFileSync(fullPath, 'utf-8');
          if (content.includes("from '@shared/") || content.includes("import('@shared/")) {
            hasDirectImport = true;
          }
        }
      });

      expect(hasDirectImport).toBe(true); // 직접 import로 변경됨
    });
  });

  describe('GREEN Phase: 중복 해결 완료', () => {
    it('src/utils/index.ts가 제거되었어야 한다', () => {
      const utilsExists = existsSync(srcUtilsPath);

      // GREEN Phase에서는 이 파일이 제거되어야 함
      expect(utilsExists).toBe(false); // 성공적으로 제거됨
    });

    it('vite.config.ts가 src/shared/utils를 참조해야 한다', () => {
      const viteConfig = readFileSync(viteConfigPath, 'utf-8');
      const hasSharedUtilsAlias = viteConfig.includes(
        "'@/utils': path.resolve(__dirname, 'src/shared/utils')"
      );

      expect(hasSharedUtilsAlias).toBe(true); // 성공적으로 변경됨
    });

    it('src/shared/utils가 여전히 존재해야 한다', () => {
      const sharedUtilsExists = existsSync(sharedUtilsPath);
      expect(sharedUtilsExists).toBe(true); // 이것은 유지되어야 함
    });
  });

  describe('REFACTOR Phase: 구조 최적화 검증', () => {
    it('모든 유틸리티가 src/shared/utils에서 접근 가능해야 한다', () => {
      const indexPath = resolve(sharedUtilsPath, 'index.ts');

      if (existsSync(indexPath)) {
        const content = readFileSync(indexPath, 'utf-8');

        // 주요 유틸리티들이 export되는지 확인
        const requiredExports = [
          'safeQuerySelector',
          'combineClasses',
          'rafThrottle',
          'measurePerformance',
          'removeDuplicates',
          'galleryDebugUtils',
        ];

        requiredExports.forEach(exportName => {
          const hasExport = content.includes(exportName);
          expect(hasExport).toBe(true);
        });
      }
    });

    it('중복된 역할을 하는 파일이 없어야 한다', () => {
      // src/utils/index.ts가 제거되었으므로 중복 없음
      const utilsExists = existsSync(srcUtilsPath);
      expect(utilsExists).toBe(false);

      // src/shared/utils만 존재해야 함
      const sharedUtilsExists = existsSync(sharedUtilsPath);
      expect(sharedUtilsExists).toBe(true);
    });

    it('서비스들은 별도 경로에서 import되어야 한다', () => {
      // src/utils/index.ts가 서비스까지 export하던 것을 분리
      // 서비스는 @shared/services에서만 접근
      const sharedServicesPath = resolve(projectRoot, 'src/shared/services');
      expect(existsSync(sharedServicesPath)).toBe(true);
    });
  });
});
