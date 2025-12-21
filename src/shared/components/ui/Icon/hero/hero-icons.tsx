/**
 * @fileoverview Compatibility layer for the legacy HeroIcon component
 * @description Renders mapped Lucide icons while preserving the old API.
 */

import type { IconProps } from '@shared/components/ui/Icon/Icon';
import { LucideIcon } from '@shared/components/ui/Icon/lucide/lucide-icons';
import type { JSXElement } from '@shared/external/vendors';
import { HERO_TO_LUCIDE_ICON_NAME, type HeroIconName } from './icon-paths';

export interface HeroIconProps extends IconProps {
  name: HeroIconName;
}

export function HeroIcon({ name, ...rest }: HeroIconProps): JSXElement {
  const lucideName = HERO_TO_LUCIDE_ICON_NAME[name];
  return <LucideIcon name={lucideName} {...rest} />;
}
