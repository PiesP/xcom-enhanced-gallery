/**
 * @fileoverview UnifiedToolbar 엔트리
 * 통합 정책: 실제 구현을 재export하여 중복/스텁을 제거합니다.
 * - default: Toolbar (실사용 컴포넌트, Phase 44-47에서 설정 패널 통합)
 * - named: ToolbarShell (공용 Shell 컴포넌트)
 */
export { Toolbar as default } from './Toolbar';
export { ToolbarShell } from '../ToolbarShell/ToolbarShell';
