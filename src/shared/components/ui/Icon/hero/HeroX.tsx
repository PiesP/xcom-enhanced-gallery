import type { JSXElement } from '../../../../external/vendors';
import { Icon, type IconProps } from '../Icon';

export function HeroX(props: IconProps): JSXElement {
  return (
    <Icon {...props}>
      <path d='M6 18 18 6M6 6l12 12' />
    </Icon>
  );
}
