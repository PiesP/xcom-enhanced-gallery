/**
 * @fileoverview Body Scroll Manager 테스트
 * Epic: SCROLL-ISOLATION-CONSOLIDATION Phase 3
 * TDD Phase: RED (테스트 작성)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

/**
 * Body Scroll Manager 계약 테스트
 *
 * 목표:
 * - 통합 Body Scroll 관리자로 모달 충돌 완전 해결
 * - 우선순위 시스템으로 갤러리/Settings 동시 사용 지원
 * - 중첩 lock/unlock 안전 처리
 *
 * 테스트 범위:
 * 1. 기본 lock/unlock 동작
 * 2. 우선순위 시스템 (갤러리: 5, Settings: 10)
 * 3. 중복 lock 처리
 * 4. unlock 시 원본 상태 복원
 * 5. 다중 컨텍스트 동시 사용
 * 6. 우선순위에 따른 최고 우선순위만 body.overflow 조작
 */

interface BodyScrollManager {
  lock(id: string, priority?: number): void;
  unlock(id: string): void;
  isLocked(id?: string): boolean;
  getActiveLocks(): string[];
  clear(): void;
}

describe('BodyScrollManager', () => {
  let manager: BodyScrollManager;
  let originalOverflow: string;

  beforeEach(async () => {
    // 원본 overflow 저장
    originalOverflow = document.body.style.overflow;
    document.body.style.overflow = '';

    // 테스트용 mock manager (구현 전이므로 import 실패 예상)
    try {
      const module = await import('@shared/utils/scroll/body-scroll-manager');
      manager = module.bodyScrollManager;
      manager.clear();
    } catch {
      // RED: 아직 구현되지 않음
      manager = null as unknown as BodyScrollManager;
    }
  });

  afterEach(() => {
    // 테스트 후 정리
    document.body.style.overflow = originalOverflow;
    if (manager && typeof manager.clear === 'function') {
      manager.clear();
    }
  });

  describe('기본 lock/unlock 동작', () => {
    it('should lock body scroll with default priority', () => {
      expect(manager).toBeDefined();
      expect(typeof manager.lock).toBe('function');

      manager.lock('test-id');
      expect(manager.isLocked('test-id')).toBe(true);
      expect(document.body.style.overflow).toBe('hidden');
    });

    it('should unlock body scroll and restore original overflow', () => {
      expect(manager).toBeDefined();

      document.body.style.overflow = 'auto';
      manager.lock('test-id');
      expect(document.body.style.overflow).toBe('hidden');

      manager.unlock('test-id');
      expect(manager.isLocked('test-id')).toBe(false);
      expect(document.body.style.overflow).toBe('auto');
    });

    it('should handle unlock of non-existent lock gracefully', () => {
      expect(manager).toBeDefined();

      expect(() => {
        manager.unlock('non-existent-id');
      }).not.toThrow();
      expect(manager.isLocked('non-existent-id')).toBe(false);
    });
  });

  describe('우선순위 시스템', () => {
    it('should prioritize higher priority lock', () => {
      expect(manager).toBeDefined();

      // 갤러리 lock (priority: 5)
      manager.lock('gallery', 5);
      expect(document.body.style.overflow).toBe('hidden');

      // Settings lock (priority: 10, 더 높음)
      manager.lock('settings', 10);
      expect(document.body.style.overflow).toBe('hidden');

      // Settings unlock (갤러리 lock은 유지)
      manager.unlock('settings');
      expect(document.body.style.overflow).toBe('hidden'); // 갤러리가 아직 잠김
      expect(manager.isLocked('gallery')).toBe(true);

      // 갤러리 unlock (모든 lock 해제)
      manager.unlock('gallery');
      expect(document.body.style.overflow).not.toBe('hidden');
    });

    it('should keep body locked when lower priority unlocks', () => {
      expect(manager).toBeDefined();

      // Settings lock (priority: 10)
      manager.lock('settings', 10);
      expect(document.body.style.overflow).toBe('hidden');

      // 갤러리 lock (priority: 5, 더 낮음)
      manager.lock('gallery', 5);
      expect(document.body.style.overflow).toBe('hidden');

      // 갤러리 unlock (Settings는 여전히 잠김)
      manager.unlock('gallery');
      expect(document.body.style.overflow).toBe('hidden'); // Settings가 여전히 잠김
      expect(manager.isLocked('settings')).toBe(true);
    });

    it('should use default priority (0) when not specified', () => {
      expect(manager).toBeDefined();

      manager.lock('default-priority');
      expect(manager.isLocked('default-priority')).toBe(true);

      // 높은 우선순위 lock 추가
      manager.lock('high-priority', 10);
      expect(manager.isLocked('high-priority')).toBe(true);

      // 기본 우선순위 unlock (높은 우선순위는 유지)
      manager.unlock('default-priority');
      expect(document.body.style.overflow).toBe('hidden'); // 높은 우선순위가 유지
    });
  });

  describe('중복 lock 처리', () => {
    it('should handle duplicate lock of same id', () => {
      expect(manager).toBeDefined();

      manager.lock('test-id', 5);
      expect(manager.isLocked('test-id')).toBe(true);

      // 같은 id로 다시 lock (우선순위 업데이트)
      manager.lock('test-id', 10);
      expect(manager.isLocked('test-id')).toBe(true);

      // unlock 한 번으로 해제 (중복 카운트 없음)
      manager.unlock('test-id');
      expect(manager.isLocked('test-id')).toBe(false);
    });

    it('should update priority when re-locking with different priority', () => {
      expect(manager).toBeDefined();

      manager.lock('test-id', 5);
      manager.lock('other-id', 3);

      // test-id 우선순위를 1로 낮춤 (other-id보다 낮음)
      manager.lock('test-id', 1);

      // test-id unlock 시 other-id가 최고 우선순위
      manager.unlock('test-id');
      expect(document.body.style.overflow).toBe('hidden'); // other-id가 유지
      expect(manager.isLocked('other-id')).toBe(true);
    });
  });

  describe('다중 컨텍스트 관리', () => {
    it('should track multiple active locks', () => {
      expect(manager).toBeDefined();

      manager.lock('gallery', 5);
      manager.lock('settings', 10);
      manager.lock('tooltip', 1);

      const activeLocks = manager.getActiveLocks();
      expect(activeLocks).toContain('gallery');
      expect(activeLocks).toContain('settings');
      expect(activeLocks).toContain('tooltip');
      expect(activeLocks).toHaveLength(3);
    });

    it('should return empty array when no locks active', () => {
      expect(manager).toBeDefined();

      const activeLocks = manager.getActiveLocks();
      expect(activeLocks).toEqual([]);
      expect(manager.isLocked()).toBe(false);
    });

    it('should check global lock status', () => {
      expect(manager).toBeDefined();

      expect(manager.isLocked()).toBe(false);

      manager.lock('test-id');
      expect(manager.isLocked()).toBe(true); // 전역 lock 상태

      manager.unlock('test-id');
      expect(manager.isLocked()).toBe(false);
    });
  });

  describe('원본 상태 복원', () => {
    it('should restore original overflow when all locks released', () => {
      expect(manager).toBeDefined();

      document.body.style.overflow = 'scroll';

      manager.lock('test-id-1', 5);
      manager.lock('test-id-2', 3);
      expect(document.body.style.overflow).toBe('hidden');

      manager.unlock('test-id-1');
      expect(document.body.style.overflow).toBe('hidden'); // test-id-2 유지

      manager.unlock('test-id-2');
      expect(document.body.style.overflow).toBe('scroll'); // 원본 복원
    });

    it('should handle empty original overflow correctly', () => {
      expect(manager).toBeDefined();

      document.body.style.overflow = '';

      manager.lock('test-id');
      expect(document.body.style.overflow).toBe('hidden');

      manager.unlock('test-id');
      expect(document.body.style.overflow).toBe(''); // 빈 문자열 복원
    });
  });
});
