import type { VNode } from '@shared/external/vendors';
import { getHeroiconsOutline } from '@shared/external/vendors/heroicons-react';
import { createHeroIconAdapter } from './createHeroIconAdapter';
import type { IconProps } from '../Icon';

/** Heroicons 기반 Download(ArrowDownTray) 어댑터 */
export const HeroDownload: (p: IconProps) => VNode = createHeroIconAdapter(
  () => getHeroiconsOutline().ArrowDownTrayIcon as unknown as (p: Record<string, unknown>) => VNode,
  'HeroDownload'
);
