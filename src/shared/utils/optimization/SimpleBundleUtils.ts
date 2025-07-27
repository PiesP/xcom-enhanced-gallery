/**
 * @fileoverview 단순화된 번들 최적화 유틸리티
 * @description Phase C: 복잡한 BundleOptimizer를 실용적인 유틸리티로 단순화
 * @version 1.0.0
 */

/**
 * 번들 분석 기본 정보
 */
interface SimpleBundleInfo {
  /** 전체 번들 크기 (bytes) */
  totalSize: number;
  /** 압축된 번들 크기 (bytes) */
  gzippedSize: number;
  /** 주요 모듈들 */
  modules: string[];
}

/**
 * 기본 번들 정보 생성
 *
 * @param modules - 포함된 모듈 목록
 * @param estimatedSize - 예상 크기 (bytes)
 * @returns 번들 정보
 */
export function createSimpleBundleInfo(modules: string[], estimatedSize: number): SimpleBundleInfo {
  return {
    totalSize: estimatedSize,
    gzippedSize: Math.floor(estimatedSize * 0.35), // 일반적인 gzip 압축률
    modules,
  };
}

/**
 * 번들 크기가 목표 범위 내인지 확인
 *
 * @param bundleInfo - 번들 정보
 * @param targetSizeKB - 목표 크기 (KB)
 * @param toleranceKB - 허용 범위 (KB)
 * @returns 범위 내 여부
 */
export function isWithinSizeTarget(
  bundleInfo: SimpleBundleInfo,
  targetSizeKB: number,
  toleranceKB = 10
): boolean {
  const sizeKB = bundleInfo.totalSize / 1024;
  return sizeKB <= targetSizeKB + toleranceKB;
}

/**
 * Tree-shaking 후보 식별
 * 간단한 휴리스틱으로 사용되지 않을 가능성이 높은 모듈 식별
 *
 * @param modules - 모듈 목록
 * @returns 제거 후보 모듈들
 */
export function identifyUnusedModules(modules: string[]): string[] {
  const potentiallyUnused = [
    'BundleOptimizer', // 복잡하지만 실제 미사용
    'AdvancedMemoization', // 과도한 최적화
    'ComplexTreeShaking', // 불필요한 복잡성
  ];

  return modules.filter(module => potentiallyUnused.some(unused => module.includes(unused)));
}

/**
 * 번들 최적화 제안 생성
 *
 * @param bundleInfo - 번들 정보
 * @param targetSizeKB - 목표 크기 (KB)
 * @returns 최적화 제안
 */
export function generateOptimizationSuggestions(
  bundleInfo: SimpleBundleInfo,
  targetSizeKB: number
): string[] {
  const suggestions: string[] = [];
  const currentSizeKB = bundleInfo.totalSize / 1024;

  if (currentSizeKB > targetSizeKB) {
    const overageKB = currentSizeKB - targetSizeKB;
    suggestions.push(`번들 크기가 목표보다 ${overageKB.toFixed(1)}KB 큽니다.`);
  }

  const unusedModules = identifyUnusedModules(bundleInfo.modules);
  if (unusedModules.length > 0) {
    suggestions.push(`사용되지 않는 모듈 ${unusedModules.length}개를 제거할 수 있습니다.`);
  }

  if (bundleInfo.modules.length > 50) {
    suggestions.push('모듈 수가 많습니다. 코드 분할을 고려해보세요.');
  }

  return suggestions;
}

/**
 * 개발용 번들 분석 리포트 생성
 *
 * @param bundleInfo - 번들 정보
 * @param targetSizeKB - 목표 크기
 * @returns 분석 리포트
 */
export function generateDevReport(bundleInfo: SimpleBundleInfo, targetSizeKB: number): string {
  const currentSizeKB = (bundleInfo.totalSize / 1024).toFixed(2);
  const gzippedSizeKB = (bundleInfo.gzippedSize / 1024).toFixed(2);
  const isWithinTarget = isWithinSizeTarget(bundleInfo, targetSizeKB);

  const suggestions = generateOptimizationSuggestions(bundleInfo, targetSizeKB);

  return `
📦 번들 분석 리포트
==================
📊 크기: ${currentSizeKB}KB (압축: ${gzippedSizeKB}KB)
🎯 목표: ${targetSizeKB}KB
✅ 상태: ${isWithinTarget ? '목표 달성' : '목표 초과'}
📁 모듈 수: ${bundleInfo.modules.length}개

💡 최적화 제안:
${suggestions.map(s => `• ${s}`).join('\n')}
  `.trim();
}

// 레거시 호환성을 위한 기본 export (필요시 점진적 제거)
export type { SimpleBundleInfo as BundleAnalysis };
