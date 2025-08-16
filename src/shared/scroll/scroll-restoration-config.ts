/**
 * Scroll Restoration Config
 * - 중복 경로(gallery signals vs hook) 제어 플래그 제공
 */
export interface ScrollRestorationConfig {
  /** gallery.signals.ts 에서 open/close 시 직접 save/restore 수행 여부 (기본 true - 기존 유지) */
  enableSignalBasedGalleryScroll: boolean;
}

// 기본값 전환:
// 기존에는 true (signal + hook 중복 가능) -> 중복/레이스 조건 감소 위해 false 로 전환
// Migration: 필요한 경우 setScrollRestorationConfig({ enableSignalBasedGalleryScroll: true }) 호출
const defaultConfig: ScrollRestorationConfig = {
  enableSignalBasedGalleryScroll: false,
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
