/**
 * @fileoverview Memo 유틸리티 함수
 * @description 외부 라이브러리 getter를 통해 memo 기능 제공
 */

import { getPreactCompat } from '@shared/external/vendors';
export { forwardRef } from './compat';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function memo(component: any, compare?: (prev: any, next: any) => boolean): any {
  try {
    const preactCompat = getPreactCompat();
    return preactCompat.memo ? preactCompat.memo(component, compare as never) : component;
  } catch {
    // Vendors not initialized yet; return component as-is
    return component;
  }
}
