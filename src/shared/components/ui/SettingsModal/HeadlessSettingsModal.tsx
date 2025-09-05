/**
 * @fileoverview HeadlessSettingsModal Component
 * @description Headless 패턴으로 설정 모달 로직과 프레젠테이션을 분리한 컴포넌트
 */

import { type VNode } from '@shared/external/vendors';
import { useSettingsModal } from '@shared/hooks/useSettingsModal';
import { useFocusScope } from '@shared/hooks/useFocusScope';

interface HeadlessSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  children: (props: any) => any;
}

/**
 * Headless 설정 모달 컴포넌트
 * 로직만 제공하고 렌더링은 children 함수에 위임
 */
export function HeadlessSettingsModal({
  isOpen,
  onClose,
  children,
}: HeadlessSettingsModalProps): VNode | null {
  // 설정 상태 관리
  const settingsState = useSettingsModal();

  // 포커스 관리
  const focusScope = useFocusScope({
    isOpen,
    onClose,
    initialFocusSelector: 'button[aria-label="Close"]',
    restoreFocus: true,
  });

  if (!isOpen) return null;

  // 렌더 함수에 모든 props 전달
  return children({
    ...settingsState,
    ...focusScope,
  });
}
