/**
 * @fileoverview ToolbarButton Foundation Component (Phase P2)
 * @description 통합된 툴바 버튼 컴포넌트 - Compatibility Wrapper for Button
 * @deprecated Use Button directly for new code
 */

import { Button, type ButtonProps } from '../Button';
import type { ComponentChildren } from '@shared/external/vendors';

export type ToolbarButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ToolbarButtonSize = 'sm' | 'md' | 'lg';
export type ToolbarButtonType = 'button' | 'submit' | 'reset';

export interface ToolbarButtonProps {
  /** 버튼 변형 */
  variant?: ToolbarButtonVariant;
  /** 버튼 크기 */
  size?: ToolbarButtonSize;
  /** 버튼 타입 */
  type?: ToolbarButtonType;
  /** 비활성화 상태 */
  disabled?: boolean;
  /** 로딩 상태 */
  loading?: boolean;
  /** 활성화 상태 (토글 버튼용) */
  active?: boolean;
  /** 아이콘 전용 버튼 */
  iconOnly?: boolean;
  /** 아이콘 + 텍스트 */
  hasIcon?: boolean;
  /** 클릭 이벤트 */
  onClick?: ((event: Event) => void) | undefined;
  /** 포커스 이벤트 */
  onFocus?: ((event: FocusEvent) => void) | undefined;
  /** 블러 이벤트 */
  onBlur?: ((event: FocusEvent) => void) | undefined;
  /** 키다운 이벤트 */
  onKeyDown?: ((event: KeyboardEvent) => void) | undefined;
  /** 추가 클래스명 */
  className?: string;
  /** 테스트 ID */
  'data-testid'?: string;
  /** 접근성 레이블 */
  'aria-label'?: string;
  /** ARIA pressed (토글 버튼용) */
  'aria-pressed'?: boolean | 'true' | 'false';
  /** ARIA expanded (드롭다운 버튼용) */
  'aria-expanded'?: boolean | 'true' | 'false';
  /** ARIA haspopup (드롭다운 버튼용) */
  'aria-haspopup'?: 'true' | 'false' | 'menu' | 'listbox' | 'tree' | 'grid' | 'dialog';
  /** ARIA described by */
  'aria-describedby'?: string;
  /** 제목 (툴팁) */
  title?: string;
  /** 탭 인덱스 */
  tabIndex?: number;
  /** 자식 요소 */
  children?: ComponentChildren;
  /** 갤러리 요소 타입 (data-gallery-element) */
  'data-gallery-element'?: string;
  /** 비활성화 상태 (data-disabled) */
  'data-disabled'?: boolean;
  /** 로딩 상태 (data-loading) */
  'data-loading'?: boolean;
}

// Props 매핑 함수
function mapToolbarButtonPropsToUnified(props: ToolbarButtonProps): ButtonProps {
  const {
    active,
    hasIcon,
    'data-gallery-element': dataGalleryElement,
    'data-disabled': dataDisabled,
    'data-loading': dataLoading,
    ...rest
  } = props;

  // active를 aria-pressed로 매핑 (토글 버튼 동작)
  const ariaPressed = active;

  // hasIcon은 Button에서 자동 감지하므로 제거

  return {
    ...rest,
    ...(ariaPressed !== undefined && { 'aria-pressed': ariaPressed }),
    ...(rest.onClick && { onClick: rest.onClick as (event: MouseEvent) => void }),
    ...(dataGalleryElement !== undefined && { 'data-gallery-element': dataGalleryElement }),
    ...(dataDisabled !== undefined && { 'data-disabled': dataDisabled }),
    ...(dataLoading !== undefined && { 'data-loading': dataLoading }),
  } as ButtonProps;
}

// 개발 모드 deprecation 경고 (한 번만)
let hasWarned = false;
function warnDeprecation() {
  if (!hasWarned && typeof process !== 'undefined' && process.env.NODE_ENV === 'development') {
    console.warn(
      '[ToolbarButton Deprecation]: Consider migrating to Button for better maintainability. ' +
        'Legacy ToolbarButton wrapper will be removed in a future version. ' +
        'Note: "active" prop is now "aria-pressed" for better accessibility.'
    );
    hasWarned = true;
  }
}

/**
 * 통합 ToolbarButton 컴포넌트
 * 모든 툴바 버튼의 스타일과 동작을 표준화
 */
export const ToolbarButton = (props: ToolbarButtonProps) => {
  warnDeprecation();

  const unifiedProps = mapToolbarButtonPropsToUnified(props);
  return Button(unifiedProps);
};

export default ToolbarButton;
