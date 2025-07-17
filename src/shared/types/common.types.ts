/**
 * @fileoverview Common Base Types
 * @version 1.0.0 - Clean Architecture Implementation
 *
 * 공통으로 사용되는 기본 타입들을 정의합니다.
 * 중복된 타입 정의를 제거하고 일관성을 보장합니다.
 */

// Preact 타입들은 global.types.ts에서 가져옴 (vendors 독립적)
import type { ComponentChildren, ComponentType } from './global.types';

// 기본 위치/크기 타입
export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

// 엔티티 기본 타입
export interface TimestampedEntity {
  timestamp: number;
}

export interface IdentifiableEntity {
  id: string;
}

// 라이프사이클 관리
export interface Lifecycle {
  cleanup(): void;
  destroy(): void;
}

// React/Preact 타입 재export
export type { ComponentChildren, ComponentType };

// 상태 관련 공통 타입
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

// 이벤트 관련 타입
export interface BaseEvent {
  type: string;
  timestamp: number;
}

// 설정 관련 공통 타입
export interface BaseConfig {
  enabled: boolean;
  version?: string;
}
