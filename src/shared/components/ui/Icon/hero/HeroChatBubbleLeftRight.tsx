/**
 * @fileoverview Hero Icon - Chat Bubble Left Right Component
 * @description Heroicons ChatBubbleLeftRight SVG adapter for Solid.js
 * @version 1.0.0
 * @module shared/components/ui/Icon/hero
 *
 * Dual speech bubbles icon.
 * Used for: comments, conversations, tweet text.
 */

import { Icon, type IconProps } from '@shared/components/ui/Icon/Icon';
import type { JSXElement } from '@shared/external/vendors';

/**
 * ChatBubbleLeftRight Icon Component
 *
 * @param {IconProps} props - Icon component props.
 * @returns {JSXElement} Solid.js SVG icon element.
 */
export function HeroChatBubbleLeftRight(props: IconProps): JSXElement {
  return (
    <Icon {...props}>
      <path d="M20.25 8.511a1.5 1.5 0 0 1 1.5 1.497v4.286a1.5 1.5 0 0 1-1.33 1.488c-.31.025-.62.047-.93.064v3.091L15.75 17.25c-1.353 0-2.693-.055-4.02-.163a1.5 1.5 0 0 1-.825-.241m9.345-8.335a4.125 4.125 0 0 0-.477-.095A59.924 59.924 0 0 0 15.75 8.25c-1.355 0-2.697.056-4.023.167A1.5 1.5 0 0 0 9.75 10.608v4.286c0 .838.46 1.582 1.155 1.952m9.345-8.335V6.637a3.375 3.375 0 0 0-2.76-3.235A60.508 60.508 0 0 0 11.25 3C9.135 3 7.052 3.137 5.01 3.402A3.375 3.375 0 0 0 2.25 6.637v6.225a3.375 3.375 0 0 0 2.76 3.236c.577.075 1.157.14 1.74.194V21l4.155-4.155" />
    </Icon>
  );
}
