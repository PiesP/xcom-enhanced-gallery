/**
 * Phase 99: Signal 타입 단언 제거 테스트
 *
 * 핵심 발견: SafeSignal<T>와 galleryState는 이미 { value: T } 구조를 구현하고 있어
 * useSelector와 직접 호환됩니다. from() 변환이나 별도 Accessor가 불필요합니다.
 */

import { describe, it, expect } from 'vitest';

describe('Phase 99: Signal 타입 단언 제거', () => {
  describe('galleryState Signal 인터페이스 검증', () => {
    it('galleryState는 { value: GalleryState } 구조를 가져야 한다', async () => {
      const { galleryState } = await import('../../../src/shared/state/signals/gallery.signals');

      // galleryState는 getter 객체로 { value: ... } 구조 구현
      expect(typeof galleryState).toBe('object');
      expect(galleryState).toHaveProperty('value');

      // 초기값 확인 (isOpen: false)
      const state = galleryState.value;
      expect(state).toMatchObject({ isOpen: false });
    });

    it('galleryState는 타입 단언 없이 useSelector에 사용 가능해야 한다', async () => {
      const { galleryState } = await import('../../../src/shared/state/signals/gallery.signals');
      const { useSelector } = await import('../../../src/shared/utils/signal-selector');

      // 타입 단언 없이 useSelector에 전달 가능
      const isOpen = useSelector(
        galleryState, // ✅ as unknown as 불필요
        state => state.isOpen
      );

      expect(typeof isOpen).toBe('function');
      expect(isOpen()).toBe(false);
    });
  });

  describe('downloadState Signal 인터페이스 검증', () => {
    it('downloadState는 { value: DownloadState } 구조를 가져야 한다', async () => {
      const { downloadState } = await import('../../../src/shared/state/signals/download.signals');

      // downloadState는 SafeSignal로 { value: ... } 구조 구현
      expect(typeof downloadState).toBe('object');
      expect(downloadState).toHaveProperty('value');

      // 초기값 확인 (activeTasks: Map, isProcessing: false)
      const state = downloadState.value;
      expect(state).toMatchObject({
        isProcessing: false,
        globalProgress: 0,
      });
      expect(state.activeTasks).toBeInstanceOf(Map);
      expect(state.activeTasks.size).toBe(0);
    });

    it('downloadState는 타입 단언 없이 useSelector에 사용 가능해야 한다', async () => {
      const { downloadState } = await import('../../../src/shared/state/signals/download.signals');
      const { useSelector } = await import('../../../src/shared/utils/signal-selector');

      // 타입 단언 없이 useSelector에 전달 가능
      const isProcessing = useSelector(
        downloadState, // ✅ as unknown as 불필요
        state => state.isProcessing
      );

      expect(typeof isProcessing).toBe('function');
      expect(isProcessing()).toBe(false);
    });
  });

  describe('타입 단언 제거 검증', () => {
    it('ToastContainer.tsx는 타입 단언을 사용하지 않아야 한다', async () => {
      const fs = await import('node:fs');
      const path = await import('node:path');

      const filePath = path.resolve(
        process.cwd(),
        'src/shared/components/ui/Toast/ToastContainer.tsx'
      );
      const source = fs.readFileSync(filePath, 'utf-8');

      // manager.signal 단언 제거 확인
      const assertionCount = (source.match(/manager\.signal as unknown as/g) || []).length;
      expect(assertionCount).toBe(0);
    });

    it('useGalleryScroll.ts는 타입 단언을 사용하지 않아야 한다', async () => {
      const fs = await import('node:fs');
      const path = await import('node:path');

      const filePath = path.resolve(
        process.cwd(),
        'src/features/gallery/hooks/useGalleryScroll.ts'
      );
      const source = fs.readFileSync(filePath, 'utf-8');

      // galleryState 단언 제거 확인
      const assertionCount = (source.match(/galleryState as unknown as/g) || []).length;
      expect(assertionCount).toBe(0);
    });

    it('VerticalGalleryView.tsx는 Signal 타입 단언을 사용하지 않아야 한다', async () => {
      const fs = await import('node:fs');
      const path = await import('node:path');

      const filePath = path.resolve(
        process.cwd(),
        'src/features/gallery/components/vertical-gallery-view/VerticalGalleryView.tsx'
      );
      const source = fs.readFileSync(filePath, 'utf-8');

      // galleryState와 downloadState 단언 제거 확인
      const galleryStateAssertions = (source.match(/galleryState as unknown as/g) || []).length;
      const downloadStateAssertions = (source.match(/downloadState as unknown as/g) || []).length;

      // 설정 경로 단언 4개는 허용, Signal 단언 5개만 제거
      expect(galleryStateAssertions).toBe(0);
      expect(downloadStateAssertions).toBe(0);
    });
  });
});
