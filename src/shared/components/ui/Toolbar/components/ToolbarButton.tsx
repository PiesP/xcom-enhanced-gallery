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
  iconSize,
  context,
}: ToolbarButtonProps) {
  const { h } = getPreact();
  const { handleButtonClick } = useStandardEventHandling();
  const { useState, useEffect } = getPreactHooks();
  const [IconComponent, setIconComponent] = useState<IconComponent | null>(null);

  // 아이콘 크기 매핑: 버튼 size -> 아이콘 크기 (디자인 토큰과 정합)
  const resolvedIconSize = (() => {
    if (typeof iconSize === 'number' && !Number.isNaN(iconSize)) return iconSize;
    // CSS 변수 기반 우선 읽기(토큰 오버라이드 대응)
    try {
      const root = document.documentElement;
      const styles = getComputedStyle(root);
      const tokenKey: Record<'sm' | 'md' | 'lg', string> = {
        sm: '--xeg-icon-size-sm',
        md: '--xeg-icon-size-md',
        lg: '--xeg-icon-size-xl', // 툴바 용도: 크게
      };
      const raw = styles.getPropertyValue(tokenKey[size] as string).trim();
      if (raw) {
        const parsed = parseInt(raw, 10);
        if (!Number.isNaN(parsed)) return parsed;
      }
    } catch {
      // 비브라우저 환경(테스트) 대비 폴백 사용
    }
    // 최종 폴백 기본 매핑: sm 20 / md 24 / lg 28
    const defaultMap: Record<'sm' | 'md' | 'lg', number> = { sm: 20, md: 24, lg: 28 };
    return defaultMap[size] ?? 24;
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
    className: '', // CSS Modules 사용으로 글로벌 클래스 제거
    // 아이콘 크기는 size와 매핑된 기본 값을 사용하되, iconSize prop으로 오버라이드 가능
    children: IconComponent ? h(IconComponent, { size: resolvedIconSize }) : h('span', {}, '⟳'), // 로딩 표시
  });
}
