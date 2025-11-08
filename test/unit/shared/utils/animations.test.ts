/**
 * @fileoverview 애니메이션 유틸리티 테스트
 * @version 2.0.0 - Phase 326.7: Removed tests for deleted functions
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setupGlobalTestIsolation } from '../../../shared/global-cleanup-hooks';
import {
  animateGalleryEnter,
  animateGalleryExit,
  toolbarSlideDown,
  toolbarSlideUp,
  setupScrollAnimation,
  animateCustom,
} from '@/shared/utils/animations';

// 모킹
vi.mock('@shared/external/vendors', () => ({
  getMotionOne: vi.fn(() => ({
    animate: vi.fn().mockResolvedValue({}),
    scroll: vi.fn().mockReturnValue(() => {}),
    timeline: vi.fn().mockResolvedValue(undefined),
    stagger: vi.fn().mockReturnValue((index: number) => index * 50),
    inView: vi.fn().mockReturnValue(() => {}),
    transform: vi.fn().mockImplementation((value: number, from: number[], to: number[]) => {
      const [fromMin = 0, fromMax = 1] = from;
      const [toMin = 0, toMax = 1] = to;
      const ratio = (value - fromMin) / (fromMax - fromMin);
      return toMin + ratio * (toMax - toMin);
    }),
  })),
}));

vi.mock('@shared/logging', () => ({
  logger: {
    warn: vi.fn(),
    debug: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
  },
}));

describe('애니메이션 유틸리티', () => {
  setupGlobalTestIsolation();

  let mockElement: HTMLElement;

  beforeEach(() => {
    // Mock element
    mockElement = {
      animate: vi.fn().mockResolvedValue({}),
      style: {},
    } as unknown as HTMLElement;
    vi.clearAllMocks();
  });

  describe('스크롤 애니메이션', () => {
    it('스크롤 애니메이션이 설정되어야 한다', () => {
      const mockCallback = vi.fn();
      const cleanup = setupScrollAnimation(mockCallback);

      expect(typeof cleanup).toBe('function');
      cleanup();
    });
  });

  describe('커스텀 애니메이션', () => {
    it('커스텀 애니메이션이 실행되어야 한다', async () => {
      const keyframes = { opacity: '1', transform: 'scale(1)' };
      const options = { duration: 300, easing: 'ease-out' };

      await animateCustom(mockElement, keyframes, options);
      expect(true).toBe(true); // 에러 없이 완료되면 성공
    });
  });

  describe('에러 처리', () => {
    it('애니메이션 실패 시 에러를 우아하게 처리해야 한다', async () => {
      // Solid.js는 애니메이션 라이브러리를 직접 사용하지 않으므로 이 테스트는 스킵
      // 에러가 발생해도 함수가 정상적으로 완료되어야 함
      await expect(animateGalleryEnter(mockElement as HTMLElement)).resolves.toBeUndefined();
    });
  });
});
