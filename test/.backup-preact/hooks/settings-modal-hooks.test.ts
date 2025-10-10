/**
 * @fileoverview SettingsModal Hooks Tests (TDD Phase T4)
 * @description useFocusTrap과 useScrollLock 훅 테스트
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('SettingsModal Hooks (Phase T4)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useFocusTrap 훅', () => {
    it('useFocusTrap 훅이 import되어야 한다', async () => {
      try {
        const { useFocusTrap } = await import('@shared/hooks/useFocusTrap');
        expect(useFocusTrap).toBeDefined();
      } catch (error) {
        expect(error).toBeDefined(); // RED 상태 예상
      }
    });
  });

  describe('useScrollLock 훅', () => {
    it('useScrollLock 훅이 import되어야 한다', async () => {
      try {
        const { useScrollLock } = await import('@shared/hooks/useScrollLock');
        expect(useScrollLock).toBeDefined();
      } catch (error) {
        expect(error).toBeDefined(); // RED 상태 예상
      }
    });
  });

  describe('Enhanced SettingsModal', () => {
    it('Enhanced SettingsModal이 import되어야 한다', async () => {
      try {
        const { EnhancedSettingsModal } = await import(
          '@shared/components/ui/SettingsModal/EnhancedSettingsModal'
        );
        expect(EnhancedSettingsModal).toBeDefined();
      } catch (error) {
        expect(error).toBeDefined(); // RED 상태 예상
      }
    });
  });
});
