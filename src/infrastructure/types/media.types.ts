/**
 * Copyright (c) 2024 X.com Enhanced Gallery Team
 * Licensed under the MIT License
 * @fileoverview Infrastructure 레이어용 미디어 타입 정의
 *
 * FilenameService에서 필요한 최소한의 미디어 타입만 정의합니다.
 * core 레이어의 전체 타입을 import하지 않고 필요한 부분만 재정의하여
 * 아키텍처 의존성 규칙을 준수합니다.
 */

// Re-export from constants to avoid duplication
import type { MediaType as BaseMediaType } from '../../constants';
export type MediaType = BaseMediaType;

/**
 * FilenameService에서 사용하는 기본 미디어 정보
 *
 * 파일명 생성에 필요한 최소한의 속성들만 포함합니다.
 * core 레이어의 MediaInfo와 호환성을 위해 id 필드를 optional + undefined로 정의
 */
export interface MediaItemForFilename {
  /** 미디어 고유 식별자 */
  id?: string | undefined;
  /** 미디어 URL */
  url: string;
  /** 원본 URL (사용자명 추출용) */
  originalUrl?: string | undefined;
  /** 미디어 타입 */
  type: MediaType;
  /** 기존 파일명 */
  filename?: string | undefined;
  /** 트윗 작성자 사용자명 */
  tweetUsername?: string | undefined;
  /** 트윗 ID */
  tweetId?: string | undefined;
}

/**
 * FilenameService에서 사용하는 미디어 정보 타입
 *
 * MediaItemForFilename과 동일하지만 명시적으로 별도 타입으로 정의하여
 * 향후 확장성을 고려합니다.
 */
export interface MediaInfoForFilename extends MediaItemForFilename {}
