/**
 * @fileoverview IconButton Primitive Component
 * @description 아이콘 전용 버튼 - Compatibility Wrapper for Button
 * @deprecated Use Button with iconOnly prop for new code
 */

import { Button, type ButtonProps } from '../Button';
import type { ComponentChildren } from '@shared/external/vendors';

export interface IconButtonProps {
  readonly children: ComponentChildren;
  readonly 'aria-label': string; // 필수 접근성 속성
  readonly className?: string;
  readonly size?: 'sm' | 'md' | 'lg';
  readonly disabled?: boolean;
  readonly onClick?: (event: MouseEvent) => void;
}

// Props 매핑 함수
function mapIconButtonPropsToUnified(props: IconButtonProps): ButtonProps {
  const { ...rest } = props;

  return {
    ...rest,
    iconOnly: true, // IconButton은 항상 iconOnly 모드
    variant: 'icon', // 기본 icon variant 사용
  };
}

// 개발 모드 deprecation 경고 (한 번만)
let hasWarned = false;
function warnDeprecation() {
  if (!hasWarned && typeof process !== 'undefined' && process.env.NODE_ENV === 'development') {
    console.warn(
      '[IconButton Deprecation]: Consider using Button with iconOnly prop for new code. ' +
        'Legacy IconButton wrapper will be removed in a future version.'
    );
    hasWarned = true;
  }
}

export function IconButton(props: IconButtonProps) {
  warnDeprecation();

  const unifiedProps = mapIconButtonPropsToUnified(props);
  return Button(unifiedProps);
}
