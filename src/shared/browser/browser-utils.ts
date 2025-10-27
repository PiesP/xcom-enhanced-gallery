/**
 * @fileoverview DEPRECATED - Browser Utils (Phase 223에서 browser-service.ts로 통합)
 * @version 2.0.0 → 2.2.0 (Phase 223로 통합)
 * @deprecated Use BrowserService and browserAPI from './browser-service' instead
 *
 * 이 파일은 browser-service.ts로 완전히 통합되었습니다.
 * 코드는 browser-service.ts에 존재하며, 이 파일은 호환성 보증 용도입니다.
 *
 * @example
 * ```typescript
 * // ❌ 이전 (deprecated)
 * import { BrowserUtils } from '@shared/browser/browser-utils';
 * const utils = new BrowserUtils();
 *
 * // ✅ 새로운 방식
 * import { browserAPI } from '@shared/browser';
 * browserAPI.injectCSS('my-id', '.style {}');
 * ```
 */

// Re-export from browser-service for backward compatibility
export { BrowserService } from './browser-service';
export { browserAPI } from './browser-service';
