import { getPreact, getPreactHooks } from '@shared/external/vendors';
import type { IconName, IconComponent } from '@/shared/services/icon-service';
import { getIcon } from '@/shared/services/icon-service';
import styles from './ToolbarIconButton.module.css';

/**
 * 툴바 아이콘 버튼 속성 인터페이스
 */
export interface ToolbarIconButtonProps {
  /** 표시할 아이콘 이름 */
  icon: IconName;
  /** 버튼 라벨 (접근성용) */
  label: string;
  /** 클릭 이벤트 핸들러 */
  onClick?: (event: Event) => void;
  /** 비활성화 상태 */
  disabled?: boolean;
  /** 버튼 변형 스타일 */
  variant?: 'primary' | 'secondary' | 'danger';
  /** 버튼 크기 */
  size?: 'sm' | 'md' | 'lg';
  /** 커스텀 CSS 클래스 */
  className?: string;
  /** 접근성 라벨 */
  'aria-label'?: string;
  /** 제목 (툴팁) */
  title?: string;
  /** 테스트 ID */
  'data-testid'?: string;
  /** 기타 HTML 속성 */
  [key: string]: unknown;
}

/**
 * 툴바에서 사용할 아이콘 버튼 컴포넌트
 *
 * lucide-preact 아이콘을 동적으로 로드하여 표시하는 버튼
 * 접근성, 로딩 상태, 다양한 스타일 변형을 지원
 */
export function ToolbarIconButton({
  icon,
  label,
  onClick,
  disabled = false,
  variant = 'secondary',
  size = 'md',
  className = '',
  'aria-label': ariaLabel,
  title,
  'data-testid': testId,
  ...props
}: ToolbarIconButtonProps) {
  const { h } = getPreact();
  const { useState, useEffect } = getPreactHooks();

  const [IconComponent, setIconComponent] = useState<IconComponent | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 아이콘 로딩
  useEffect(() => {
    let mounted = true;
    setIsLoading(true);

    getIcon(icon)
      .then(Component => {
        if (mounted) {
          setIconComponent(() => Component);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (mounted) {
          // 로딩 실패 시에도 상태 업데이트
          setIsLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [icon]);

  // 아이콘 크기 매핑
  const iconSizes = {
    sm: 16,
    md: 20,
    lg: 24,
  };

  const iconSize = iconSizes[size];

  // CSS 클래스 조합
  const buttonClasses = [styles.toolbarIconButton, styles[variant], styles[size], className]
    .filter(Boolean)
    .join(' ');

  return h(
    'button',
    {
      type: 'button',
      className: buttonClasses,
      onClick,
      disabled,
      'aria-label': ariaLabel || label,
      title: title || label,
      'data-testid': testId,
      ...props,
    },
    [
      // 아이콘 영역
      h(
        'span',
        {
          className: styles.iconContainer,
          'aria-hidden': true,
        },
        [
          isLoading
            ? // 로딩 플레이스홀더
              h('span', { className: styles.loadingPlaceholder })
            : IconComponent
              ? // 로드된 아이콘
                h(IconComponent, {
                  size: iconSize,
                  className: styles.icon || '',
                })
              : // 폴백 (로딩 실패)
                h('span', { className: styles.fallbackIcon }),
        ]
      ),
      // 라벨 (시각적으로 숨김, 스크린 리더용)
      h(
        'span',
        {
          className: styles.label,
        },
        label
      ),
    ]
  );
}

export default ToolbarIconButton;
