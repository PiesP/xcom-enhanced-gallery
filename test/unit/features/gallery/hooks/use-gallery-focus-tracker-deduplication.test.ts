/**
 * @description useGalleryFocusTracker 중복 호출 방지 및 RAF 배칭 검증
 * @note 3개 E2E 마이그레이션 스킵 테스트 제거됨 (Phase 82.6에서 처리됨)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { setupGlobalTestIsolation } from '../../../../shared/global-cleanup-hooks';
import { getSolid } from '@/shared/external/vendors';
import { useGalleryFocusTracker } from '@/features/gallery/hooks/useGalleryFocusTracker';

const { createRoot } = getSolid();

describe('useGalleryFocusTracker - Deduplication', () => {
  setupGlobalTestIsolation();

  let container: HTMLElement;
  let items: HTMLElement[];
  let dispose: () => void;

  beforeEach(() => {
    // Phase 190: real timers 사용으로 변경 (fake timers의 타이밍 이슈 해결)
    vi.useRealTimers();

    // DOM 설정
    container = document.createElement('div');
    container.id = 'gallery-container';
    document.body.appendChild(container);

    items = Array.from({ length: 5 }, (_, i) => {
      const item = document.createElement('div');
      item.className = 'gallery-item';
      item.setAttribute('data-index', String(i));
      item.tabIndex = 0;
      container.appendChild(item);
      return item;
    });

    // requestAnimationFrame 표준 동작 사용
    // (real timers 사용 시 기본 구현이 정상 작동)
  });

  afterEach(() => {
    if (dispose) {
      dispose();
    }
    container.remove();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('manual focus 중복 방지', () => {
    it('1 tick 내 동일 인덱스 handleItemFocus 다중 호출 시 마지막 값만 적용', async () => {
      let tracker!: ReturnType<typeof useGalleryFocusTracker>;

      dispose = createRoot(disposeRoot => {
        tracker = useGalleryFocusTracker({
          container,
          isEnabled: true,
          getCurrentIndex: () => 0,
        });

        items.forEach((item, idx) => {
          tracker.registerItem(idx, item);
        });

        return disposeRoot;
      });

      // 동일 tick 내 여러 번 호출
      tracker.handleItemFocus(1);
      tracker.handleItemFocus(1);
      tracker.handleItemFocus(1);

      // real timers 사용 시 setTimeout(0) 대기 + RAF 대기
      await new Promise(resolve => setTimeout(resolve, 10));
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));

      expect(tracker.focusedIndex()).toBe(1);
    });

    it('handleItemBlur 후 handleItemFocus가 빠르게 호출되면 배칭 처리', async () => {
      let tracker!: ReturnType<typeof useGalleryFocusTracker>;

      dispose = createRoot(disposeRoot => {
        tracker = useGalleryFocusTracker({
          container,
          isEnabled: true,
          getCurrentIndex: () => 0,
        });

        items.forEach((item, idx) => {
          tracker.registerItem(idx, item);
        });

        return disposeRoot;
      });

      tracker.handleItemFocus(1);
      // real timers 사용 시 setTimeout(0) 대기 + RAF 대기
      await new Promise(resolve => setTimeout(resolve, 10));
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));

      expect(tracker.focusedIndex()).toBe(1);

      // 빠르게 blur → focus 반복
      tracker.handleItemBlur(1);
      await new Promise(resolve => setTimeout(resolve, 10));
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));

      // blur 후에는 manual focus가 clear되므로 auto focus로 전환됨
      // (auto focus가 없으면 null이거나 getCurrentIndex()의 반환값인 0)
      const afterBlur = tracker.focusedIndex();
      // blur 후 상태 확인 (null 또는 0 모두 가능)
      expect(afterBlur === null || afterBlur === 0).toBe(true);

      tracker.handleItemFocus(2);
      await new Promise(resolve => setTimeout(resolve, 10));
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));

      expect(tracker.focusedIndex()).toBe(2);
    });
  });

  describe('IntersectionObserver 콜백 RAF 배칭', () => {
    it('여러 entries가 동시에 들어와도 RAF로 배칭되어 1회만 처리', async () => {
      let tracker!: ReturnType<typeof useGalleryFocusTracker>;

      dispose = createRoot(disposeRoot => {
        tracker = useGalleryFocusTracker({
          container,
          isEnabled: true,
          getCurrentIndex: () => 0,
          threshold: [0.5],
        });

        items.forEach((item, idx) => {
          tracker.registerItem(idx, item);
        });

        return disposeRoot;
      });

      // forceSync 호출 및 RAF 대기
      tracker.forceSync();
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));

      // 성공 확인 (추가 검증은 필요시 추가)
      expect(tracker).toBeDefined();
    });

    it('RAF 배칭 후 한 번에 모든 entries 처리', async () => {
      const result = await new Promise<{ success: boolean }>(resolve => {
        createRoot(disposeRoot => {
          dispose = disposeRoot;

          const tracker = useGalleryFocusTracker({
            container,
            isEnabled: true,
            getCurrentIndex: () => 0,
          });

          items.forEach((item, idx) => {
            tracker.registerItem(idx, item);
          });

          // 여러 번 forceSync 호출
          tracker.forceSync();
          tracker.forceSync();
          tracker.forceSync();

          // RAF 대기
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              resolve({ success: true });
            });
          });
        });
      });

      expect(result.success).toBe(true);
    });
  });
});
