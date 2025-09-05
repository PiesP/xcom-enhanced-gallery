/**
 * @fileoverview Button Wrapper (Legacy Compatibility)
 * @description 기존 Button 컴포넌트를 통합 Button으로 연결하는 wrapper
 * @deprecated 직접 Button을 import하여 사용하세요: import { Button } from '@shared/components/ui/Button'
 */

import { Button as UnifiedButton, type ButtonProps as UnifiedButtonProps } from '../Button';
import type { ComponentChildren } from '@shared/external/vendors';

// Legacy Button Props - 호환성을 위한 매핑
export interface ButtonProps {
  // 기본 HTML 버튼 속성들
  children?: ComponentChildren;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  autoFocus?: boolean;
  form?: string;
  className?: string;

  // 이벤트 핸들러들
  onClick?: (event?: Event) => void;
  onFocus?: (event: FocusEvent) => void;
  onBlur?: (event: FocusEvent) => void;
  onKeyDown?: (event: KeyboardEvent) => void;
  onMouseEnter?: (event: MouseEvent) => void;
  onMouseLeave?: (event: MouseEvent) => void;

  // 커스텀 속성들
  variant?: 'primary' | 'secondary' | 'outline' | 'icon' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  iconVariant?: 'primary' | 'success' | 'danger';
  loading?: boolean;

  // 테스트 속성
  testId?: string;
  'data-testid'?: string;

  // ARIA 접근성 속성들
  role?: string;
  tabIndex?: number;
  'aria-label'?: string;
  'aria-describedby'?: string;
  'aria-pressed'?: boolean | 'true' | 'false' | 'mixed';
  'aria-expanded'?: boolean | 'true' | 'false';
  'aria-haspopup'?: boolean | 'true' | 'false' | 'menu' | 'listbox' | 'tree' | 'grid' | 'dialog';
  'aria-busy'?: boolean;
}

// Props 매핑 함수
function mapButtonPropsToUnified(props: ButtonProps): UnifiedButtonProps {
  const { iconVariant, testId, 'data-testid': dataTestId, ...rest } = props;

  // iconVariant는 무시 (통합 Button에서 지원하지 않음)
  return {
    ...rest,
    ...((dataTestId || testId) && { 'data-testid': dataTestId || testId }),
  } as UnifiedButtonProps;
}

// 개발 모드 deprecation 경고 (한 번만)
let hasWarned = false;
function warnDeprecation() {
  if (!hasWarned && typeof process !== 'undefined' && process.env.NODE_ENV === 'development') {
    console.warn(
      '[Button Deprecation]: Legacy Button wrapper is deprecated. ' +
        'Use Button directly from @shared/components/ui/Button'
    );
    hasWarned = true;
  }
}

export const LegacyButton = (props: ButtonProps) => {
  warnDeprecation();

  const unifiedProps = mapButtonPropsToUnified(props);
  return UnifiedButton(unifiedProps);
};

export default LegacyButton;
export type { ButtonProps as LegacyButtonProps };
