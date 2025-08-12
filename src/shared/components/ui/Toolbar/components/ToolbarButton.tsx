/**
 * @file 표준화된 툴바 버튼 컴포넌트
 * @description 툴바와 모달에서 일관된 버튼 경험을 제공하는 컴포넌트
 */

import { Button } from '@shared/components/ui/Button/Button';
import { getIcon, type IconName, type IconComponent } from '@shared/services/icon-service';
import { useStandardEventHandling } from '@shared/hooks/useStandardEventHandling';
import { getPreact, getPreactHooks } from '@shared/external/vendors';

/**
 * 툴바 버튼 Props
 */
export interface ToolbarButtonProps {
  /** 표시할 아이콘 */
  icon: IconName;
  /** 버튼 변형 */
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  /** 버튼 크기 */
  size?: 'sm' | 'md' | 'lg';
  /** 비활성화 상태 */
  disabled?: boolean;
  /** 로딩 상태 */
  loading?: boolean;
  /** 클릭 이벤트 핸들러 */
  onClick: () => void;
  /** 접근성 라벨 */
  'aria-label': string;
  /** 테스트 ID */
  'data-testid'?: string;
  /** 툴팁 제목 */
  title?: string;
  /** 아이콘 크기 */
  iconSize?: number;
  /** 컨텍스트 (디버깅용) */
  context?: string;
}

/**
 * 표준화된 툴바 버튼 컴포넌트
 */
export function ToolbarButton({
  icon,
  variant = 'secondary',
  size = 'md',
  disabled,
  loading,
  onClick,
  'aria-label': ariaLabel,
  'data-testid': testId,
  title,
  iconSize = 32,
  context,
}: ToolbarButtonProps) {
  const { h } = getPreact();
  const { handleButtonClick } = useStandardEventHandling();
  const { useState, useEffect } = getPreactHooks();
  const [IconComponent, setIconComponent] = useState<IconComponent | null>(null);

  // 아이콘 동기 로딩
  useEffect(() => {
    const Component = getIcon(icon);
    setIconComponent(() => Component);
  }, [icon]);

  return h(Button, {
    variant,
    size,
    disabled,
    loading,
    onClick: handleButtonClick(onClick, context),
    'aria-label': ariaLabel,
    'data-testid': testId,
    title,
    className: '', // CSS Modules 사용으로 글로벌 클래스 제거
    children: IconComponent ? h(IconComponent, { size: iconSize }) : h('span', {}, '⟳'), // 로딩 표시
  });
}
