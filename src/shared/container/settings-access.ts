/**
 * @fileoverview Settings Access - 설정 서비스의 안전한 접근 추상화
 * @description
 * Features 레이어에서 설정 서비스에 안전하게 접근할 수 있도록 합니다.
 * ServiceManager 직접 import를 피하고, 스스로 정리하는 구조 제공.
 *
 * **특징**:
 * - 서비스 미사용 시 안전하게 처리 (null 반환 후 noop)
 * - 순환 의존성 회피 (타입 정의 최소화)
 * - 테스트 환경 호환성
 *
 * **용법**:
 * ```typescript
 * // ✅ 설정 읽기 (기본값 제공)
 * const autoDownload = getSetting('autoDownload', false);
 *
 * // ✅ 설정 쓰기 (실패해도 무시)
 * await setSetting('autoDownload', true);
 *
 * // ✅ 직접 서비스 접근 (필요시)
 * const svc = tryGetSettingsService();
 * if (svc) {
 *   const value = svc.get('key');
 * }
 * ```
 */
import { tryGetSettingsManager } from './service-accessors';

/**
 * 설정 서비스 계약 (최소 인터페이스)
 * @internal
 */
interface SettingsChangeEvent {
  key?: string;
  newValue?: unknown;
  oldValue?: unknown;
}

/**
 * 설정 서비스 계약 (최소 인터페이스)
 * @internal
 */
interface SettingsServiceLike {
  get<T = unknown>(key: string): T;
  set<T = unknown>(key: string, value: T): Promise<void>;
  cleanup?: () => void;
  subscribe?: (listener: (event: SettingsChangeEvent | null) => void) => (() => void) | void;
}

/**
 * 설정 서비스를 안전하게 조회합니다.
 * 서비스가 없으면 null을 반환합니다.
 *
 * @returns SettingsServiceLike 인스턴스 또는 null
 *
 * @example
 * ```typescript
 * const svc = tryGetSettingsService();
 * if (svc) {
 *   console.log(svc.get('autoDownload'));
 * }
 * ```
 *
 * @internal - 일반적으로 getSetting/setSetting 사용 권장
 */
export function tryGetSettingsService(): SettingsServiceLike | null {
  const svc = tryGetSettingsManager<SettingsServiceLike>();
  return svc ?? null;
}

/**
 * 설정값을 읽습니다 (없으면 기본값 반환).
 * 서비스가 없거나 읽기 실패 시 기본값을 반환합니다.
 *
 * @template T 값의 타입
 * @param key 설정 키
 * @param defaultValue 기본값
 * @returns 설정값 또는 기본값
 *
 * @example
 * ```typescript
 * const autoDownload = getSetting('autoDownload', false);
 * const quality = getSetting('imageQuality', 'high');
 * ```
 */
export function getSetting<T>(key: string, defaultValue: T): T {
  const svc = tryGetSettingsService();
  if (!svc) return defaultValue;
  try {
    return (svc.get<T>(key) ?? defaultValue) as T;
  } catch {
    return defaultValue;
  }
}

/**
 * 설정값을 씁니다 (실패해도 무시).
 * 서비스가 없거나 쓰기 실패 시 조용히 무시합니다.
 *
 * @template T 값의 타입
 * @param key 설정 키
 * @param value 설정값
 *
 * @example
 * ```typescript
 * await setSetting('autoDownload', true);
 * await setSetting('imageQuality', 'high');
 * ```
 */
export async function setSetting<T>(key: string, value: T): Promise<void> {
  const svc = tryGetSettingsService();
  if (!svc) return;
  try {
    await svc.set?.(key, value);
  } catch {
    // noop: 브라우저/테스트 환경에서만 필요
  }
}
