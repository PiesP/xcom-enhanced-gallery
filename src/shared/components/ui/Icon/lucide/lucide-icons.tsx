/**
 * @fileoverview Minimal Lucide icon renderer (data-driven)
 * @description Renders Lucide SVG nodes from icon-nodes.ts using the shared Icon wrapper.
 */

import { Icon, type IconProps } from '@shared/components/ui/Icon/Icon';
import type { JSXElement } from '@shared/external/vendors';
import { LUCIDE_ICON_NODES, type LucideIconName, type LucideIconNode } from './icon-nodes';

export interface LucideIconProps extends IconProps {
  name: LucideIconName;
}

const renderNode = (node: LucideIconNode): JSXElement => {
  const [tag, attrs] = node;

  switch (tag) {
    case 'path':
      return <path {...attrs} />;
    case 'circle':
      return <circle {...attrs} />;
    default: {
      const exhaustive: never = tag;
      return exhaustive;
    }
  }
};

export function LucideIcon({ name, ...rest }: LucideIconProps): JSXElement {
  const nodes = LUCIDE_ICON_NODES[name];

  return <Icon {...rest}>{nodes.map(renderNode)}</Icon>;
}
