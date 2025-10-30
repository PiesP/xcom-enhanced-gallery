/**
 * LazyIcon component
 * - Uses getter functions for props-dependent class and style per reactive policy
 */
import type { JSX } from 'solid-js';

type Props = {
  className?: string | undefined;
  size?: number | string | undefined;
  color?: string | undefined;
};

export default function LazyIcon(props: Props): JSX.Element {
  // Reactive getters (do not evaluate props statically)
  const className = () => [props.className].filter(Boolean).join(' ');
  const style = () =>
    props.size
      ? {
          width: typeof props.size === 'number' ? `${props.size}px` : props.size,
          height: typeof props.size === 'number' ? `${props.size}px` : props.size,
          color: props.color,
        }
      : undefined;

  return (
    <svg
      class={className()}
      style={style()}
      viewBox='0 0 24 24'
      aria-hidden='true'
      xmlns='http://www.w3.org/2000/svg'
    >
      <circle cx='12' cy='12' r='10' fill='currentColor' />
    </svg>
  );
}
