/**
 * @fileoverview Media Processing Types
 * @description MediaDescriptor와 관련 타입 정의
 */

// MediaType은 constants.ts에서 재export (SSOT)
import type { MediaType } from '@/constants';
export type { MediaType };

/**
 * Result 패턴 - 성공/실패를 타입으로 표현
 */
export type Result<T, E = Error> = { success: true; data: T } | { success: false; error: E };

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
