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
      return <path d={String(attrs.d ?? '')} />;
    case 'circle':
      return (
        <circle cx={String(attrs.cx ?? '')} cy={String(attrs.cy ?? '')} r={String(attrs.r ?? '')} />
      );
    default: {
      const exhaustive: never = tag;
      return exhaustive;
    }
  }
};

export function LucideIcon(props: LucideIconProps): JSXElement {
  const nodes = LUCIDE_ICON_NODES[props.name];

  return (
    <Icon size={props.size} class={props.class} aria-label={props['aria-label']}>
      {nodes.map(renderNode)}
    </Icon>
  );
}
