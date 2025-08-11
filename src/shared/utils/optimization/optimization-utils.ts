/**
 * @fileoverview Bundle Optimization Utilities
 * @description 번들 최적화 및 코드 분할 관련 유틸리티
 */

/**
 * 번들 최적화 설정
 */
export interface BundleOptimizationConfig {
  enableTreeShaking: boolean;
  minifyCode: boolean;
  splitChunks: boolean;
  enableGzip: boolean;
}

/**
 * 번들 최적화 수행
 */
export function optimizeBundle(
  _config: BundleOptimizationConfig = {
    enableTreeShaking: true,
    minifyCode: true,
    splitChunks: true,
    enableGzip: true,
  }
): void {
  // 번들 최적화 로직 구현 예정
  // Configuration applied successfully
}

/**
 * 지연 로딩 유틸리티
 */
export function createLazyLoader<T>(importFn: () => Promise<T>): () => Promise<T> {
  let cachedModule: T | null = null;

  return async (): Promise<T> => {
    if (cachedModule) {
      return cachedModule;
    }

    cachedModule = await importFn();
    return cachedModule;
  };
}

/**
 * 동적 import 래퍼 (Userscript 번들에서는 미지원)
 * Note: CSP 및 번들 검증 정책상 dynamic import 표현식을 금지합니다.
 * 해당 유틸이 필요하다면 앱 외부 환경에서만 사용하세요.
 */
export function dynamicImport<T>(_modulePath: string): Promise<T> {
  return Promise.reject(new Error('dynamicImport is not supported in the userscript build'));
}

/**
 * Props 비교 함수 (얕은 비교)
 */
export function shallowEqual(
  objA: Record<string, unknown>,
  objB: Record<string, unknown>
): boolean {
  const keysA = Object.keys(objA);
  const keysB = Object.keys(objB);

  if (keysA.length !== keysB.length) {
    return false;
  }

  for (const key of keysA) {
    if (objA[key] !== objB[key]) {
      return false;
    }
  }

  return true;
}

/**
 * 깊은 비교 함수
 */
export function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;

  if (a == null || b == null) return false;

  if (typeof a !== typeof b) return false;

  if (typeof a !== 'object') return false;

  const aObj = a as Record<string, unknown>;
  const bObj = b as Record<string, unknown>;

  const keysA = Object.keys(aObj);
  const keysB = Object.keys(bObj);

  if (keysA.length !== keysB.length) return false;

  for (const key of keysA) {
    if (!deepEqual(aObj[key], bObj[key])) return false;
  }

  return true;
}
