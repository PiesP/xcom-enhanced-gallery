/**
 * @file Phase G-3-3: gallery.signals.ts 네이티브 SolidJS 패턴 검증
 * @description gallery.signals.ts를 SolidJS 네이티브 패턴으로 전환하기 위한 RED 테스트
 */

import { describe, it, expect, beforeEach } from 'vitest';
import type { MediaInfo } from '@shared/types/media.types';

// Solid primitives (vendor manager를 통한 안전한 접근)
import { getSolidCore } from '@shared/external/vendors';
const { createRoot, createEffect } = getSolidCore();

/**
 * Phase G-3-3-1: 상태 정의 패턴 검증
 * galleryState가 네이티브 SolidJS Accessor 함수여야 함
 */
describe('Phase G-3-3-1: 상태 정의 패턴', () => {
  beforeEach(async () => {
    // 모듈 캐시 클리어하여 신선한 상태 보장
    const { initializeGalleryDerivedState } = await import('@shared/state/signals/gallery.signals');
    // 파생 상태 초기화
    initializeGalleryDerivedState();
  });

  it('galleryState는 Accessor<GalleryState> 함수여야 한다', async () => {
    const { galleryState } = await import('@shared/state/signals/gallery.signals');

    // 네이티브 패턴: galleryState는 함수여야 함
    expect(typeof galleryState).toBe('function');

    // 함수 호출로 상태 접근 가능
    const state = galleryState();
    expect(state).toHaveProperty('isOpen');
    expect(state).toHaveProperty('mediaItems');
    expect(state).toHaveProperty('currentIndex');
    expect(state).toHaveProperty('isLoading');
    expect(state).toHaveProperty('error');
    expect(state).toHaveProperty('viewMode');

    // 함수명 검증 (SolidJS accessor는 특정 이름을 가질 수 있음)
    expect(galleryState.name).toMatch(/readSignal|^$/);
  });

  it('galleryState는 레거시 .value 속성을 가지지 않아야 한다', async () => {
    const { galleryState } = await import('@shared/state/signals/gallery.signals');

    // 레거시 패턴 제거: .value getter/setter 없음
    const descriptor = Object.getOwnPropertyDescriptor(galleryState, 'value');
    expect(descriptor).toBeUndefined();
  });

  it('galleryState는 레거시 .subscribe 메서드를 가지지 않아야 한다', async () => {
    const { galleryState } = await import('@shared/state/signals/gallery.signals');

    // 레거시 패턴 제거: .subscribe() 없음
    expect((galleryState as any).subscribe).toBeUndefined();
  });
});

/**
 * Phase G-3-3-2: 상태 업데이트 패턴 검증
 * setGalleryState 함수를 통한 상태 업데이트
 */
describe('Phase G-3-3-2: 상태 업데이트 패턴', () => {
  beforeEach(async () => {
    const { initializeGalleryDerivedState } = await import('@shared/state/signals/gallery.signals');
    initializeGalleryDerivedState();
  });

  it('setGalleryState(newValue)는 직접 값 설정을 허용해야 한다', async () => {
    const { galleryState, setGalleryState } = await import('@shared/state/signals/gallery.signals');

    // 초기 상태
    const initial = galleryState();
    expect(initial.isOpen).toBe(false);

    // 직접 setter 호출
    setGalleryState({
      ...initial,
      isOpen: true,
      mediaItems: [{ url: 'test.jpg', type: 'image' } as MediaInfo],
    });

    // 상태 변경 확인
    expect(galleryState().isOpen).toBe(true);
    expect(galleryState().mediaItems).toHaveLength(1);
  });

  it('setGalleryState(updater)는 함수 업데이터를 허용해야 한다', async () => {
    const { galleryState, setGalleryState } = await import('@shared/state/signals/gallery.signals');

    // 초기 상태
    setGalleryState({
      isOpen: false,
      mediaItems: [],
      currentIndex: 0,
      isLoading: false,
      error: null,
      viewMode: 'vertical',
    });

    // 함수 업데이터
    setGalleryState(prev => ({
      ...prev,
      currentIndex: prev.currentIndex + 1,
    }));

    expect(galleryState().currentIndex).toBe(1);
  });

  it('setGalleryState는 레거시 .update() 메서드를 대체해야 한다', async () => {
    const { galleryState } = await import('@shared/state/signals/gallery.signals');

    // 레거시 .update() 메서드 없음
    expect((galleryState as any).update).toBeUndefined();
  });
});

/**
 * Phase G-3-3-3: 파생 상태 패턴 검증
 * Getter 함수들이 createMemo 또는 순수 함수로 최적화되어야 함
 */
