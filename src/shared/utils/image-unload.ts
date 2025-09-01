/**
 * Phase 7 GREEN: 이미지 언로딩 유틸리티
 *
 * 목표:
 * - 이미지 언로딩으로 메모리 최적화
 * - Blob URL 해제
 * - 간단하고 안전한 언로딩
 */

import { logger } from '@shared/logging/logger';

export interface ImageState {
  src: string;
  alt: string;
  crossOrigin: string | null;
}

/**
 * 이미지 상태 저장
 */
export function saveImageState(img: HTMLImageElement): ImageState {
  return {
    src: img.src,
    alt: img.alt,
    crossOrigin: img.crossOrigin,
  };
}

/**
 * 이미지 언로딩
 */
export function unloadImage(img: HTMLImageElement): boolean {
  try {
    const originalSrc = img.src;
    logger.debug('이미지 언로딩 시작:', originalSrc);

    // src 제거
    img.src = '';

    // blob URL이면 해제
    if (originalSrc.startsWith('blob:')) {
      URL.revokeObjectURL(originalSrc);
      logger.debug('Blob URL 해제:', originalSrc);
    }

    logger.debug('이미지 언로딩 완료');
    return true;
  } catch (error) {
    logger.error('이미지 언로딩 실패:', error);
    return false;
  }
}

/**
 * 이미지 재로딩
 */
export async function reloadImage(img: HTMLImageElement, state: ImageState): Promise<void> {
  try {
    logger.debug('이미지 재로딩 시작:', state.src);

    // 상태 복원
    img.alt = state.alt;
    img.crossOrigin = state.crossOrigin;

    // 로드 완료 대기
    await waitForImageLoad(img, state.src);

    logger.debug('이미지 재로딩 완료');
  } catch (error) {
    logger.error('이미지 재로딩 실패:', error);
    throw error;
  }
}

/**
 * 이미지 로드 완료 대기
 */
function waitForImageLoad(img: HTMLImageElement, src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error('이미지 로딩 타임아웃'));
    }, 10000); // 10초 타임아웃

    const handleLoad = () => {
      cleanup();
      resolve();
    };

    const handleError = () => {
      cleanup();
      reject(new Error('이미지 로딩 에러'));
    };

    const cleanup = () => {
      clearTimeout(timeout);
      img.removeEventListener('load', handleLoad);
      img.removeEventListener('error', handleError);
    };

    img.addEventListener('load', handleLoad);
    img.addEventListener('error', handleError);
    img.src = src;
  });
}

/**
 * 이미지 언로딩 관리자
 */
export class ImageUnloadManager {
  private readonly unloadedImages = new Map<HTMLImageElement, ImageState>();

  unload(img: HTMLImageElement): boolean {
    const state = saveImageState(img);
    this.unloadedImages.set(img, state);

    return unloadImage(img);
  }

  async reload(img: HTMLImageElement): Promise<void> {
    const state = this.unloadedImages.get(img);
    if (!state) {
      throw new Error('재로딩할 이미지 상태를 찾을 수 없음');
    }

    await reloadImage(img, state);
    this.unloadedImages.delete(img);
  }

  isUnloaded(img: HTMLImageElement): boolean {
    return this.unloadedImages.has(img);
  }

  getStats(): { unloadedCount: number } {
    return { unloadedCount: this.unloadedImages.size };
  }

  clear(): void {
    this.unloadedImages.clear();
    logger.debug('모든 이미지 언로딩 상태 초기화');
  }
}

/**
 * 이미지 메모리 사용량 추정
 */
export function estimateImageMemoryUsage(img: HTMLImageElement): number {
  const width = img.naturalWidth || img.width || 1920;
  const height = img.naturalHeight || img.height || 1080;
  // RGBA 포맷 기준: width * height * 4 bytes
  return width * height * 4;
}

/**
 * 안전한 이미지 언로더
 */
export function createSafeImageUnloader() {
  return {
    unload: (img: HTMLImageElement): boolean => {
      try {
        return unloadImage(img);
      } catch (error) {
        logger.error('이미지 언로딩 실패:', error);
        return false;
      }
    },
  };
}
