import type { IconProps } from '@shared/components/ui/Icon/Icon';
import type { LucideIconName } from './icon-nodes';

/**
 * Props for LucideIcon component
 *
 * Extends the base Icon component props with a required icon name property.
 * The icon name is type-safe and restricted to defined Lucide icons.
 *
 * @property name - Name of the icon to render (e.g., 'download', 'chevron-left')
 *
 * @see LucideIcon - Component that renders these props
 * @see icon-nodes.ts - Icon definitions
 *
 * @example
 * <LucideIcon name="download" size="1.5em" aria-label="Download file" />
 * <LucideIcon name="chevron-right" size={24} class="text-primary" />
 */
export interface LucideIconProps extends IconProps {
  readonly name: LucideIconName;
}
