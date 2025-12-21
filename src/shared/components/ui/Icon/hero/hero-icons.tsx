/**
 * @fileoverview Minimal Hero icon renderer (data-driven)
 * @description Single component that renders icon paths from icon-paths.ts
 */

import { Icon, type IconProps } from '@shared/components/ui/Icon/Icon';
import type { JSXElement } from '@shared/external/vendors';
import {
  type AllIconNames,
  ICON_PATHS,
  type IconName,
  MULTI_PATH_ICONS,
  type MultiPathIconName,
} from './icon-paths';

export interface HeroIconProps extends IconProps {
  name: AllIconNames;
}

export function HeroIcon({ name, ...rest }: HeroIconProps): JSXElement {
  const singlePath = ICON_PATHS[name as IconName];
  if (singlePath) {
    return (
      <Icon {...rest}>
        <path d={singlePath} />
      </Icon>
    );
  }

  const paths = MULTI_PATH_ICONS[name as MultiPathIconName];
  return (
    <Icon {...rest}>
      {paths?.map((d) => (
        <path d={d} />
      ))}
    </Icon>
  );
}
