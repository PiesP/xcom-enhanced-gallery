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
 * 갤러리 앱 인터페이스
 */
export interface IGalleryApp extends BaseComponentProps {
  /** 갤러리 열기 */
  openGallery(mediaItems: unknown[]): Promise<void>;
  /** 갤러리 닫기 */
  closeGallery(): void;
  /** 설정 업데이트 */
  updateConfig(config: Partial<GalleryAppConfig>): void;
}

/**
 * 미디어 추출 결과
 */
export interface MediaExtractionResult {
  /** 추출된 미디어 아이템 */
  mediaItems: unknown[];
  /** 추출 성공 여부 */
  success: boolean;
  /** 오류 메시지 */
  error?: string;
  /** 추출 시간 (ms) */
  extractionTime: number;
  /** 클릭된 미디어의 인덱스 */
  clickedIndex?: number;
  /** 추출 메타데이터 */
  metadata?: {
    strategy?: string;
    sourceType?: string;
  };
}
