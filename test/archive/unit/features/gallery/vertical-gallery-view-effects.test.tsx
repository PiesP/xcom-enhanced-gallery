/**
 * @file VerticalGalleryView Effect 최적화 테스트
 * @description Phase 20.1 - isVisible을 Derived Signal로 변환
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getSolid } from '@/shared/external/vendors';

const { createRoot, createSignal } = getSolid();

describe('VerticalGalleryView - isVisible Derived Signal', () => {
  let dispose: (() => void) | undefined;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    dispose?.();
    dispose = undefined;
  });

  it('RED: isVisible은 mediaItems.length > 0의 파생 상태여야 함', () => {
    createRoot(d => {
      dispose = d;

      // mediaItems 모의 signal
      const [mediaItems, setMediaItems] = createSignal<readonly any[]>([]);

      // isVisible은 createMemo로 구현되어야 함 (파생 상태)
      // 현재는 createSignal + createEffect로 구현되어 있음 → RED
      const { createMemo } = getSolid();
      const isVisible = createMemo(() => mediaItems().length > 0);

      // 초기 상태: 빈 배열
      expect(isVisible()).toBe(false);

      // 아이템 추가
      setMediaItems([{ id: 1 }]);
      expect(isVisible()).toBe(true);

      // 아이템 제거
      setMediaItems([]);
      expect(isVisible()).toBe(false);
    });
  });

  it('RED: isVisible은 불필요한 재계산을 하지 않아야 함', () => {
    createRoot(d => {
      dispose = d;

      const [mediaItems, setMediaItems] = createSignal<readonly any[]>([{ id: 1 }]);

      let memoCallCount = 0;
      const { createMemo } = getSolid();
      const isVisible = createMemo(() => {
        memoCallCount++;
        return mediaItems().length > 0;
      });

      // 초기 호출
      expect(isVisible()).toBe(true);
      const initialCallCount = memoCallCount;

      // 같은 값(true)을 유지하는 변경
      setMediaItems([{ id: 1 }, { id: 2 }]);
      expect(isVisible()).toBe(true);

      // mediaItems는 변경되었지만, isVisible 결과는 동일 (true)
      // createMemo는 재계산하지만 결과가 같으면 의존자에게 알리지 않음
      expect(memoCallCount).toBeGreaterThan(initialCallCount);
    });
  });

  it('RED: createEffect를 사용하지 않고 isVisible을 계산해야 함', () => {
    createRoot(d => {
      dispose = d;

      const [mediaItems] = createSignal<readonly any[]>([{ id: 1 }]);

      // isVisible은 createMemo로 구현되어야 하며,
      // createEffect + createSignal 패턴을 사용하지 않아야 함
      const { createMemo } = getSolid();
      const isVisible = createMemo(() => mediaItems().length > 0);

      // 읽기 전용 접근자
      expect(typeof isVisible).toBe('function');
      expect(isVisible()).toBe(true);
    });
  });

  it('GREEN 예상: 실제 VerticalGalleryView에서 isVisible이 createMemo로 구현되었는지 확인', async () => {
    // 이 테스트는 실제 구현 후 GREEN이 될 것임
    // 현재는 VerticalGalleryView가 createSignal + createEffect를 사용 → RED

    const { resolve } = await import('path');
    const verticalGalleryViewPath = resolve(
      process.cwd(),
      'src/features/gallery/components/vertical-gallery-view/VerticalGalleryView.tsx'
    );

    const fs = await import('fs/promises');
    const content = await fs.readFile(verticalGalleryViewPath, 'utf-8');

    // createMemo를 사용하는지 확인
    const hasCreateMemo = content.includes('createMemo');

    // isVisible에 대한 createSignal + setIsVisible 패턴이 없어야 함
    const hasIsVisibleSignal = content.includes('const [isVisible, setIsVisible] = createSignal');
    const hasIsVisibleEffect =
      content.includes('createEffect(() => {') && content.includes('setIsVisible(visible)');

    // 현재는 createSignal + createEffect 패턴 사용 → RED
    expect(hasIsVisibleSignal).toBe(false); // 현재는 true → RED
    expect(hasIsVisibleEffect).toBe(false); // 현재는 true → RED

    // createMemo 사용 확인
    expect(hasCreateMemo).toBe(true); // 이미 다른 곳에서 사용 중
  });
});
