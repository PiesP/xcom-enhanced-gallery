/**
 * @file 표준화된 툴바 버튼 컴포넌트
 * @description 툴바와 모달에서 일관된 버튼 경험을 제공하는 컴포넌트
 */

import { Button } from '@shared/components/ui/Button/Button';
import { getIcon, type IconName, type IconComponent } from '@shared/services/icon-service';
import { useStandardEventHandling } from '@shared/hooks/useStandardEventHandling';
import { getPreact, getPreactHooks } from '@shared/external/vendors';
import { UnifiedDarkModeStyleSystem } from '@shared/styles/unified-dark-mode-style-system';

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
  iconSize,
  context,
}: ToolbarButtonProps) {
  const { h } = getPreact();
  const { handleButtonClick } = useStandardEventHandling();
  const { useState, useEffect } = getPreactHooks();
  const [IconComponent, setIconComponent] = useState<IconComponent | null>(null);

  // 통합 다크모드 시스템 인스턴스 (CSS 변수 관리용)
  UnifiedDarkModeStyleSystem.getInstance();

  // 아이콘 크기 매핑: 통합 스타일 시스템 사용
  const resolvedIconSize = (() => {
    if (typeof iconSize === 'number' && !Number.isNaN(iconSize)) return iconSize;

    // 통합 스타일 시스템에서 크기 가져오기
    const sizeMap = { sm: 16, md: 20, lg: 24 };
    return sizeMap[size];
  })();

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
    // 통합 툴바 스타일 시스템 클래스 적용
    className: `xeg-unified-toolbar-button xeg-unified-button-${size} xeg-unified-button-${variant}`,
    // 아이콘 크기는 통합 시스템에서 계산된 값 사용
    children: IconComponent ? h(IconComponent, { size: resolvedIconSize }) : h('span', {}, '⟳'), // 로딩 표시
  });
}
