import type { IconProps } from '@shared/components/ui/Icon/Icon';
import type { LucideIconName } from './icon-nodes';

/** Props for LucideIcon component with type-safe icon name. */
export interface LucideIconProps extends IconProps {
  readonly name: LucideIconName;
}
