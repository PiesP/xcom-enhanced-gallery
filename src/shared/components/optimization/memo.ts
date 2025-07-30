/**
 * @fileoverview 간소화된 최적화 기능
 * @description 복잡한 메모이제이션 대신 기본 Preact.memo만 제공
 */

import { getPreactCompat } from '@shared/external/vendors';

/**
 * 메모이제이션 래퍼 (간소화)
 * Preact compat memo의 간단한 래퍼
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function memo(component: any): any {
  const preactCompat = getPreactCompat();
  // preact-compat의 memo 사용
  return preactCompat.memo ? preactCompat.memo(component) : component;
}
