/**
 * @fileoverview Phase 2: ToolbarShell 추상화 컴포넌트
 * @description 툴바의 공통 레이아웃/스타일 Shell - semantic props 사용
 */

import { getPreact, type ComponentChildren } from '../../../external/vendors';

export interface ToolbarShellProps {
  /** 컨텐츠 */
  children: ComponentChildren;

  /** 시맨틱 elevation 레벨 */
  elevation?: 'low' | 'medium' | 'high';

  /** 표면 변형 */
  surfaceVariant?: 'glass' | 'solid' | 'overlay';

  /** 위치 */
  position?: 'fixed' | 'sticky' | 'relative';

  /** 추가 클래스 */
  className?: string;

  /** 테스트 ID */
  'data-testid'?: string;

  /** ARIA 레이블 */
  'aria-label'?: string;
}

/**
 * 툴바의 공통 껍데기 - 디자인 토큰 기반
 */
export function ToolbarShell({
  children,
  elevation = 'medium',
  surfaceVariant = 'glass',
  position = 'fixed',
  className = '',
  'data-testid': testId,
  'aria-label': ariaLabel,
  ...props
}: ToolbarShellProps) {
  const { h } = getPreact();
  const elevationClass = `toolbar-elevation-${elevation}`;
  const surfaceClass = `toolbar-surface-${surfaceVariant}`;
  const positionClass = `toolbar-position-${position}`;

  return h(
    'div',
    {
      class: `toolbar-shell ${elevationClass} ${surfaceClass} ${positionClass} ${className}`.trim(),
      role: 'toolbar',
      'aria-label': ariaLabel || 'Toolbar',
      'data-testid': testId,
      ...props,
    },
    children
  );
}

export default ToolbarShell;
