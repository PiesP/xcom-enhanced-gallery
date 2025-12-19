/**
 * @fileoverview Minimal Hero icon components (inline SVG paths)
 * @description Icons are defined with per-component inline path strings to enable tree-shaking.
 * @module shared/components/ui/Icon/hero
 */

import { Icon, type IconProps } from '@shared/components/ui/Icon/Icon';
import type { JSXElement } from '@shared/external/vendors';

/** Download icon */
export function HeroDownload(props: IconProps): JSXElement {
  return (
    <Icon {...props}>
      <path d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
    </Icon>
  );
}

/** ArrowSmallLeft icon */
export function HeroArrowSmallLeft(props: IconProps): JSXElement {
  return (
    <Icon {...props}>
      <path d="M19.5 12H4.5m0 0l6.75 6.75M4.5 12l6.75-6.75" />
    </Icon>
  );
}

/** ArrowSmallRight icon */
export function HeroArrowSmallRight(props: IconProps): JSXElement {
  return (
    <Icon {...props}>
      <path d="M4.5 12h15m0 0l-6.75-6.75M19.5 12l-6.75 6.75" />
    </Icon>
  );
}

/** ArrowsPointingIn icon */
export function HeroArrowsPointingIn(props: IconProps): JSXElement {
  return (
    <Icon {...props}>
      <path d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5M15 15l5.25 5.25" />
    </Icon>
  );
}

/** ArrowsPointingOut icon */
export function HeroArrowsPointingOut(props: IconProps): JSXElement {
  return (
    <Icon {...props}>
      <path d="M3.75 3.75v4.5m0-4.5h4.5M3.75 3.75L9 9m-5.25 11.25v-4.5m0 4.5h4.5M3.75 20.25L9 15m11.25-11.25h-4.5m4.5 0v4.5M20.25 3.75L15 9m5.25 11.25h-4.5m4.5 0v-4.5M20.25 20.25L15 15" />
    </Icon>
  );
}

/** ArrowsRightLeft icon */
export function HeroArrowsRightLeft(props: IconProps): JSXElement {
  return (
    <Icon {...props}>
      <path d="M7.5 21L3 16.5M3 16.5l4.5-4.5M3 16.5h13.5M16.5 3l4.5 4.5M21 7.5l-4.5 4.5M21 7.5H7.5" />
    </Icon>
  );
}

/** ArrowsUpDown icon */
export function HeroArrowsUpDown(props: IconProps): JSXElement {
  return (
    <Icon {...props}>
      <path d="M3 7.5l4.5-4.5M7.5 3l4.5 4.5M7.5 3v13.5M21 16.5l-4.5 4.5M16.5 21l-4.5-4.5M16.5 21V7.5" />
    </Icon>
  );
}

/** ArrowDownOnSquareStack icon */
export function HeroArrowDownOnSquareStack(props: IconProps): JSXElement {
  return (
    <Icon {...props}>
      <path d="M7.5 7.5h-.75a2.25 2.25 0 00-2.25 2.25v7.5a2.25 2.25 0 002.25 2.25h7.5a2.25 2.25 0 002.25-2.25v-7.5a2.25 2.25 0 00-2.25-2.25h-.75m-6 3.75l3 3m0 0l3-3m-3 3V1.5m6 9h.75a2.25 2.25 0 012.25 2.25v7.5a2.25 2.25 0 01-2.25 2.25h-7.5a2.25 2.25 0 01-2.25-2.25v-.75" />
    </Icon>
  );
}

/** ArrowLeftOnRectangle icon */
export function HeroArrowLeftOnRectangle(props: IconProps): JSXElement {
  return (
    <Icon {...props}>
      <path d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m-3.75-6l-3 3m0 0l3 3m-3-3H21.75" />
    </Icon>
  );
}

/** ChatBubbleLeftRight icon */
export function HeroChatBubbleLeftRight(props: IconProps): JSXElement {
  return (
    <Icon {...props}>
      <path d="M20.25 8.511a1.5 1.5 0 011.5 1.497v4.286a1.5 1.5 0 01-1.33 1.488c-.31.025-.62.047-.93.064v3.091L15.75 17.25c-1.353 0-2.693-.055-4.02-.163a1.5 1.5 0 01-.825-.241m9.345-8.335a4.125 4.125 0 00-.477-.095A59.924 59.924 0 0015.75 8.25c-1.355 0-2.697.056-4.023.167A1.5 1.5 0 009.75 10.608v4.286c0 .838.46 1.582 1.155 1.952m9.345-8.335V6.637a3.375 3.375 0 00-2.76-3.235A60.508 60.508 0 0011.25 3C9.135 3 7.052 3.137 5.01 3.402A3.375 3.375 0 002.25 6.637v6.225a3.375 3.375 0 002.76 3.236c.577.075 1.157.14 1.74.194V21l4.155-4.155" />
    </Icon>
  );
}

/** Cog6Tooth icon */
export function HeroCog6Tooth(props: IconProps): JSXElement {
  return (
    <Icon {...props}>
      <path d="M9.593 3.94a1.125 1.125 0 011.11-.94h2.594a1.125 1.125 0 011.11.94l.214 1.281a1.125 1.125 0 00.644.87l.22.122a1.125 1.125 0 001.076-.053l1.216-.456a1.125 1.125 0 011.369.487l1.297 2.247a1.125 1.125 0 01-.259 1.41l-1.004.827a1.125 1.125 0 00-.429.908l.001.127v.255c0 .042 0 .084-.001.127a1.125 1.125 0 00.429.908l1.004.827a1.125 1.125 0 01.259 1.41l-1.297 2.246a1.125 1.125 0 01-1.369.488l-1.216-.457a1.125 1.125 0 00-1.076-.053l-.22.122a1.125 1.125 0 00-.644.87l-.214 1.281a1.125 1.125 0 01-1.11.94H10.703a1.125 1.125 0 01-1.11-.94l-.214-1.281a1.125 1.125 0 00-.644-.87l-.22-.122a1.125 1.125 0 00-1.076.053l-1.216.457a1.125 1.125 0 01-1.369-.488L3.757 15.38a1.125 1.125 0 01.259-1.41l1.005-.827a1.125 1.125 0 00.429-.908c0-.042-.001-.084-.001-.127v-.255c0-.042 0-.084.001-.127a1.125 1.125 0 00-.429-.908L4.016 9.81a1.125 1.125 0 01-.259-1.41l1.297-2.247a1.125 1.125 0 011.369-.487l1.216.456a1.125 1.125 0 001.076.052l.22-.121a1.125 1.125 0 00.644-.871L9.593 3.94z" />
      <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </Icon>
  );
}
