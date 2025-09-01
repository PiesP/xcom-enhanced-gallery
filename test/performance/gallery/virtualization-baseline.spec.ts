/**
 * Phase 1 Baseline Performance Test (Virtualization 미도입 상태 측정)
 * - 목적: 현재 구현이 대량 아이템 렌더링 시 어떤 DOM 규모/시간 특성을 가지는지 고정
 * - 이 테스트는 (Phase 2) 가상 스크롤 도입 전 벤치마크 역할을 하며
 *   성능 수치를 강하게 단언(assert)하지 않는다 (회귀 모니터용 soft guard).
 */
import { beforeAll, describe, expect, it } from 'vitest';
import { galleryRenderer } from '@/features/gallery';
import { openGallery, closeGallery, galleryState } from '@shared/state/signals/gallery.signals';

interface MockMediaInfo {
  id: string;
  url: string;
  type: 'image' | 'video' | 'gif';
  filename: string;
}

function createMockMedia(count: number): MockMediaInfo[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `mock-${i}`,
    url: `https://example.com/media/${i}.jpg`,
    type: 'image',
    filename: `media_${i}.jpg`,
  }));
}

// 간단한 퍼포먼스 헬퍼 (JSDOM 환경에서는 상대 비교 용도)
function mark(name: string) {
  if (typeof performance !== 'undefined' && performance.mark) {
    performance.mark(name);
  }
}

function measure(name: string, start: string, end: string): number | null {
  if (typeof performance !== 'undefined' && performance.measure) {
    try {
      const m = performance.measure(name, start, end);
      return m.duration;
    } catch {
      return null;
    }
  }
  return null;
}

describe('Gallery Virtualization Baseline (Phase 1)', () => {
  const ITEM_COUNT = 600; // baseline 대량 수치
  let media: MockMediaInfo[];

  beforeAll(() => {
    media = createMockMedia(ITEM_COUNT);
  });

  it('대량 아이템 렌더링: 모든 아이템이 실제 DOM에 생성 (가상 스크롤 미사용 상태 벤치마크)', async () => {
    // Act
    mark('render-start');
    await galleryRenderer.render(media, { viewMode: 'vertical' });

    // 렌더가 비동기로 진행될 수 있으므로 microtask & animation frame 유사 대기
    await Promise.resolve();
    await Promise.resolve();

    mark('render-end');
    const duration = measure('render-duration', 'render-start', 'render-end');

    // Assert - 현재 구현은 모든 항목을 DOM에 삽입 (Phase2에서 DOM 축소 기대)
    const list = document.querySelector('[data-xeg-role="items-list"]');
    expect(list).not.toBeNull();
    const children = list ? Array.from(list.children) : [];
    expect(children.length).toBe(ITEM_COUNT);

    // Soft guard: duration이 null 이면 환경 미지원 -> 넘어감
    if (duration != null) {
      // 극단적으로 비정상(>5000ms)일 경우 회귀 의심 (JSDOM 느린 CI 고려 → 넉넉하게 설정)
      expect(duration).toBeLessThan(5000);
    }
  });

  it('갤러리 상태 시그널이 올바르게 반영됨 (isOpen & mediaItems)', async () => {
    expect(galleryState.value.isOpen).toBe(true);
    expect(galleryState.value.mediaItems.length).toBe(ITEM_COUNT);
  });

  it('갤러리 닫기 후 상태/DOM 해제 (baseline)', async () => {
    closeGallery();
    await Promise.resolve();
    // 컨테이너가 제거되었는지 확인 (GalleryRenderer cleanup)
    const container = document.querySelector('.xeg-gallery-renderer');
    expect(container).toBeNull();
    expect(galleryState.value.isOpen).toBe(false);
  });
});
