/**
 * Feature Flag Signals
 * 각 플래그는 점진적 출시/롤백을 위해 signal 기반으로 노출
 */
import { getPreactSignals } from '@shared/external/vendors';

// 일부 테스트는 '@shared/external/vendors' 를 부분 모킹하여 getPreactSignals() 혹은 signal 구현을 제공하지 않을 수 있음.
// 런타임/테스트 안전성을 위해 방어적 폴백을 적용한다.
function safeGetSignals() {
  try {
    const api = getPreactSignals?.() as unknown as { signal?: unknown; effect?: unknown };
    if (api && typeof api.signal === 'function')
      return api as {
        signal: <T>(v: T) => { value: T };
        effect?: (fn: () => void) => () => void;
      };
  } catch {
    // ignore
  }
  // Fallback 최소 signal/effect 구현
  const fallbackSignal = <T>(initial: T) => {
    let _v = initial;
    return {
      get value() {
        return _v;
      },
      set value(n: T) {
        _v = n;
      },
    } as { value: T };
  };
  const fallbackEffect = (_fn: () => void) => () => {};
  return { signal: fallbackSignal, effect: fallbackEffect };
}

const { signal } = safeGetSignals();

// scroll isolation v1 (boundary-aware) 비활성 기본
export const xeg_scrollIsolationV1 = signal<boolean>(false);

export interface FeatureFlagsSnapshot {
  scrollIsolationV1: boolean;
}

export function getFeatureFlags(): FeatureFlagsSnapshot {
  return {
    scrollIsolationV1: xeg_scrollIsolationV1.value,
  };
}
