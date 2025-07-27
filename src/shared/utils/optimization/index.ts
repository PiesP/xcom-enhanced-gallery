/**
 * @fileoverview 최적화 유틸리티 export - Phase C 단순화
 * @description Phase C: 복잡한 최적화 모듈을 실용적인 유틸리티로 교체
 * @version 1.0.0
 */

// Phase C: 단순화된 번들 유틸리티
export {
  createSimpleBundleInfo,
  isWithinSizeTarget,
  identifyUnusedModules,
  generateOptimizationSuggestions,
  generateDevReport,
} from './SimpleBundleUtils';

// 레거시 지원 (점진적 제거 예정) - 중복 방지를 위해 명시적 export
export {
  BundleOptimizer,
  registerModule,
  analyzeBundleComposition,
  generateSplittingStrategy,
  getTreeShakingRecommendations,
  loadModuleDynamically,
  getPreloadStrategy,
  generateOptimizationReport,
  getChunkManifest,
  resetBundleOptimizer,
} from './BundleOptimizer';
