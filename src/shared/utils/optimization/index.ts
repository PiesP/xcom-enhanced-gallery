/**
 * @fileoverview 최적화 유틸리티
 * @description 유저스크립트에 적합한 최적화 유틸리티
 * @version 2.0.0
 */

// 간소화된 번들 유틸리티
export { createBundleInfo, isWithinSizeTarget } from './bundle';

// Memo 유틸리티
export { memo } from './memo';

// Bundle 최적화 유틸리티
export * from './optimization-utils';
