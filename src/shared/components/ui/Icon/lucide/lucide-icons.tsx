/** Renders Lucide icons from data-driven SVG node definitions. */

import { Icon } from '@shared/components/ui/Icon/Icon';
import type { JSXElement } from '@shared/external/vendors';
import { LUCIDE_ICON_NODES, type LucideIconNode } from './icon-nodes';
import type { LucideIconProps } from './LucideIcons.types';

/** Renders a Lucide icon node (path or circle) as SVG element. */
const renderNode = (node: LucideIconNode): JSXElement => {
  const [tag, attrs] = node;

  switch (tag) {
    case 'path':
      return <path d={attrs.d as string} />;
    case 'circle':
      return <circle cx={attrs.cx as string} cy={attrs.cy as string} r={attrs.r as string} />;
    default: {
      const exhaustive: never = tag;
      return exhaustive;
    }
  }
};

/**
 * Renders a Lucide SVG icon from predefined node definitions.
 * Maps icon names to SVG nodes and renders them via the shared Icon wrapper.
 *
 * @param props - Component props with icon name and Icon component options
 * @returns JSX element containing the rendered icon SVG
 *
 * @example
 * <LucideIcon name="download" />
 * <LucideIcon name="download" size="2em" aria-label="Download file" />
 * <LucideIcon name="chevron-right" size={24} class="text-primary" />
 */
export function LucideIcon(props: LucideIconProps): JSXElement {
  const nodes = LUCIDE_ICON_NODES[props.name];

  return (
    <Icon size={props.size} class={props.class} aria-label={props['aria-label']}>
      {nodes.map(renderNode)}
    </Icon>
  );
}
