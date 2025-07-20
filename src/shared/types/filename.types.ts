/**
 * @fileoverview 미디어 파일명 관련 타입 정의
 * @version 1.0.0
 */

// Infrastructure 레이어에서 실제 구현에 사용되는 타입들을 re-export
export type { FilenameOptions, ZipFilenameOptions } from '@core/media/FilenameService';

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
