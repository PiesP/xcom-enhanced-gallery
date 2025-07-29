/**
 * @fileoverview 번들 최적화 유틸리티
 * @description 번들 분석 및 최적화 관련 유틸리티 함수들
 * @version 1.0.0
 */

/**
 * 번들 분석 정보
 */
export interface BundleInfo {
  /** 전체 번들 크기 (bytes) */
  totalSize: number;
  /** 압축된 번들 크기 (bytes) */
  gzippedSize: number;
  /** 포함된 모듈들 */
  modules: string[];
}

/**
 * 번들 정보 생성
 *
 * @param modules - 포함된 모듈 목록
 * @param estimatedSize - 예상 크기 (bytes)
 * @returns 번들 정보
 */
export function createBundleInfo(modules: string[], estimatedSize: number): BundleInfo {
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
  bundleInfo: BundleInfo,
  targetSizeKB: number,
  toleranceKB = 10
): boolean {
  const sizeKB = bundleInfo.totalSize / 1024;
  return sizeKB <= targetSizeKB + toleranceKB;
}

/**
 * 번들 최적화 권장사항 생성
 *
 * @param bundleInfo - 번들 정보
 * @param targetSizeKB - 목표 크기 (KB)
 * @returns 최적화 권장사항
 */
export function getBundleOptimizationSuggestions(
  bundleInfo: BundleInfo,
  targetSizeKB: number
): string[] {
  const suggestions: string[] = [];
  const currentSizeKB = bundleInfo.totalSize / 1024;

  if (currentSizeKB > targetSizeKB) {
    const excessKB = Math.ceil(currentSizeKB - targetSizeKB);
    suggestions.push(`번들 크기를 ${excessKB}KB 줄여야 합니다`);

    if (bundleInfo.modules.length > 20) {
      suggestions.push('코드 스플리팅을 고려해보세요');
    }

    // 압축률 조건 - gzippedSize / totalSize > 0.4인 경우
    const compressionRatio = bundleInfo.gzippedSize / bundleInfo.totalSize;
    if (compressionRatio > 0.4) {
      suggestions.push('중복 코드 제거를 고려해보세요');
    }
  }

  return suggestions;
}

/**
 * 메모이제이션 함수
 *
 * @param fn - 메모이제이션할 함수
 * @param keyGenerator - 키 생성 함수 (선택적)
 * @returns 메모이제이션된 함수
 */
export function memoizeFunction<TArgs extends unknown[], TReturn>(
  fn: (...args: TArgs) => TReturn,
  keyGenerator?: (...args: TArgs) => string
): (...args: TArgs) => TReturn {
  const cache = new Map<string, TReturn>();

  return (...args: TArgs): TReturn => {
    const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args);

    if (cache.has(key)) {
      return cache.get(key)!;
    }

    const result = fn(...args);
    cache.set(key, result);
    return result;
  };
}

/**
 * 간단한 메모 래퍼
 *
 * @param value - 메모할 값
 * @returns 메모된 값
 */
export function memo<T>(value: T): T {
  return value;
}
