/**
 * @fileoverview 최적화 유틸리티
 * @description 유저스크립트에 적합한 최적화 유틸리티
 * @version 2.0.0
 */

import { getPreactCompat } from '@shared/external/vendors';

// 간소화된 번들 유틸리티
export { createBundleInfo, isWithinSizeTarget } from './bundle';

/**
 * Preact memo 컴포넌트 래퍼
 *
 * @description 외부 라이브러리 getter를 통해 memo 기능 제공
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function memo(component: any): any {
  const preactCompat = getPreactCompat();
  return preactCompat.memo ? preactCompat.memo(component) : component;
}
