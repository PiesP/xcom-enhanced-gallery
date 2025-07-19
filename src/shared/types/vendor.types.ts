/**
 * @fileoverview Vendor Library Types
 * @version 1.0.0
 *
 * 외부 라이브러리에 대한 타입 정의
 */

import type {
  FflateAPI,
  PreactAPI,
  PreactHooksAPI,
  PreactSignalsAPI,
  MotionAPI,
} from '@core/external/vendors';

// Window 객체 확장을 위한 전역 타입 정의
declare global {
  interface Window {
    fflate?: FflateAPI;
    preact?: PreactAPI;
    preactHooks?: PreactHooksAPI;
    preactSignals?: PreactSignalsAPI;
    motion?: MotionAPI;
  }
}

export {};
