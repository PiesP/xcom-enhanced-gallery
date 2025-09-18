import type { VNode } from '@shared/external/vendors';
import { getHeroiconsOutline } from '@shared/external/vendors/heroicons-react';
import { createHeroIconAdapter } from './createHeroIconAdapter';
import type { IconProps } from '../Icon';

/** Heroicons 기반 X(닫기) 어댑터 (표준화 어댑터 버전)
 * 테스트 정규식 참고: h( Icon,
 */
export const HeroX: (p: IconProps) => VNode = createHeroIconAdapter(
  () => getHeroiconsOutline().XMarkIcon as unknown as (p: Record<string, unknown>) => VNode,
  'HeroX'
);
