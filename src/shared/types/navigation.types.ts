/**
 * @fileoverview Navigation Types
 */

/** Navigation source type - tracks what triggered the navigation */
export type NavigationSource =
  | 'button'
  | 'click'
  | 'keyboard'
  | 'programmatic'
  | 'scroll'
  | 'auto-focus';
