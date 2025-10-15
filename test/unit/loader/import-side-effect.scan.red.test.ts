import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// 임포트 시점 부작용(전역 이벤트 등록)이 없어야 하는 모듈 목록
// 엔트리포인트(main.ts)는 예외(실행을 트리거하므로 스킵)
const MODULES: string[] = [
  '@/shared/utils/events',
  '@shared/utils/scroll/scroll-utils',
  '@shared/state/signals/toolbar.signals',
  '@shared/services/core-services',
  '@features/gallery/GalleryApp',
  '@features/gallery/GalleryRenderer',
  '@shared/components/ui',
  '@shared/components/hoc',
  '@shared/container/service-accessors',
];

describe('U5: import 시점 부작용 스캔', () => {
  let docAddSpy: ReturnType<typeof vi.spyOn>;
  let docRemoveSpy: ReturnType<typeof vi.spyOn>;
  let winAddSpy: ReturnType<typeof vi.spyOn>;
  let winRemoveSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.resetModules();
    docAddSpy = vi.spyOn(globalThis.document, 'addEventListener');
    docRemoveSpy = vi.spyOn(globalThis.document, 'removeEventListener');
    winAddSpy = vi.spyOn(globalThis, 'addEventListener');
    winRemoveSpy = vi.spyOn(globalThis, 'removeEventListener');
  });

  afterEach(() => {
    docAddSpy.mockRestore();
    docRemoveSpy.mockRestore();
    winAddSpy.mockRestore();
    winRemoveSpy.mockRestore();
  });

  it('지정 모듈 임포트 시 전역 이벤트 등록이 발생하지 않아야 한다', async () => {
    for (const mod of MODULES) {
      // 각 모듈을 새 컨텍스트로 임포트하여 사이드이펙트 발생 여부를 독립적으로 확인
      await import(mod);

      // 임포트 과정에서 전역 이벤트 리스너 등록이 없어야 함
      expect(docAddSpy, `${mod}: document.addEventListener called`).not.toHaveBeenCalled();
      expect(docRemoveSpy, `${mod}: document.removeEventListener called`).not.toHaveBeenCalled();
      expect(winAddSpy, `${mod}: window.addEventListener called`).not.toHaveBeenCalled();
      expect(winRemoveSpy, `${mod}: window.removeEventListener called`).not.toHaveBeenCalled();

      // 다음 모듈 검증을 위해 호출 내역 리셋
      docAddSpy.mockClear();
      docRemoveSpy.mockClear();
      winAddSpy.mockClear();
      winRemoveSpy.mockClear();

      // 모듈 캐시 리셋으로 다음 루프에서 재평가 가능하게 함
      vi.resetModules();
    }
  });
});
