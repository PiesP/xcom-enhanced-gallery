/**
 * @fileoverview Gallery App Initialization
 * @description Phase 2.1: 갤러리 앱 생성 및 초기화
 * 지연 로딩 및 생명주기 관리
 */

import { logger, tracePoint } from '../shared/logging';
import { registerGalleryRenderer } from '../shared/container/service-accessors';
import type { IGalleryApp } from '../shared/container/app-container';

/** 갤러리 앱 인스턴스 (모듈 레벨 관리) */
let galleryAppInstance: IGalleryApp | null = null;

/**
 * 갤러리 앱 인스턴스 접근자
 */
export function getGalleryApp(): IGalleryApp | null {
  return galleryAppInstance;
}

/**
 * 갤러리 앱 생성 및 초기화 (지연 로딩)
 *
 * 책임:
 * - GalleryRenderer 서비스 등록
 * - GalleryApp 인스턴스 생성
 * - 갤러리 초기화 수행
 * - 개발 환경 전역 접근 제공
 *
 * @returns 초기화된 갤러리 앱 인스턴스
 * @throws {Error} 갤러리 초기화 실패 시
 */
export async function initializeGalleryApp(): Promise<IGalleryApp> {
  if (galleryAppInstance) {
    logger.debug('갤러리 앱이 이미 초기화됨');
    return galleryAppInstance;
  }

  try {
    logger.info('🎨 갤러리 앱 지연 초기화 시작');
    if (__DEV__ && tracePoint) tracePoint('gallery:init:start');

    // Gallery Renderer 서비스 등록 (갤러리 앱에만 필요)
    const { GalleryRenderer } = await import('../features/gallery/GalleryRenderer');
    registerGalleryRenderer(new GalleryRenderer());

    // 갤러리 앱 인스턴스 생성
    const { GalleryApp } = await import('../features/gallery/GalleryApp');
    galleryAppInstance = new GalleryApp();

    // 갤러리 앱 초기화
    if (!galleryAppInstance) {
      throw new Error('GalleryApp 생성 실패');
    }
    await galleryAppInstance.initialize();
    logger.info('✅ 갤러리 앱 초기화 완료');
    if (__DEV__ && tracePoint) tracePoint('gallery:init:done');

    // 개발 환경에서만 디버깅용 전역 접근 허용
    if (import.meta.env.DEV) {
      const __devKey = (codes: number[]) => String.fromCharCode(...codes);
      const kApp = __devKey([
        95, 95, 88, 69, 71, 95, 71, 65, 76, 76, 69, 82, 89, 95, 65, 80, 80, 95, 95,
      ]); // "__XEG_GALLERY_APP__"
      (globalThis as Record<string, unknown>)[kApp] = galleryAppInstance;
    }

    return galleryAppInstance as IGalleryApp;
  } catch (error) {
    logger.error('❌ 갤러리 앱 초기화 실패:', error);
    if (__DEV__ && tracePoint) tracePoint('gallery:init:error', { error: String(error) });
    throw error;
  }
}

/**
 * 갤러리 앱 정리
 *
 * @note cleanup() 함수에서 호출됨
 */
export function clearGalleryApp(): void {
  galleryAppInstance = null;
}
