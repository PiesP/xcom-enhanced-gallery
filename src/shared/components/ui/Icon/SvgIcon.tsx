/**
 * @fileoverview Lightweight factory for generating SVG icon components from static definitions.
 * Ensures icons remain tree-shake friendly and adhere to shared Icon container contract.
 */

import type { VNode } from '@shared/external/vendors';
import type { IconProps } from './Icon';
import type { SvgPathDefinition, XegIconDefinition } from '@assets/icons/xeg-icons';

import { getPreact } from '@shared/external/vendors';
import { Icon } from './Icon';

export type SvgIconProps = Omit<IconProps, 'children'>;

export type SvgIconComponent = (props: SvgIconProps) => VNode;

function buildPathAttributes(pathDefinition: SvgPathDefinition): Record<string, unknown> {
  const attributes: Record<string, unknown> = {
    d: pathDefinition.d,
  };

  if (typeof pathDefinition.fill === 'string') {
    attributes.fill = pathDefinition.fill;
  }
  if (typeof pathDefinition.strokeLinecap === 'string') {
    attributes['stroke-linecap'] = pathDefinition.strokeLinecap;
  }
  if (typeof pathDefinition.strokeLinejoin === 'string') {
    attributes['stroke-linejoin'] = pathDefinition.strokeLinejoin;
  }
  if (typeof pathDefinition.strokeMiterlimit === 'number') {
    attributes['stroke-miterlimit'] = pathDefinition.strokeMiterlimit;
  }

  return attributes;
}

export function createSvgIcon(
  displayName: string,
  definition: XegIconDefinition
): SvgIconComponent {
  const { h } = getPreact();

  const SvgIcon: SvgIconComponent = props => {
    const {
      ['data-icon-name']: _ignoredIconName,
      children: _ignoredChildren,
      ...restProps
    } = props as SvgIconProps & Record<string, unknown>;

    const iconProps: Record<string, unknown> = {
      ...restProps,
      viewBox: definition.viewBox,
      'data-icon-name': definition.metadata,
    };

    const pathNodes = definition.paths.map((path, index) =>
      h('path', {
        key: `${definition.metadata}-path-${index}`,
        ...buildPathAttributes(path),
      })
    );

    return h(Icon, iconProps, pathNodes);
  };

  Object.defineProperty(SvgIcon, 'displayName', {
    value: displayName,
    configurable: true,
  });

  return SvgIcon;
}
