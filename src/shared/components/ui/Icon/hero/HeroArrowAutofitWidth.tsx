/** Heroicons ArrowAutofitWidth adapter (Solid.js) */
import type { JSXElement } from '../../../../external/vendors';
import { Icon, type IconProps } from '../Icon';

export function HeroArrowAutofitWidth(props: IconProps): JSXElement {
  return (
    <Icon {...props}>
      <path d='M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5' />
    </Icon>
  );
}
