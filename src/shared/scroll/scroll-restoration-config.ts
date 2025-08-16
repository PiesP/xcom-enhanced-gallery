/**
 * Scroll Restoration Config
 * - 중복 경로(gallery signals vs hook) 제어 플래그 제공
 */
export interface ScrollRestorationConfig {
  /** gallery.signals.ts 에서 open/close 시 직접 save/restore 수행 여부 (기본 true - 기존 유지) */
  enableSignalBasedGalleryScroll: boolean;
  /** 다중 패스(지연 보정, MutationObserver 기반 보정 등) 스크롤 재보정을 비활성화하여 진동(jitter) 최소화 */
  disableMultiPassScrollCorrection: boolean;
  /** 전략 우선순위 (name 배열) - 미지정 시 기본 ['anchor','absolute'] */
  strategyOrder?: string[];
  /** legacy anchor key (scrollAnchor:...) dual-write & restore fallback 활성화 여부 (기본 true -> 단계적 제거) */
  enableLegacyAnchorKey?: boolean;
}

// 타임라인 위치 복원 강화: 모든 경우에 앵커 기반 즉시 복원 보장
// Signal 기반 활성화 + 다중 패스 보정 비활성화로 안정적이고 즉시적인 복원 제공
const defaultConfig: ScrollRestorationConfig = {
  // 갤러리 종료 시 Signal에서 직접 앵커 기반 복원 수행 (우선순위 보장)
  enableSignalBasedGalleryScroll: true,
  // 다중 패스 보정 완전 비활성화 (진동/지연 없는 즉시 복원)
  disableMultiPassScrollCorrection: true,
  // 앵커 우선, 실패 시 절대 좌표 폴백 전략
  strategyOrder: ['anchor', 'absolute'],
  // Legacy 키 지원 유지 (하위 호환성)
  enableLegacyAnchorKey: true,
};

let activeConfig: ScrollRestorationConfig = { ...defaultConfig };

export function setScrollRestorationConfig(partial: Partial<ScrollRestorationConfig>): void {
  activeConfig = { ...activeConfig, ...partial };
}

export function getScrollRestorationConfig(): ScrollRestorationConfig {
  return activeConfig;
}

export function resetScrollRestorationConfig(): void {
  activeConfig = { ...defaultConfig };
}

export const __test_only = { resetScrollRestorationConfig };
