/**
 * @fileoverview 🔴 RED: 스크롤 중복 제어 플래그 TDD 테스트 (신규 기능)
 * 목표: 갤러리 open/close 시 signal 기반 스크롤 저장/복원 호출을 플래그로 비활성화할 수 있어야 한다.
 * 현재 구현에는 플래그가 없어 이 테스트는 실패(RED)해야 한다.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { openGallery, closeGallery } from '@shared/state/signals/gallery.signals';
import { ScrollPositionController } from '@shared/scroll/scroll-position-controller';
import { setScrollRestorationConfig } from '@shared/scroll/scroll-restoration-config';

// MediaInfo 최소 형태 (필요 필드만)
interface MinimalMediaInfo {
  id: string;
  type: 'image' | 'video';
  url: string;
}

describe('🔴 RED: Scroll Duplication Control Flag', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('플래그 비활성화 시 openGallery 가 ScrollPositionController.save 를 호출하지 않아야 한다', () => {
    const saveSpy = vi.spyOn(ScrollPositionController, 'save');
    setScrollRestorationConfig({ enableSignalBasedGalleryScroll: false });

    const items: MinimalMediaInfo[] = [
      { id: '1', type: 'image', url: 'https://example.com/1.jpg' },
    ];

    openGallery(items as any, 0);

    expect(saveSpy).not.toHaveBeenCalled();
  });

  it('플래그 비활성화 시 closeGallery 가 ScrollPositionController.restore 를 호출하지 않아야 한다', () => {
    const restoreSpy = vi.spyOn(ScrollPositionController, 'restore');

    const items: MinimalMediaInfo[] = [
      { id: '1', type: 'image', url: 'https://example.com/1.jpg' },
    ];
    openGallery(items as any, 0);
    restoreSpy.mockClear();

    setScrollRestorationConfig({ enableSignalBasedGalleryScroll: false });

    closeGallery();
    expect(restoreSpy).not.toHaveBeenCalled();
  });
});
