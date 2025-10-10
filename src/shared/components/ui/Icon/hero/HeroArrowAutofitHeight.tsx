/** Heroicons ArrowAutofitHeight adapter (Solid.js) */
import type { JSXElement } from '../../../../external/vendors';
import { Icon, type IconProps } from '../Icon';

export function HeroArrowAutofitHeight(props: IconProps): JSXElement {
  return (
    <Icon {...props}>
      <path d='M3 7.5 7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5' />
    </Icon>
  );
}
