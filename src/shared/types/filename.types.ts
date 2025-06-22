/**
 * @fileoverview 미디어 파일명 관련 타입 정의
 * @version 1.0.0
 */

/**
 * 파일명 생성 옵션
 */
export interface FilenameOptions {
  /** 사용자명을 파일명에 포함할지 여부 */
  includeUsername?: boolean;
  /** 인덱스를 파일명에 포함할지 여부 */
  includeIndex?: boolean;
  /** 커스텀 파일명 포맷 */
  customFormat?: string;
  /** 최대 파일명 길이 (기본값: 255) */
  maxLength?: number;
  /** 파일 인덱스 (1부터 시작) */
  index?: number;
  /** 트윗 ID */
  tweetId?: string;
  /** 타임스탬프 포함 여부 */
  includeTimestamp?: boolean;
}

/**
 * ZIP 파일명 생성 옵션
 */
export interface ZipFilenameOptions {
  /** 트위터 사용자명 */
  username?: string;
  /** 트윗 ID */
  tweetId?: string;
  /** 타임스탬프 포함 여부 */
  timestamp?: boolean;
  /** 커스텀 접두사 */
  prefix?: string;
  /** 미디어 개수 */
  mediaCount?: number;
}

/**
 * 파일명 검증 결과
 */
export interface FilenameValidationResult {
  /** 유효성 여부 */
  isValid: boolean;
  /** 무효 이유 (유효하지 않은 경우) */
  reason?: string;
  /** 제안하는 대안 파일명 */
  suggestion?: string;
}

/**
 * 지원되는 미디어 파일 확장자
 */
export type MediaFileExtension = 'jpg' | 'jpeg' | 'png' | 'gif' | 'webp' | 'mp4' | 'mov';

/**
 * 파일명 생성 전략
 */
export type FilenameStrategy = 'simple' | 'detailed' | 'timestamp' | 'custom';
