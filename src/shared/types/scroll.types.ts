/**
 * Copyright (c) 2024 X.com Enhanced Gallery - MIT License
 *
 * @fileoverview 단순화된 스크롤 관련 타입 정의
 * @description 스크롤 잠금 기능을 제거한 단순화된 타입들
 * @version 2.0.0 - 스크롤 잠금 기능 제거
 */

/**
 * 스크롤 위치를 나타내는 인터페이스
 */
export interface ScrollPosition {
  x: number;
  y: number;
}

/**
 * 갤러리 스크롤 위치 정보
 */
export interface GalleryScrollPosition {
  index: number;
  scrollTop: number;
  timestamp: number;
}

/**
 * 갤러리 스크롤 옵션 (통합된 버전)
 */
export interface GalleryScrollOptions {
  /** 스크롤 동작 방식 */
  behavior?: ScrollBehavior;
  /** 스크롤 오프셋 (픽셀) */
  offset?: number;
  /** 디바운스 지연 시간 (밀리초) */
  debounceDelay?: number;
  /** 스크롤 블록 위치 */
  block?: ScrollBlock;
  /** 중앙 정렬 여부 */
  alignToCenter?: boolean;
  /** 스크롤 활성화 여부 */
  enabled?: boolean;
  /** motion 선호도 고려 여부 */
  respectReducedMotion?: boolean;
}

/**
 * 갤러리 스크롤 상태
 */
export interface GalleryScrollState {
  focusedImageIndex: number;
  savedScrollPosition: number;
  lastScrollTime: number;
}

/**
 * 스크롤 방향
 */
export type ScrollDirection = 'up' | 'down' | 'left' | 'right';

/**
 * 스크롤 블록 위치 (ScrollLogicalPosition 표준 대응)
 */
export type ScrollBlock = 'start' | 'center' | 'end' | 'nearest';

/**
 * 스크롤 이벤트 핸들러 타입
 */
export type ScrollEventHandler = (event: Event) => void;

/**
 * 스크롤 콜백 함수 타입
 */
export type ScrollCallback = (position: GalleryScrollPosition) => void;
