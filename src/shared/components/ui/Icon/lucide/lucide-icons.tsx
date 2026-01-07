/**
 * @fileoverview Minimal Lucide icon renderer (data-driven)
 * @description Renders Lucide SVG nodes from icon-nodes.ts using the shared Icon wrapper.
 * Each icon is rendered as a collection of SVG path and circle elements.
 */

import { Icon } from '@shared/components/ui/Icon/Icon';
import type { JSXElement } from '@shared/external/vendors';
import { LUCIDE_ICON_NODES, type LucideIconNode } from './icon-nodes';
import type { LucideIconProps } from './LucideIcons.types';

/**
 * Renders a single Lucide icon node as an SVG element.
 *
 * Handles both path and circle node types from the icon definition.
 * Converts numeric attributes to strings for proper SVG rendering.
 * Exhaustively checks tag type to ensure all node types are handled.
 *
 * @param node - The icon node to render (path or circle)
 * @returns JSX element representing the SVG shape
 *
 * @throws Exhaustiveness check ensures all LucideIconTag types are covered
 *
 * @example
 * // Path node
 * renderNode(['path', { d: 'M18 6l-12 12' }])
 * // Returns: <path d="M18 6l-12 12" />
 *
 * @example
 * // Circle node
 * renderNode(['circle', { cx: 17, cy: 17, r: 3 }])
 * // Returns: <circle cx="17" cy="17" r="3" />
 */
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

/**
 * Icon component that renders Lucide SVG icons from predefined node definitions.
 *
 * Maps icon names to their SVG node arrays and renders them within the shared Icon wrapper.
 * Supports all standard Icon props (size, class, aria-label) plus the required icon name.
 *
 * @param props - Component props including icon name and Icon component props
 * @returns JSX element containing the rendered icon SVG
 *
 * @see LucideIconProps - Props interface
 * @see Icon.tsx - Base icon wrapper component
 * @see icon-nodes.ts - Icon definition data
 *
 * @example
 * // Simple icon with default size
 * <LucideIcon name="download" />
 *
 * @example
 * // Icon with custom size and accessibility label
 * <LucideIcon name="download" size="2em" aria-label="Download file" />
 *
 * @example
 * // Icon with CSS class for styling
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
