/**
 * @fileoverview Browser 모듈 통합 인덱스
 * Phase 1.3 GREEN: 명확히 분리된 browser 유틸리티 모듈들의 단일 진입점
 *
 * 구조:
 * - browser-css-utils.ts: CSS 스타일 주입/제거 기능
 * - browser-environment.ts: 환경 체크 및 안전한 글로벌 접근
 * - browser-service.ts: 고수준 통합 서비스
 */

// === CSS 관련 기능 ===
export { BrowserCSSUtils, BrowserUtils } from './browser-css-utils';

// === 환경 체크 기능 ===
export {
  isBrowserEnvironment,
  safeWindow,
  isExtensionEnvironment,
  saveScrollPosition,
  restoreScrollPosition,
  clearScrollPosition,
  getPageInfo,
} from './browser-environment';

// === 통합 서비스 ===
export { BrowserService } from './browser-service';

// === 기존 호환성 레이어 ===
// 기존 browserUtils, browserAPI exports는 deprecated이지만 호환성을 위해 유지
import { BrowserService } from './browser-service';
import {
  isBrowserEnvironment,
  safeWindow,
  isExtensionEnvironment,
  saveScrollPosition,
  restoreScrollPosition,
  clearScrollPosition,
  getPageInfo,
} from './browser-environment';

// @deprecated - BrowserService를 직접 사용하세요
export const browserAPI = BrowserService;

// @deprecated - browser-environment.ts 함수들을 직접 사용하세요
export const browserUtils = {
  isBrowserEnvironment,
  safeWindow,
  isExtensionEnvironment,
  saveScrollPosition,
  restoreScrollPosition,
  clearScrollPosition,
  getPageInfo,
};
