/**
 * @fileoverview Gallery Core Interfaces
 * @version 1.0.0
 *
 * Features 간 의존성을 제거하기 위한 공통 인터페이스 정의
 * 의존성 규칙: features → shared → core → infrastructure
 */

import type { MediaInfo } from '@core/types/media.types';
import type { ViewMode } from '@core/types/core-types';

// 미디어 추출 옵션 타입
export interface MediaExtractionOptions {
  includeVideos?: boolean;
  useApiFallback?: boolean;
  enableValidation?: boolean;
  timeoutMs?: number;
}

// TweetInfo 타입을 위한 인터페이스 (순환 참조 방지)
interface TweetInfo {
  username?: string;
  tweetId?: string;
  tweetUrl?: string;
}

/**
 * 갤러리 렌더러 인터페이스
 * Features 계층의 GalleryRenderer를 추상화
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

/**
 * 미디어 추출기 인터페이스
 * Features 계층의 MediaExtractor를 추상화
 */
export interface MediaExtractor {
  /**
   * 클릭된 요소에서 미디어를 추출합니다
   * @param element - 클릭된 DOM 요소
   * @param options - 추출 옵션
   * @returns 추출된 미디어 정보
   */
  extractFromClickedElement(
    element: HTMLElement,
    options?: MediaExtractionOptions
  ): Promise<MediaExtractionResult>;

  /**
   * 컨테이너에서 모든 미디어를 추출합니다
   * @param container - 미디어를 검색할 컨테이너
   * @param options - 추출 옵션
   * @returns 추출된 미디어 목록
   */
  extractAllFromContainer(
    container: HTMLElement,
    options?: MediaExtractionOptions
  ): Promise<MediaExtractionResult>;
}

/**
 * 갤러리 렌더링 옵션
 */
export interface GalleryRenderOptions {
  /** 시작 인덱스 */
  startIndex?: number | undefined;
  /** 뷰 모드 */
  viewMode?: ViewMode | undefined;
  /** 클래스명 */
  className?: string | undefined;
  /** 트윗 ID */
  tweetId?: string | undefined;
}

/**
 * 미디어 추출 결과
 */
export interface MediaExtractionResult {
  /** 추출 성공 여부 */
  success: boolean;
  /** 추출된 미디어 목록 */
  mediaItems: readonly MediaInfo[];
  /** 클릭된 미디어의 인덱스 (0부터 시작) */
  clickedIndex?: number | undefined;
  /** 소스 타입 (간소화) */
  sourceType?: string | undefined;
  /** 에러 메시지 (실패시) */
  error?: string | undefined;
  /** 추출 메타데이터 */
  metadata?: MediaExtractionMetadata | undefined;
  /** 트윗 정보 (추출 가능한 경우) */
  tweetInfo?: TweetInfo | null | undefined;
}

/**
 * 미디어 추출 메타데이터
 */
export interface MediaExtractionMetadata {
  /** 트윗 ID */
  tweetId?: string;
  /** 사용자 ID */
  userId?: string;
  /** 추출 시간 */
  extractedAt?: number;
  /** 소스 타입 */
  sourceType?:
    | 'tweet'
    | 'profile'
    | 'media'
    | 'unknown'
    | 'cached'
    | 'image-elements'
    | 'video-elements'
    | 'data-attributes'
    | 'background-images'
    | 'twitter-api'
    | 'simple-extraction'
    | 'error'
    | 'api-first'
    | 'dom-fallback';
  /** 추출 전략 */
  strategy?: string;
  /** 사용된 전략 (메타데이터용) */
  usedStrategy?: string;
  /** 총 처리 시간 (밀리초) */
  totalProcessingTime?: number;
  /** 전략별 결과 */
  strategyResults?: Array<{
    strategy: string;
    success: boolean;
    itemCount: number;
    processingTime?: number;
  }>;
  /** 페이지 컨텍스트 (미디어 페이지용) */
  pageContext?: unknown;
  /** 에러 메시지 */
  error?: string;
  /** 원본 인덱스 (정렬용) */
  originalIndex?: number;
  /** 추출 방법 */
  extractionMethod?: string;
  /** 검증 점수 (0-1) */
  validationScore?: number;
  /** 검증 문제들 */
  validationIssues?: import('@core/types/media.types').ValidationIssue[];
  /** 검증 제안사항 */
  validationSuggestions?: string[];
}
