/**
 * Core icon 목록: 초기 프리로드 및 sync 경로 가속 대상
 * ICN-R5: registry map 전환 시 이 리스트를 기반으로 preloadCommonIcons 구성
 */
// IconName 타입을 직접 재정의(아이콘 추가 시 동기화 필요) - 순환 의존 방지
export type CoreIconName =
  | 'Download'
  | 'Settings'
  | 'X'
  | 'ChevronLeft'
  | 'ChevronRight'
  // 확장: 주요 툴바 인터랙션 아이콘 (동기 렌더 체감 향상)
  | 'ZoomIn'
  | 'ArrowAutofitWidth'
  | 'ArrowAutofitHeight'
  | 'ArrowsMaximize'
  | 'FileZip';

// 향후 빌드 사이즈 관리를 위해 이 배열이 단일 소스
export const CORE_ICONS: CoreIconName[] = [
  'Download',
  'Settings',
  'X',
  'ChevronLeft',
  'ChevronRight',
  'ZoomIn',
  'ArrowAutofitWidth',
  'ArrowAutofitHeight',
  'ArrowsMaximize',
  'FileZip',
];

export function isCoreIcon(name: string): boolean {
  return (CORE_ICONS as readonly string[]).includes(name);
}