describe('Phase G-3-3-3: 파생 상태 패턴', () => {
  beforeEach(async () => {
    const { initializeGalleryDerivedState } = await import('@shared/state/signals/gallery.signals');
    initializeGalleryDerivedState();
  });

  it('getCurrentMediaItem은 createMemo 또는 함수로 구현되어야 한다', async () => {
    const { galleryState, setGalleryState, getCurrentMediaItem } = await import(
      '@shared/state/signals/gallery.signals'
    );

    const testMedia: MediaInfo = { url: 'test.jpg', type: 'image' } as MediaInfo;

    setGalleryState({
      ...galleryState(),
      mediaItems: [testMedia],
      currentIndex: 0,
    });

    // Accessor 또는 함수 호출 방식
    const current =
      typeof getCurrentMediaItem === 'function' ? getCurrentMediaItem() : getCurrentMediaItem;

    expect(current).toBe(testMedia);
  });

  it('hasMediaItems는 reactiv하게 업데이트되어야 한다', async () => {
    const { galleryState, setGalleryState, hasMediaItems } = await import(
      '@shared/state/signals/gallery.signals'
    );

    // 빈 상태
    setGalleryState({
      ...galleryState(),
      mediaItems: [],
    });

    const initialHas = typeof hasMediaItems === 'function' ? hasMediaItems() : hasMediaItems;
    expect(initialHas).toBe(false);

    // 미디어 추가
    setGalleryState({
      ...galleryState(),
      mediaItems: [{ url: 'test.jpg', type: 'image' } as MediaInfo],
    });

    const updatedHas = typeof hasMediaItems === 'function' ? hasMediaItems() : hasMediaItems;
    expect(updatedHas).toBe(true);
  });

  it('getMediaItemsCount는 reactive하게 업데이트되어야 한다', async () => {
    const { galleryState, setGalleryState, getMediaItemsCount } = await import(
      '@shared/state/signals/gallery.signals'
    );

    setGalleryState({
      ...galleryState(),
      mediaItems: [
        { url: '1.jpg', type: 'image' } as MediaInfo,
        { url: '2.jpg', type: 'image' } as MediaInfo,
      ],
    });

    const count =
      typeof getMediaItemsCount === 'function' ? getMediaItemsCount() : getMediaItemsCount;

    expect(count).toBe(2);
  });
});

/**
 * Phase G-3-3-4: Effect 패턴 검증
 * createEffect를 통한 반응형 구독
 */
describe('Phase G-3-3-4: Effect 패턴', () => {
  beforeEach(async () => {
    const { initializeGalleryDerivedState } = await import('@shared/state/signals/gallery.signals');
    initializeGalleryDerivedState();
  });

  it('openGallery는 직접 setter를 사용해야 한다', async () => {
    const { galleryState, openGallery } = await import('@shared/state/signals/gallery.signals');

    const items: MediaInfo[] = [
      { url: '1.jpg', type: 'image' } as MediaInfo,
      { url: '2.jpg', type: 'image' } as MediaInfo,
    ];

    openGallery(items, 1);

    expect(galleryState().isOpen).toBe(true);
    expect(galleryState().mediaItems).toEqual(items);
    expect(galleryState().currentIndex).toBe(1);
  });

  it('closeGallery는 직접 setter를 사용해야 한다', async () => {
    const { galleryState, openGallery, closeGallery } = await import(
      '@shared/state/signals/gallery.signals'
    );

    openGallery([{ url: 'test.jpg', type: 'image' } as MediaInfo]);
    expect(galleryState().isOpen).toBe(true);

    closeGallery();
    expect(galleryState().isOpen).toBe(false);
    expect(galleryState().currentIndex).toBe(0);
  });

  it('외부 구독은 createEffect 패턴을 사용해야 한다', async () => {
    const { galleryState, setGalleryState } = await import('@shared/state/signals/gallery.signals');

    return createRoot(dispose => {
      const changes: boolean[] = [];

      // createEffect로 구독
      createEffect(() => {
        const state = galleryState();
        changes.push(state.isOpen);
      });

      // 비동기 상태 변경
      setTimeout(() => {
        setGalleryState({
          ...galleryState(),
          isOpen: true,
        });
      }, 0);

      // 비동기 완료 대기
      return new Promise<void>(resolve => {
        setTimeout(() => {
          dispose();
          expect(changes.length).toBeGreaterThan(0);
          resolve();
        }, 10);
      });
    });
  });
});

/**
 * Phase G-3-3-5: 타입 안전성 검증
 * Accessor/Setter 타입 계약
 */
describe('Phase G-3-3-5: 타입 안전성', () => {
  beforeEach(async () => {
    const { initializeGalleryDerivedState } = await import('@shared/state/signals/gallery.signals');
    initializeGalleryDerivedState();
  });

  it('galleryState는 Accessor 타입 특성을 가져야 한다', async () => {
    const { galleryState } = await import('@shared/state/signals/gallery.signals');

    // Accessor는 함수
    expect(typeof galleryState).toBe('function');

    // Accessor는 파라미터를 받지 않음
    expect(galleryState.length).toBe(0);

    // Accessor는 값을 반환
    const state = galleryState();
    expect(state).toBeDefined();
    expect(typeof state).toBe('object');
  });

  it('setGalleryState는 Setter 타입 특성을 가져야 한다', async () => {
    const { setGalleryState } = await import('@shared/state/signals/gallery.signals');

    // Setter는 함수
    expect(typeof setGalleryState).toBe('function');

    // Setter는 1개 파라미터 (value | updater)
    expect(setGalleryState.length).toBe(1);
  });

  it('파생 상태 함수들은 올바른 반환 타입을 가져야 한다', async () => {
    const { isGalleryOpen, getCurrentIndex, getMediaItems, isLoading, getError, getViewMode } =
      await import('@shared/state/signals/gallery.signals');

    // 각 함수의 반환 타입 검증
    expect(typeof (isGalleryOpen as any)()).toBe('boolean');
    expect(typeof (getCurrentIndex as any)()).toBe('number');
    expect(Array.isArray((getMediaItems as any)())).toBe(true);
    expect(typeof (isLoading as any)()).toBe('boolean');
    expect((getError as any)() === null || typeof (getError as any)() === 'string').toBe(true);
    expect(['horizontal', 'vertical'].includes((getViewMode as any)())).toBe(true);
  });
});
