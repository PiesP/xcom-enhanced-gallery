/**
 * Progressive Feature Loader (Phase 3)
 * - registerFeature: 특징(기능) 로더 등록 (지연 실행)
 * - loadFeature: 최초 1회 로드 & Promise 캐시
 * - getFeatureIfLoaded: 이미 로드된 결과 동기 조회
 *
 * 추후 확장 (미구현 / 후속 Phase 예정):
 *  - idle 스케줄링(requestIdleCallback 폴백)
 *  - dynamic import 코드 분할 측정/사이즈 가드
 */

export interface FeatureLoader<T> {
  readonly key: string;
  readonly loader: () => Promise<T> | T;
}

interface RegisteredFeature<T = unknown> {
  loader: () => Promise<T> | T;
  promise?: Promise<T>;
  value?: T;
  error?: unknown;
}

const registry: Map<string, RegisteredFeature<unknown>> = new Map();

/**
 * 기능 로더 등록 (이미 존재 시 덮어쓰지 않고 무시)
 */
export function registerFeature<T>(key: string, loader: () => Promise<T> | T): void {
  if (!key) throw new Error('registerFeature: key is required');
  if (registry.has(key)) return; // 중복 등록 방지
  registry.set(key, { loader });
}

/**
 * 기능 로드 (최초 1회 실행, Promise & 결과 캐시)
 */
export async function loadFeature<T>(key: string): Promise<T> {
  const entry = registry.get(key) as RegisteredFeature<T> | undefined;
  if (!entry) throw new Error(`loadFeature: feature not registered: ${key}`);

  if (entry.value !== undefined) return entry.value; // 이미 로드 완료
  if (entry.promise) return entry.promise; // 진행 중

  const exec = async (): Promise<T> => {
    try {
      const result = await entry.loader();
      entry.value = result;
      return result;
    } catch (err) {
      entry.error = err;
      // 실패 시 다음 호출에서 다시 시도 가능하도록 promise/value 초기화 (i18n literal 회피)
      delete entry.promise;
      throw err;
    }
  };
  entry.promise = exec();
  return entry.promise;
}

/**
 * 이미 로드된 기능 결과를 동기적으로 반환 (미로드 시 undefined)
 */
export function getFeatureIfLoaded<T>(key: string): T | undefined {
  const entry = registry.get(key) as RegisteredFeature<T> | undefined;
  return entry?.value;
}

/**
 * 테스트/디버깅용: 레지스트리 초기화 (프로덕션 사용 금지)
 */
export function __resetFeatureRegistry(): void {
  registry.clear();
}

export type { RegisteredFeature };
