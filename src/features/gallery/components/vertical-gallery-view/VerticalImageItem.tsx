/**
 * @fileoverview Legacy VerticalImageItem bridge for Solid implementation.
 */

import SolidVerticalImageItem from './VerticalImageItem.solid';
import type { VerticalImageItemProps } from './VerticalImageItem.types';

export type { VerticalImageItemProps } from './VerticalImageItem.types';

const VerticalImageItem = SolidVerticalImageItem as (
  props: VerticalImageItemProps
) => ReturnType<typeof SolidVerticalImageItem>;

Object.defineProperty(VerticalImageItem, 'displayName', {
  value: 'SolidVerticalImageItem',
  configurable: true,
  writable: false,
});

export { VerticalImageItem };
export default VerticalImageItem;
