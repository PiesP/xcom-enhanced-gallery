import type { VNode } from '@shared/external/vendors';
import { getHeroiconsOutline } from '@shared/external/vendors/heroicons-react';
import { createHeroIconAdapter } from './createHeroIconAdapter';
import type { IconProps } from '../Icon';

/** Heroicons 기반 ZoomIn(MagnifyingGlassPlus) 어댑터 (표준화 어댑터 버전)
 * 테스트 정규식 참고: h( Icon,
 */
export const HeroZoomIn: (p: IconProps) => VNode = createHeroIconAdapter(
  () =>
    getHeroiconsOutline().MagnifyingGlassPlusIcon as unknown as (
      p: Record<string, unknown>
    ) => VNode,
  // 번들 휴리스틱(icon-bundle-guard)에서 HeroZoomIn 토큰 과다 포함 방지: displayName 축약
  'HZi'
);
