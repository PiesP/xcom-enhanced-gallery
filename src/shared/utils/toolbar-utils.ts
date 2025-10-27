/**
 * @fileoverview Toolbar State Utilities
 * @description 순수 유틸리티 함수들 (훅이 아님)
 *
 * Phase 2: shared/hooks에서 분리된 헬퍼 함수들
 * - Toolbar 상태를 데이터 속성 상태로 변환
 * - Toolbar 클래스명을 생성
 */

import type { ToolbarState, ToolbarDataState } from '@shared/types/toolbar.types';

// Phase 2: Re-export types for backward compatibility
export type { ToolbarDataState } from '@shared/types/toolbar.types';

export function getToolbarDataState(state: ToolbarState): ToolbarDataState {
  if (state.hasError) return 'error';
  if (state.isDownloading) return 'downloading';
  if (state.isLoading) return 'loading';
  return 'idle';
}

/**
 * 툴바 클래스명 생성 유틸리티
 *
 * @description
 * 상태에 따른 툴바 CSS 클래스명을 생성합니다.
 *
 * @param state - 툴바 상태 객체
 * @param baseClassName - 기본 클래스명
 * @param additionalClassNames - 추가 클래스명들
 * @returns 결합된 클래스명 문자열
 */
export function getToolbarClassName(
  state: ToolbarState,
  baseClassName: string,
  ...additionalClassNames: string[]
): string {
  const classNames = [baseClassName];

  if (state.needsHighContrast) {
    classNames.push('highContrast');
  }

  classNames.push(...additionalClassNames.filter(Boolean));

  return classNames.join(' ');
}
