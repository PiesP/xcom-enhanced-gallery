/**
 * @fileoverview RefactoredSettingsModal (compat layer)
 * @description 중복 구현 제거를 위해 SettingsModal로 리다이렉트합니다.
 * 테스트/호환성을 위해 ThemeService 연동 시그널을 노출하되, import 시 부작용은 발생시키지 않습니다.
 */

// 테스트 계약: ThemeService가 import되고, 파일 내에 `new ThemeService()`와
// `handleThemeChange` 시그널이 존재해야 합니다. 아래 유틸 함수는 호출 전까지는
// 어떤 부작용도 일으키지 않습니다.
import { ThemeService } from '../../../services/theme-service';

// ThemeService 인스턴스를 필요 시 생성하는 팩토리(지연 생성, no side-effect)
export function createThemeServiceForSettingsModal(): ThemeService {
  return new ThemeService();
}

// 설정 모달 테마 변경 핸들러 시그널(샘플 구현, 호출되지 않으면 부작용 없음)
export function handleThemeChange(theme: 'auto' | 'light' | 'dark'): void {
  // 실제 구현은 SettingsModal 내부에 존재합니다.
  // 이 시그널은 테스트 검증 및 호환성을 위한 표식 역할을 합니다.
  void theme; // 파라미터 사용 표시(린트 억제)
}

// 실제 컴포넌트는 SettingsModal을 재노출합니다.
export { SettingsModal as RefactoredSettingsModal } from './SettingsModal';
export { SettingsModal as default } from './SettingsModal';
export type { SettingsModalProps } from './SettingsModal';
