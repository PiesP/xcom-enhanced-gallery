/**
 * 갤러리 앱 기능 타입 정의
 */

import type { BaseComponentProps } from '@shared/types';

/**
 * 갤러리 앱 설정
 */
export interface GalleryAppConfig {
  /** 자동 테마 활성화 */
  autoTheme: boolean;
  /** 성능 모니터링 활성화 */
  performanceMonitoring: boolean;
}

/**
 * 갤러리 앱 인터페이스 - 화살표 함수 메서드 지원
 */
export interface GalleryApp extends BaseComponentProps {
  /** 갤러리 열기 - 화살표 함수 */
  readonly openGallery: (mediaItems: unknown[], startIndex?: number) => Promise<void>;
  /** 갤러리 닫기 - 화살표 함수 */
  readonly closeGallery: () => Promise<void>;
  /** 미디어 클릭 핸들러 - 화살표 함수 */
  readonly onMediaClick: (mediaInfo: unknown, element: HTMLElement, event: Event) => Promise<void>;
  /** 키보드 이벤트 핸들러 - 화살표 함수 */
  readonly onKeyboardEvent: (event: KeyboardEvent) => void;
  /** 설정 업데이트 */
  updateConfig(config: Partial<GalleryAppConfig>): void;
}

// ================================
// 미디어 추출 결과 - Core에서 re-export
// ================================

export type { MediaExtractionResult } from '@shared/types/media.types';

// 하위 호환성을 위한 별칭
export type IGalleryApp = GalleryApp;
