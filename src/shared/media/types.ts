/**
 * @fileoverview Media Processing Types
 * @description MediaDescriptor와 관련 타입 정의
 */

// MediaType은 constants.ts에서 재export (SSOT)
import type { MediaType } from '@/constants';
export type { MediaType };

/**
 * Result 패턴 - Enhanced Result 사용
 * @deprecated Simple Result<T, E> 패턴은 Phase 355.4에서 제거됨
 * @see {@link @shared/types/result.types} - Enhanced Result 정의
 */
export type { Result } from '@shared/types/result.types';

/**
 * 미디어 품질 변형
 */
export interface MediaVariant {
  readonly quality: 'orig' | 'large' | 'small';
  readonly url: string;
  readonly width?: number;
  readonly height?: number;
}

/**
 * 정규화된 미디어 설명자
 */
export interface MediaDescriptor {
  readonly id: string;
  readonly type: MediaType;
  readonly url: string;
  readonly width?: number;
  readonly height?: number;
  readonly variants?: ReadonlyArray<MediaVariant>;
  readonly alt?: string;
}

/**
 * 파싱 전 원시 미디어 후보
 */
export interface RawMediaCandidate {
  readonly element: Element;
  readonly url: string;
  readonly type: string;
  readonly attributes: Record<string, string>;
}
