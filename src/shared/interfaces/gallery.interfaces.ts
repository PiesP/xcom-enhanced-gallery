/**
 * @fileoverview Gallery Core Interfaces
 * @version 2.0.0 - Phase 200: 타입 계층 통합
 *
 * Features 계층의 GalleryRenderer 계약을 정의
 * 의존성 규칙: features → shared → core → infrastructure
 *
 * 마이그레이션 노트:
 * - GalleryRenderOptions는 @shared/types/media.types.ts로 통합됨
 * - 일관성을 위해 이 파일에서도 re-export
 */

import type { MediaInfo, GalleryRenderOptions } from '@shared/types/media.types';

/**
 * 갤러리 렌더러 인터페이스
 * Features 계층의 GalleryRenderer를 추상화하는 계약
 */
export interface GalleryRenderer {
  /**
   * 갤러리를 렌더링합니다
   * @param mediaItems - 미디어 아이템 목록
   * @param options - 렌더링 옵션
   */
  render(mediaItems: readonly MediaInfo[], options?: GalleryRenderOptions): Promise<void>;

  /**
   * 갤러리를 닫습니다
   */
  close(): void;

  /**
   * 갤러리를 완전히 제거합니다
   */
  destroy(): void;

  /**
   * 갤러리가 현재 렌더링 중인지 확인합니다
   */
  isRendering(): boolean;

  /**
   * 갤러리 닫기 콜백을 설정합니다
   * @param onClose - 갤러리 닫기 시 호출될 콜백 함수
   */
  setOnCloseCallback(onClose: () => void): void;
}

// 하위 호환성을 위한 re-export (types/media.types.ts가 기준)
export type { GalleryRenderOptions };
