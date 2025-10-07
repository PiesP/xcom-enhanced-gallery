/**
 * @fileoverview ToolbarShell.solid - Solid.js 툴바 셸 컴포넌트
 * @description 툴바의 공통 레이아웃/스타일 Shell - 디자인 토큰 기반
 *
 * @features
 * - Semantic elevation 레벨 (low, medium, high)
 * - 표면 변형 (glass, solid, overlay)
 * - 위치 설정 (fixed, sticky, relative)
 * - ARIA 접근성 지원
 * - 디자인 토큰 기반 클래스 조합
 */

import { mergeProps, type Component, type JSX } from 'solid-js';

export interface ToolbarShellProps {
  /** 컨텐츠 */
  readonly children: JSX.Element;

  /** 시맨틱 elevation 레벨 */
  readonly elevation?: 'low' | 'medium' | 'high';

  /** 표면 변형 */
  readonly surfaceVariant?: 'glass' | 'solid' | 'overlay';

  /** 위치 */
  readonly position?: 'fixed' | 'sticky' | 'relative';

  /** 추가 클래스 */
  readonly className?: string;

  /** 테스트 ID */
  readonly 'data-testid'?: string;

  /** ARIA 레이블 */
  readonly 'aria-label'?: string;
}

/**
 * 툴바의 공통 껍데기 - 디자인 토큰 기반
 */
export const ToolbarShell: Component<ToolbarShellProps> = props => {
  const merged = mergeProps(
    {
      elevation: 'medium' as const,
      surfaceVariant: 'glass' as const,
      position: 'fixed' as const,
      className: '',
      'aria-label': 'Toolbar',
    },
    props
  );

  // 클래스 조합 (반응성을 위해 함수로)
  const toolbarClass = () => {
    const elevationClass = `toolbar-elevation-${merged.elevation}`;
    const surfaceClass = `toolbar-surface-${merged.surfaceVariant}`;
    const positionClass = `toolbar-position-${merged.position}`;

    return `toolbar-shell ${elevationClass} ${surfaceClass} ${positionClass} ${merged.className}`.trim();
  };

  return (
    <div
      class={toolbarClass()}
      role='toolbar'
      aria-label={merged['aria-label']}
      data-testid={merged['data-testid']}
    >
      {merged.children}
    </div>
  );
};

export default ToolbarShell;
