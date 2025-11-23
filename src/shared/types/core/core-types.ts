/**
 * @fileoverview Core Types - Integrated domain and infrastructure types
 * @version 3.0.0 - Phase 197.1: Structure clarification
 *
 * **Role**:
 * This file integrates multiple domain and infrastructure types.
 * Since app.types.ts re-exports these types, direct imports are rare.
 *
 * **Composition** (by section):
 * 1. SERVICE TYPES - Service base interface
 * 2. GALLERY TYPES - Gallery domain (state, action, event)
 * 3. CORE FOUNDATION TYPES - App config & lifecycle
 * 4. RESULT TYPES - Explicit success/failure representation
 *
 * **Recommended usage**:
 * - General: `import type { Result, BaseService } from '@shared/types'` (via app.types.ts)
 * - Detail: `import type { GalleryState } from '@shared/types/core/core-types'`
 *
 * **Phase 197 improvements**:
 * - BaseService duplication removed (re-export from base-service.types.ts)
 * - Result pattern integrated
 * - JSDoc enhanced & sections clarified
 *
 * @see {@link ../app.types.ts} - Re-export hub
 * @see {@link ./base-service.types.ts} - BaseService definition
 * @see {@link ../result.types.ts} - Result pattern & ErrorCode
 */

import type { MediaInfo } from "@shared/types/media.types";
import type { Cleanupable } from "@shared/types/lifecycle.types";
import type { BaseService } from "./base-service.types";

// ========================================
// SERVICE TYPES (from services.types.ts)
// ========================================

// Export BaseService from dedicated file (avoid duplication)
export type { BaseService };

/**
 * Service lifecycle state
 */
export type ServiceLifecycle =
  | "uninitialized"
  | "initializing"
  | "initialized"
  | "destroyed";

// All unused service type definitions removed in Phase 326.6
// Services use concrete implementations instead of interface abstractions

// ========================================
// GALLERY TYPES (from gallery.types.ts)
// ========================================

/**
 * Gallery view mode type
 */
export type GalleryViewMode = "grid" | "carousel" | "slideshow";

/**
 * Gallery state interface (immutability guaranteed)
 */
export interface GalleryState {
  readonly isOpen: boolean;
  readonly currentIndex: number;
  readonly items: readonly MediaInfo[];
  readonly viewMode: GalleryViewMode;
  readonly isFullscreen: boolean;
  readonly isLoading: boolean;
  readonly error: string | null;
}

/**
 * Gallery event type
 */
export type GalleryEvents = {
  "gallery:open": { items: MediaInfo[]; startIndex: number };
  "gallery:close": Record<string, never>;
  "gallery:navigate": { index: number; item: MediaInfo };
  "gallery:viewModeChange": { mode: GalleryViewMode };
  "gallery:fullscreenToggle": { isFullscreen: boolean };
  "gallery:error": { error: string };
};

// ========================================
// VIEW MODE TYPES (from view-mode.types.ts)
// ========================================

// Phase 380: Type-only export to break circular dependency
// Import removed, re-export ViewMode type only
export type { ViewMode } from "@/constants";

/**
 * ViewMode helper functions were removed in Phase 421 cleanup.
 * Use VIEW_MODES from '@/constants' for validation when needed.
 */

// ========================================
// CORE FOUNDATION TYPES (from core.types.ts)
// ========================================

/**
 * 기본 갤러리 설정
 */
export interface GalleryConfig {
  /** 자동 재생 여부 */
  autoPlay: boolean;
  /** 썸네일 표시 여부 */
  showThumbnails: boolean;
  /** 다운로드 기능 활성화 여부 */
  downloadEnabled: boolean;
  /** 키보드 네비게이션 활성화 여부 */
  keyboardNavigation?: boolean;
  /** 풀스크린 모드 지원 여부 */
  fullscreenEnabled?: boolean;
  /** 이미지 확대/축소 기능 */
  zoomEnabled?: boolean;
}

/**
 * 다운로드 옵션
 */
export interface DownloadOptions {
  /** 다운로드 품질 */
  quality?: "original" | "high" | "medium";
  /** 파일명 형식 */
  filenameFormat?: string;
  /** 압축 활성화 여부 */
  compressionEnabled?: boolean;
}

/**
 * 크기 정보
 */
export interface Size {
  width: number;
  height: number;
}

/**
 * 통합 생명주기 인터페이스
 */
export interface Lifecycle extends Cleanupable {
  /**
   * 리소스 상태 확인
   */
  isActive(): boolean;
}

// ========================================
// RESULT TYPES (from result.ts)
// ========================================

/**
 * Result 타입 - Enhanced Result 패턴 사용
 * @see {@link ../result.types.ts} - Enhanced Result 정의 및 유틸리티 (AsyncResult 포함)
 *
 * Phase 353: AsyncResult 타입 통합 (result.types.ts로 이동)
 */
export type { Result, AsyncResult } from "@shared/types/result.types";

// Result 유틸리티 함수들은 result.types.ts로 이동됨 (Phase 355.2)
// - success, failure, partial, cancelled
// - isSuccess, isFailure, isPartial
// - unwrapOr, safe, safeAsync, chain, map
// import { success, failure, isSuccess, ... } from '@shared/types/result.types';
