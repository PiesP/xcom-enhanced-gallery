/**
 * @fileoverview Memo 유틸리티 함수
 * @description 외부 라이브러리 getter를 통해 memo 기능 제공
 */

import { getPreactCompat } from '../../external/vendors';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function memo(component: any): any {
  const preactCompat = getPreactCompat();
  return preactCompat.memo ? preactCompat.memo(component) : component;
}
