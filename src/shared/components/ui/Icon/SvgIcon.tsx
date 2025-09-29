/**
 * @fileoverview Lightweight factory for generating SVG icon components from static definitions.
 * Ensures icons remain tree-shake friendly and adhere to shared Icon container contract.
 */

import type { JSX } from 'solid-js';
import type { IconProps } from './Icon';
import type { SvgPathDefinition, XegIconDefinition } from '@assets/icons/xeg-icons';

import { Icon } from './Icon';

export type SvgIconProps = Omit<IconProps, 'children'>;

export type SvgIconComponent = (props?: SvgIconProps) => JSX.Element;

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
  const SvgIcon: SvgIconComponent = (props = {}) => {
    const {
      ['data-icon-name']: _ignoredIconName,
      children: _ignoredChildren,
      ...restProps
    } = (props ?? {}) as SvgIconProps & Record<string, unknown>;

    const iconProps: IconProps = {
      ...restProps,
      viewBox: definition.viewBox,
      'data-icon-name': definition.metadata,
    } as IconProps;

    return (
      <Icon {...iconProps}>
        {definition.paths.map((path, index) => (
          <path
            aria-hidden='true'
            data-icon-path={`${definition.metadata}-path-${index}`}
            {...buildPathAttributes(path)}
          />
        ))}
      </Icon>
    );
  };

  Object.defineProperty(SvgIcon, 'displayName', {
    value: displayName,
    configurable: true,
  });

  return SvgIcon;
}
