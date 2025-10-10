/** Heroicons ChevronRight adapter (Solid.js) */
import type { JSXElement } from '../../../../external/vendors';
import { Icon, type IconProps } from '../Icon';

export function HeroChevronRight(props: IconProps): JSXElement {
  return (
    <Icon {...props}>
      <path d='m8.25 4.5 7.5 7.5-7.5 7.5' />
    </Icon>
  );
}
