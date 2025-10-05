/**
 * Phase 4B: Investigation-based File Removal
 * Epic BUNDLE-SIZE-DEEP-OPTIMIZATION
 *
 * 분석 결과 기반으로 안전하게 제거 가능한 파일들을 검증합니다.
 * - 모든 대상 파일은 0 imports 확인 완료
 * - 각 파일은 위임(delegation) 또는 불필요한 re-export
 */

import { describe, it, expect } from 'vitest';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import process from 'node:process';

const ROOT = join(process.cwd(), 'src');

describe('Phase 4B: Investigation-based File Removal', () => {
  describe('Component Wrappers', () => {
    it('should remove UnifiedSettingsModal (단순 SettingsModal wrapper, 0 imports)', () => {
      const filePath = join(ROOT, 'shared/components/ui/SettingsModal/UnifiedSettingsModal.tsx');
      expect(existsSync(filePath)).toBe(false);
    });
  });

  describe('Vendor API Re-exports', () => {
    it('should remove vendor-api.ts (vendor-api-safe.ts로 위임, 0 imports)', () => {
      const filePath = join(ROOT, 'shared/external/vendors/vendor-api.ts');
      expect(existsSync(filePath)).toBe(false);
    });
  });

  describe('Service Re-exports', () => {
    it('should remove core-icons.ts (iconRegistry.ts로 위임, 0 imports)', () => {
      const filePath = join(ROOT, 'shared/services/core-icons.ts');
      expect(existsSync(filePath)).toBe(false);
    });

    it('should remove event-managers.ts (통합 인덱스, 0 imports)', () => {
      const filePath = join(ROOT, 'shared/services/event-managers.ts');
      expect(existsSync(filePath)).toBe(false);
    });

    it('should remove icon-types.ts (빈 파일)', () => {
      const filePath = join(ROOT, 'shared/services/icon-types.ts');
      expect(existsSync(filePath)).toBe(false);
    });
  });

  describe('Utility Re-exports', () => {
    it('should remove accessibility/barrel.ts (불필요한 re-export, 0 imports)', () => {
      const filePath = join(ROOT, 'shared/utils/accessibility/barrel.ts');
      expect(existsSync(filePath)).toBe(false);
    });

    it('should remove BatchDOMUpdateManager.ts (DOMBatcher로 위임, 0 imports)', () => {
      const filePath = join(ROOT, 'shared/utils/dom/BatchDOMUpdateManager.ts');
      expect(existsSync(filePath)).toBe(false);
    });

    it('should remove position-calculator.ts (calculateMenuPosition 함수, 0 imports)', () => {
      const filePath = join(ROOT, 'shared/utils/position-calculator.ts');
      expect(existsSync(filePath)).toBe(false);
    });
  });

  describe('Verification Summary', () => {
    it('should have removed exactly 8 files', () => {
      const removedFiles = [
        'shared/components/ui/SettingsModal/UnifiedSettingsModal.tsx',
        'shared/external/vendors/vendor-api.ts',
        'shared/services/core-icons.ts',
        'shared/services/event-managers.ts',
        'shared/services/icon-types.ts',
        'shared/utils/accessibility/barrel.ts',
        'shared/utils/dom/BatchDOMUpdateManager.ts',
        'shared/utils/position-calculator.ts',
      ];

      const existingFiles = removedFiles.filter(file => existsSync(join(ROOT, file)));

      expect(existingFiles).toHaveLength(0);
      expect(removedFiles).toHaveLength(8);
    });
  });
});
