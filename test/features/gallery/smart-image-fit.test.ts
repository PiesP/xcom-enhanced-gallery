/**
 * Smart Image Fit 시스템 테스트
 * TDD로 구현하는 요구사항 기반 이미지 크기 조절 로직
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { calculateSmartImageFit } from '@shared/utils/media/smart-image-fit';

// 테스트 대상 타입 정의 (실제 구현에서 가져옴)
type SmartImageFitResult = {
  width: number;
  height: number;
  shouldApply: boolean;
  mode: 'original' | 'fitWidth' | 'fitHeight' | 'fitContainer';
};

type ImageDimensions = {
  naturalWidth: number;
  naturalHeight: number;
};

type ViewportDimensions = {
  width: number;
  height: number;
};

// 테스트할 함수 타입 정의
type CalculateSmartImageFit = (
  imageDimensions: ImageDimensions, // eslint-disable-line no-unused-vars
  viewportDimensions: ViewportDimensions, // eslint-disable-line no-unused-vars
  mode: 'original' | 'fitWidth' | 'fitHeight' | 'fitContainer' // eslint-disable-line no-unused-vars
) => SmartImageFitResult;

// Mock 함수를 실제 구현으로 교체
const testCalculateSmartImageFit = calculateSmartImageFit;

describe('Smart Image Fit 시스템', () => {
  let calculateSmartImageFitFunc: CalculateSmartImageFit;

  beforeEach(() => {
    calculateSmartImageFitFunc = testCalculateSmartImageFit;
  });

  describe('원본 크기 모드 (original)', () => {
    it('항상 원본 크기를 반환해야 함', () => {
      const imageDimensions = { naturalWidth: 800, naturalHeight: 600 };
      const viewportDimensions = { width: 1920, height: 1080 };

      const result = calculateSmartImageFitFunc(imageDimensions, viewportDimensions, 'original');

      expect(result).toEqual({
        width: 800,
        height: 600,
        shouldApply: true,
        mode: 'original',
      });
    });

    it('이미지가 뷰포트보다 클 때도 원본 크기를 유지해야 함', () => {
      const imageDimensions = { naturalWidth: 2000, naturalHeight: 1500 };
      const viewportDimensions = { width: 1200, height: 800 };

      const result = calculateSmartImageFitFunc(imageDimensions, viewportDimensions, 'original');

      expect(result).toEqual({
        width: 2000,
        height: 1500,
        shouldApply: true,
        mode: 'original',
      });
    });
  });

  describe('가로에 맞추기 모드 (fitWidth)', () => {
    it('이미지 가로가 뷰포트보다 클 때 가로에 맞춰 비율 조정해야 함', () => {
      const imageDimensions = { naturalWidth: 1600, naturalHeight: 1200 };
      const viewportDimensions = { width: 800, height: 1000 };

      const result = calculateSmartImageFitFunc(imageDimensions, viewportDimensions, 'fitWidth');

      // 가로를 800에 맞추면 비율에 따라 세로는 600이 됨
      expect(result).toEqual({
        width: 800,
        height: 600,
        shouldApply: true,
        mode: 'fitWidth',
      });
    });

    it('이미지 가로가 뷰포트보다 작을 때 원본 크기를 유지해야 함', () => {
      const imageDimensions = { naturalWidth: 600, naturalHeight: 400 };
      const viewportDimensions = { width: 1200, height: 800 };

      const result = calculateSmartImageFitFunc(imageDimensions, viewportDimensions, 'fitWidth');

      expect(result).toEqual({
        width: 600,
        height: 400,
        shouldApply: true,
        mode: 'fitWidth',
      });
    });

    it('원본 크기보다 커지지 않아야 함', () => {
      const imageDimensions = { naturalWidth: 400, naturalHeight: 300 };
      const viewportDimensions = { width: 1200, height: 800 };

      const result = calculateSmartImageFitFunc(imageDimensions, viewportDimensions, 'fitWidth');

      expect(result.width).toBeLessThanOrEqual(400);
      expect(result.height).toBeLessThanOrEqual(300);
    });
  });

  describe('세로에 맞추기 모드 (fitHeight)', () => {
    it('이미지 세로가 뷰포트보다 클 때 세로에 맞춰 비율 조정해야 함', () => {
      const imageDimensions = { naturalWidth: 800, naturalHeight: 1200 };
      const viewportDimensions = { width: 1000, height: 600 };

      const result = calculateSmartImageFitFunc(imageDimensions, viewportDimensions, 'fitHeight');

      // 세로를 600에 맞추면 비율에 따라 가로는 400이 됨
      expect(result).toEqual({
        width: 400,
        height: 600,
        shouldApply: true,
        mode: 'fitHeight',
      });
    });

    it('이미지 세로가 뷰포트보다 작을 때 원본 크기를 유지해야 함', () => {
      const imageDimensions = { naturalWidth: 800, naturalHeight: 400 };
      const viewportDimensions = { width: 1200, height: 800 };

      const result = calculateSmartImageFitFunc(imageDimensions, viewportDimensions, 'fitHeight');

      expect(result).toEqual({
        width: 800,
        height: 400,
        shouldApply: true,
        mode: 'fitHeight',
      });
    });
  });

  describe('창에 맞추기 모드 (fitContainer)', () => {
    it('가로와 세로 모두 뷰포트보다 클 때 더 작게 하는 쪽을 선택해야 함', () => {
      const imageDimensions = { naturalWidth: 1600, naturalHeight: 1200 };
      const viewportDimensions = { width: 800, height: 900 };

      const result = calculateSmartImageFitFunc(
        imageDimensions,
        viewportDimensions,
        'fitContainer'
      );

      // 가로 기준: 800 * (1200/1600) = 600 (세로)
      // 세로 기준: 900 * (1600/1200) = 1200 (가로)
      // 가로 기준이 더 작으므로 가로 기준 적용
      expect(result).toEqual({
        width: 800,
        height: 600,
        shouldApply: true,
        mode: 'fitContainer',
      });
    });

    it('가로만 뷰포트보다 클 때 가로 기준으로 조정해야 함', () => {
      const imageDimensions = { naturalWidth: 1600, naturalHeight: 400 };
      const viewportDimensions = { width: 800, height: 900 };

      const result = calculateSmartImageFitFunc(
        imageDimensions,
        viewportDimensions,
        'fitContainer'
      );

      expect(result).toEqual({
        width: 800,
        height: 200,
        shouldApply: true,
        mode: 'fitContainer',
      });
    });

    it('세로만 뷰포트보다 클 때 세로 기준으로 조정해야 함', () => {
      const imageDimensions = { naturalWidth: 600, naturalHeight: 1200 };
      const viewportDimensions = { width: 800, height: 900 };

      const result = calculateSmartImageFitFunc(
        imageDimensions,
        viewportDimensions,
        'fitContainer'
      );

      expect(result).toEqual({
        width: 450,
        height: 900,
        shouldApply: true,
        mode: 'fitContainer',
      });
    });

    it('가로와 세로 모두 뷰포트보다 작을 때 원본 크기를 유지해야 함', () => {
      const imageDimensions = { naturalWidth: 600, naturalHeight: 400 };
      const viewportDimensions = { width: 800, height: 900 };

      const result = calculateSmartImageFitFunc(
        imageDimensions,
        viewportDimensions,
        'fitContainer'
      );

      expect(result).toEqual({
        width: 600,
        height: 400,
        shouldApply: true,
        mode: 'fitContainer',
      });
    });
  });

  describe('엣지 케이스', () => {
    it('이미지 크기가 0일 때 안전하게 처리해야 함', () => {
      const imageDimensions = { naturalWidth: 0, naturalHeight: 0 };
      const viewportDimensions = { width: 800, height: 600 };

      const result = calculateSmartImageFitFunc(imageDimensions, viewportDimensions, 'fitWidth');

      expect(result.width).toBe(0);
      expect(result.height).toBe(0);
      expect(result.shouldApply).toBe(false);
    });

    it('뷰포트 크기가 0일 때 안전하게 처리해야 함', () => {
      const imageDimensions = { naturalWidth: 800, naturalHeight: 600 };
      const viewportDimensions = { width: 0, height: 0 };

      const result = calculateSmartImageFitFunc(imageDimensions, viewportDimensions, 'fitWidth');

      expect(result.shouldApply).toBe(false);
    });

    it('정사각형 이미지를 올바르게 처리해야 함', () => {
      const imageDimensions = { naturalWidth: 1000, naturalHeight: 1000 };
      const viewportDimensions = { width: 800, height: 600 };

      const result = calculateSmartImageFitFunc(
        imageDimensions,
        viewportDimensions,
        'fitContainer'
      );

      // 세로가 더 제한적이므로 세로 기준으로 조정
      expect(result).toEqual({
        width: 600,
        height: 600,
        shouldApply: true,
        mode: 'fitContainer',
      });
    });
  });
});
