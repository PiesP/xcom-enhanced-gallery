import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  cleanupRouteScrollRestorer,
  initializeRouteScrollRestorer,
} from '@shared/scroll/route-scroll-restorer';
import { AnchorScrollPositionController } from '@shared/scroll/anchor-scroll-position-controller';
import { ScrollPositionController } from '@shared/scroll/scroll-position-controller';

// 목적: Anchor 복원 실패 시 Absolute 복원이 시도되는지 명시적으로 검증

describe('scroll fallback: anchor -> absolute', () => {
  beforeEach(() => {
    sessionStorage.clear();
    cleanupRouteScrollRestorer();
  });

  it('anchor restore 가 false 이면 absolute restore 가 호출된다', async () => {
    history.pushState({}, '', '/home');
    initializeRouteScrollRestorer({ enable: true, immediate: true });

    Object.defineProperty(window, 'scrollY', { value: 400, configurable: true });
    Object.defineProperty(window, 'pageYOffset', { value: 400, configurable: true });

    const anchorSave = vi.spyOn(AnchorScrollPositionController, 'save').mockReturnValue(true);
    const anchorRestore = vi
      .spyOn(AnchorScrollPositionController, 'restore')
      .mockReturnValue(false);
    const absoluteRestore = vi.spyOn(ScrollPositionController, 'restore');

    history.pushState({}, '', '/i/bookmarks');
    history.pushState({}, '', '/home');
    await Promise.resolve();

    expect(anchorSave).toHaveBeenCalled();
    expect(anchorRestore).toHaveBeenCalled();
    expect(absoluteRestore).toHaveBeenCalled();
  });
});
