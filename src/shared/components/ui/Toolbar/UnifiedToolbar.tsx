/**
 * @fileoverview UnifiedToolbar 엔트리
 * 통합 정책: 실제 구현을 재export하여 중복/스텁을 제거합니다.
 * - default: ToolbarWithSettings (실사용 컴포넌트)
 * - named: ToolbarShell (공용 Shell 컴포넌트)
 */
export { ToolbarWithSettings as default } from '../ToolbarWithSettings/ToolbarWithSettings';
export { ToolbarShell } from '../ToolbarShell/ToolbarShell';
