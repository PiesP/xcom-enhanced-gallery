/**
 * ToolbarButton Primitive (TBAR-R P2)
 * - 툴바 내 모든 아이콘성 버튼을 위한 단일 추상화
 * - IconButton 대비: toolbar 전용 사이즈/상태 data-* 속성 표준화
 */
import type { VNode } from '@shared/external/vendors';
import { getPreact } from '@shared/external/vendors';
import { LazyIcon } from '@shared/components/LazyIcon';
import type { IconName } from '@shared/services/iconRegistry';
import styles from './ToolbarButton.module.css';
import primitiveStyles from '@shared/styles/primitives.module.css';

export interface ToolbarButtonProps {
  readonly icon?: IconName;
  readonly 'aria-label': string; // icon-only이므로 필수
  readonly title?: string;
  readonly disabled?: boolean;
  readonly loading?: boolean;
  readonly selected?: boolean;
  readonly intent?: 'default' | 'danger';
  readonly onClick?: (event: Event) => void;
  readonly 'data-gallery-element'?: string;
  readonly 'data-testid'?: string;
  readonly key?: string;
}

export function ToolbarButton({
  icon,
  'aria-label': ariaLabel,
  title,
  disabled = false,
  loading = false,
  selected = false,
  intent = 'default',
  onClick,
  'data-gallery-element': dataEl,
  'data-testid': testId,
  key,
}: ToolbarButtonProps): VNode {
  const { h } = getPreact();

  const handleClick = (e: Event) => {
    if (disabled || loading) {
      e.preventDefault();
      return;
    }
    onClick?.(e);
  };

  const vnode = h(
    'button',
    {
      key,
      type: 'button',
      className: [
        primitiveStyles.controlSurface,
        styles.toolbarButton,
        intent === 'danger' ? styles['intent-danger'] : '',
      ]
        .filter(Boolean)
        .join(' '),
      'aria-label': ariaLabel,
      title: title || ariaLabel,
      disabled: disabled || loading,
      'aria-disabled': disabled || loading,
      'data-disabled': disabled || loading || undefined,
      'data-loading': loading || undefined,
      'data-selected': selected || undefined,
      'data-gallery-element': dataEl,
      'data-toolbar-button': 'true',
      onClick: handleClick,
      'data-testid': testId,
    },
    icon ? h(LazyIcon as unknown as (p: { name: IconName }) => VNode, { name: icon }) : null
  ) as unknown as VNode;
  return vnode;
}

ToolbarButton.displayName = 'ToolbarButton';

export default ToolbarButton;
