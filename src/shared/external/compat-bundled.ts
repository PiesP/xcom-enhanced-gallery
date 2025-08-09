/**
 * Bundled Preact Compat facade
 *
 * 이 모듈은 CSP 환경에서 외부 로딩 없이 번들에 내장된 preact/compat API를 제공한다.
 * vendor-api.ts의 ensureCompat()가 이 파일을 동적 import 하므로, 항상 번들에 포함되어야 한다.
 */

import { memo, forwardRef } from 'preact/compat';
import type { PreactCompatAPI } from './vendors/vendor-service';

// 단순한 래퍼 객체로 내보내 안정적인 참조를 보장 (정적 번들 포함 보장)
export const preactCompat: PreactCompatAPI = {
  memo,
  forwardRef,
};

export type BundledPreactCompat = typeof preactCompat;
