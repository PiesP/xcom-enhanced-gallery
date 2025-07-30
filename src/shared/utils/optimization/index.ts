/**
 * @fileoverview 간소화된 최적화 유틸리티 export
 * @description 유저스크립트에 적합한 간소화된 유틸리티
 * @version 2.0.0
 */

// 간소화된 번들 유틸리티
export { createBundleInfo, isWithinSizeTarget } from './bundle';

// 메모이제이션 (컴포넌트 optimization에서 re-export)
export { memo } from '@shared/components/optimization';
