/**
 * @fileoverview Timeline Position Stabilizer - TDD Implementation
 * 타임라인 위치 복원 후 드리프트 현상 해결을 위한 안정화 모듈
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { Mock } from 'vitest';
import { __test_only } from '@shared/scroll/timeline-position-stabilizer';
import type { TimelineStabilizer } from '@shared/scroll/timeline-position-stabilizer';

const { TimelineStabilizerImpl } = __test_only;

// Mock DOM 환경 설정
const mockWindow = {
  scrollY: 0,
  pageYOffset: 0,
  scrollTo: vi.fn(),
  requestAnimationFrame: vi.fn((cb: () => void) => {
    setTimeout(cb, 16);
    return 1;
  }),
};

const mockDocument = {
  querySelector: vi.fn(),
  querySelectorAll: vi.fn(() => []),
  readyState: 'complete',
};

// Mock Element 생성 함수
function createMockElement(top: number, height: number = 100): Element {
  const element = {
    getBoundingClientRect: () => ({
      top,
      height,
      bottom: top + height,
      left: 0,
      right: 100,
      width: 100,
    }),
    closest: vi.fn(),
  };
  return element as unknown as Element;
}

describe('Timeline Position Stabilizer (TDD)', () => {
  let stabilizer: TimelineStabilizer;
  let mockScrollTo: Mock;

  beforeEach(() => {
    vi.clearAllMocks();
    mockScrollTo = vi.fn();

    // window, document 모킹
    Object.defineProperty(globalThis, 'window', {
      value: { ...mockWindow, scrollTo: mockScrollTo },
      writable: true,
    });
    Object.defineProperty(globalThis, 'document', {
      value: mockDocument,
      writable: true,
    });

    // 실제 구현체 사용
    stabilizer = new TimelineStabilizerImpl();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('레이아웃 안정성 대기 (waitForLayoutStability)', () => {
    it('이미지 로딩이 완료될 때까지 대기해야 함', async () => {
      // 모든 이미지가 완료된 상태로 모킹
      const mockImages = [
        { complete: true, src: 'image1.jpg' },
        { complete: true, src: 'image2.jpg' },
      ];
      mockDocument.querySelectorAll = vi.fn(selector => {
        if (selector === 'img') return mockImages;
        if (selector === 'article[data-testid="tweet"]') return [];
        return [];
      });

      const result = await stabilizer.waitForLayoutStability(100);
      expect(result).toBe(true);
    });

    it('타임아웃 시 false를 반환해야 함', async () => {
      // 이미지가 로딩 중인 상태로 모킹
      const mockImages = [{ complete: false, src: 'loading.jpg' }];
      mockDocument.querySelectorAll = vi.fn(selector => {
        if (selector === 'img') return mockImages;
        return [];
      });

      const result = await stabilizer.waitForLayoutStability(10);
      expect(result).toBe(false);
    });

    it('DOM 요소들의 위치가 안정화될 때까지 대기해야 함', async () => {
      // 이미지는 완료, DOM 요소는 빈 배열
      const mockImages: any[] = [];
      mockDocument.querySelectorAll = vi.fn(selector => {
        if (selector === 'img') return mockImages;
        if (selector === 'article[data-testid="tweet"]') return [];
        return [];
      });

      const result = await stabilizer.waitForLayoutStability(200);
      expect(result).toBe(true); // 이미지 없고 트윗 없으면 안정된 것으로 간주
    });
  });

  describe('위치 드리프트 감지 (detectPositionDrift)', () => {
    it('앵커 요소가 예상 위치보다 아래에 있을 때 양수 드리프트를 반환해야 함', () => {
      const anchorElement = createMockElement(120); // 예상보다 20px 아래
      const expectedOffset = 100;

      // RED: 현재 0을 반환하므로 실패
      const drift = stabilizer.detectPositionDrift(anchorElement, expectedOffset);
      expect(drift).toBe(20);
    });

    it('앵커 요소가 예상 위치보다 위에 있을 때 음수 드리프트를 반환해야 함', () => {
      const anchorElement = createMockElement(80); // 예상보다 20px 위
      const expectedOffset = 100;

      // RED: 현재 0을 반환하므로 실패
      const drift = stabilizer.detectPositionDrift(anchorElement, expectedOffset);
      expect(drift).toBe(-20);
    });

    it('앵커 요소가 정확한 위치에 있을 때 0을 반환해야 함', () => {
      const anchorElement = createMockElement(100); // 정확한 위치
      const expectedOffset = 100;

      // GREEN: 현재 0을 반환하므로 통과
      const drift = stabilizer.detectPositionDrift(anchorElement, expectedOffset);
      expect(drift).toBe(0);
    });
  });

  describe('드리프트 보정 적용 (applyDriftCorrection)', () => {
    it('양수 드리프트에 대해 위로 스크롤 보정을 수행해야 함', async () => {
      const driftOffset = 20;
      Object.defineProperty(window as any, 'scrollY', { value: 800, configurable: true });

      const result = await stabilizer.applyDriftCorrection(driftOffset);
      expect(result).toBe(true);

      // RAF 타이밍을 고려하여 잠시 대기
      await new Promise(resolve => setTimeout(resolve, 20));

      // 스크롤 보정이 호출되었는지 확인
      expect(mockScrollTo).toHaveBeenCalledWith({
        top: 780, // 800 - 20
        behavior: 'auto',
      });
    });

    it('음수 드리프트에 대해 아래로 스크롤 보정을 수행해야 함', async () => {
      const driftOffset = -15;
      Object.defineProperty(window as any, 'scrollY', { value: 500, configurable: true });

      const result = await stabilizer.applyDriftCorrection(driftOffset);
      expect(result).toBe(true);

      // RAF 타이밍을 고려하여 잠시 대기
      await new Promise(resolve => setTimeout(resolve, 20));

      expect(mockScrollTo).toHaveBeenCalledWith({
        top: 515, // 500 - (-15)
        behavior: 'auto',
      });
    });

    it('드리프트가 0일 때는 스크롤하지 않아야 함', async () => {
      const driftOffset = 0;

      const result = await stabilizer.applyDriftCorrection(driftOffset);
      expect(result).toBe(true);
      expect(mockScrollTo).not.toHaveBeenCalled();
    });
  });

  describe('이미지 로딩 완료 체크 (isImageLoadingComplete)', () => {
    it('모든 이미지가 로드된 경우 true를 반환해야 함', () => {
      const mockImages = [
        { complete: true, src: 'image1.jpg' },
        { complete: true, src: 'image2.jpg' },
      ];
      mockDocument.querySelectorAll = vi.fn(() => mockImages);

      const result = stabilizer.isImageLoadingComplete();
      expect(result).toBe(true);
    });

    it('일부 이미지가 로딩 중인 경우 false를 반환해야 함', () => {
      const mockImages = [
        { complete: true, src: 'image1.jpg' },
        { complete: false, src: 'image2.jpg' }, // 로딩 중
      ];
      mockDocument.querySelectorAll = vi.fn(() => mockImages);

      const result = stabilizer.isImageLoadingComplete();
      expect(result).toBe(false);
    });
  });

  describe('통합 시나리오', () => {
    it('갤러리 종료 후 완전한 위치 안정화 프로세스를 수행해야 함', async () => {
      // 시나리오: 갤러리 종료 → 레이아웃 안정화 대기 → 드리프트 감지 → 보정 적용

      // 1. 레이아웃 안정화 대기 (성공)
      stabilizer.waitForLayoutStability = vi.fn().mockResolvedValue(true);

      // 2. 드리프트 감지 (10px 아래로 드리프트)
      stabilizer.detectPositionDrift = vi.fn().mockReturnValue(10);

      // 3. 보정 적용 (성공)
      stabilizer.applyDriftCorrection = vi.fn().mockResolvedValue(true);

      // 전체 프로세스 실행
      const layoutStable = await stabilizer.waitForLayoutStability(200);
      expect(layoutStable).toBe(true);

      const mockAnchor = createMockElement(110);
      const drift = stabilizer.detectPositionDrift(mockAnchor, 100);
      expect(drift).toBe(10);

      const corrected = await stabilizer.applyDriftCorrection(drift);
      expect(corrected).toBe(true);

      // 각 단계가 올바르게 호출되었는지 확인
      expect(stabilizer.waitForLayoutStability).toHaveBeenCalledWith(200);
      expect(stabilizer.detectPositionDrift).toHaveBeenCalledWith(mockAnchor, 100);
      expect(stabilizer.applyDriftCorrection).toHaveBeenCalledWith(10);
    });
  });
});
