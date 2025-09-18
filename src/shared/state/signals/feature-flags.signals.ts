/**
 * Feature Flag Signals
 * 각 플래그는 점진적 출시/롤백을 위해 signal 기반으로 노출
 */
import { getPreactSignals } from '@shared/external/vendors';

const { signal } = getPreactSignals();

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
