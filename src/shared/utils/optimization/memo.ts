/**
 * @fileoverview Memo 유틸리티 함수
 * @description 외부 라이브러리 getter를 통해 memo 기능 제공
 */

import { getPreactCompat } from '@shared/external/vendors';

/**
 * 컴포넌트를 메모화하여 성능을 최적화합니다.
 * @param component - 메모화할 컴포넌트
 * @returns 메모화된 컴포넌트
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function memo(component: any): any {
  // 입력 검증
  if (!component || typeof component !== 'function') {
    throw new Error('memo: 첫 번째 인자는 유효한 컴포넌트 함수여야 합니다');
  }

  const preactCompat = getPreactCompat();

  // preactCompat.memo가 있으면 사용, 없으면 원본 컴포넌트 반환
  if (preactCompat?.memo && typeof preactCompat.memo === 'function') {
    return preactCompat.memo(component);
  }

  return component;
}
