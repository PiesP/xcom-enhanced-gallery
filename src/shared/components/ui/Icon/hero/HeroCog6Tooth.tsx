/**
 * @fileoverview Hero Icon - Cog 6 Tooth Component
 * @description Heroicons Cog6Tooth SVG adapter for Solid.js
 * @version 1.0.0
 * @module shared/components/ui/Icon/hero
 *
 * Detailed gear icon.
 * Used for: settings and configuration actions.
 */

import type { JSXElement } from "@shared/external/vendors";
import { Icon, type IconProps } from "@shared/components/ui/Icon/Icon";

/**
 * Cog6Tooth Icon Component
 *
 * @param {IconProps} props - Icon component props.
 * @returns {JSXElement} Solid.js SVG icon element.
 */
export function HeroCog6Tooth(props: IconProps): JSXElement {
  return (
    <Icon {...props}>
      <path d="M9.593 3.94a1.125 1.125 0 0 1 1.11-.94h2.594a1.125 1.125 0 0 1 1.11.94l.214 1.281a1.125 1.125 0 0 0 .644.87l.22.122a1.125 1.125 0 0 0 1.076-.053l1.216-.456a1.125 1.125 0 0 1 1.369.487l1.297 2.247a1.125 1.125 0 0 1-.259 1.41l-1.004.827a1.125 1.125 0 0 0-.429.908l.001.127v.255c0 .042 0 .084-.001.127a1.125 1.125 0 0 0 .429.908l1.004.827a1.125 1.125 0 0 1 .259 1.41l-1.297 2.246a1.125 1.125 0 0 1-1.369.488l-1.216-.457a1.125 1.125 0 0 0-1.076-.053l-.22.122a1.125 1.125 0 0 0-.644.87l-.214 1.281a1.125 1.125 0 0 1-1.11.94H10.703a1.125 1.125 0 0 1-1.11-.94l-.214-1.281a1.125 1.125 0 0 0-.644-.87l-.22-.122a1.125 1.125 0 0 0-1.076.053l-1.216.457a1.125 1.125 0 0 1-1.369-.488L3.757 15.38a1.125 1.125 0 0 1 .259-1.41l1.005-.827a1.125 1.125 0 0 0 .429-.908c0-.042-.001-.084-.001-.127v-.255c0-.042 0-.084.001-.127a1.125 1.125 0 0 0-.429-.908L4.016 9.81a1.125 1.125 0 0 1-.259-1.41l1.297-2.247a1.125 1.125 0 0 1 1.369-.487l1.216.456a1.125 1.125 0 0 0 1.076.052l.22-.121a1.125 1.125 0 0 0 .644-.871L9.593 3.94Z" />
      <path d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    </Icon>
  );
}
