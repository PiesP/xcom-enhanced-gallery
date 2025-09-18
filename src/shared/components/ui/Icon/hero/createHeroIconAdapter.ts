import type { VNode } from '@shared/external/vendors';
import { getPreact } from '@shared/external/vendors';
import { Icon, type IconProps } from '../Icon';

type IconLike = (props: Record<string, unknown>) => VNode | null;

/**
 * Heroicons React outline 아이콘을 공통 패턴으로 감싸는 어댑터 팩토리
 * 중복된 size/class/aria 처리 로직을 제거한다.
 */
export function createHeroIconAdapter(getIcon: () => IconLike, displayName: string) {
  function Adapter(props: IconProps): VNode {
    const { h } = getPreact();
    const { size = 'var(--xeg-icon-size)', className, 'aria-label': ariaLabel } = props;
    const iconProps: IconProps = { size };
    if (className !== undefined) iconProps.className = className;
    if (ariaLabel !== undefined) iconProps['aria-label'] = ariaLabel;
    const Impl = getIcon();
    const sizeVal = typeof size === 'number' ? `${size}px` : size;
    return h(
      Icon,
      iconProps,
      h(Impl as unknown as IconLike, {
        width: sizeVal,
        height: sizeVal,
        fill: 'none',
        stroke: 'var(--xeg-icon-color, currentColor)',
        strokeWidth: 'var(--xeg-icon-stroke-width)',
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
      })
    );
  }
  Adapter.displayName = displayName;
  return Adapter;
}

export default createHeroIconAdapter;
