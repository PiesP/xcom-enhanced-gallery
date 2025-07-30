/**
 * @fileoverview 간소화된 메모이제이션
 * @description Preact memo의 직접 re-export
 * @version 2.0.0
 */

import { getPreactCompat } from '@shared/external/vendors';

/**
 * Preact memo 컴포넌트 래퍼 (간소화)
 *
 * @description 외부 라이브러리 getter를 통해 memo 기능 제공
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function memo(component: any): any {
  const preactCompat = getPreactCompat();
  return preactCompat.memo ? preactCompat.memo(component) : component;
}
