/**
 * @fileoverview 외부 라이브러리 통합 관리
 * @version 1.0.0 - 단순화된 구조
 *
 * 모든 외부 라이브러리 접근을 통합 관리합니다.
 */

// 기존 vendor 시스템 재export
export * from '../shared/external/vendors';
export * from '../shared/external/zip';

// 편의성을 위한 직접 export
export { getFflate, getPreact, getPreactSignals } from '../shared/external/vendors';
