/** Heroicons ChevronLeft adapter (Solid.js) */
import type { JSXElement } from '../../../../external/vendors';
import { Icon, type IconProps } from '../Icon';

export function HeroChevronLeft(props: IconProps): JSXElement {
  return (
    <Icon {...props}>
      <path d='M15.75 19.5 8.25 12l7.5-7.5' />
    </Icon>
  );
}
