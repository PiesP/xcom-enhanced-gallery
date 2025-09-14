/**
 * @fileoverview RefactoredSettingsModal (alias)
 * @description 중복 구현 제거를 위해 SettingsModal로 리다이렉트합니다.
 * 테스트/호환성을 위해 기존 import 경로를 유지합니다.
 */

export { SettingsModal as RefactoredSettingsModal } from './SettingsModal';
export { SettingsModal as default } from './SettingsModal';
export type { SettingsModalProps } from './SettingsModal';
