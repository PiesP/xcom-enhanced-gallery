import type { VNode } from '@shared/external/vendors';
import { getHeroiconsOutline } from '@shared/external/vendors/heroicons-react';
import { createHeroIconAdapter } from './createHeroIconAdapter';
import type { IconProps } from '../Icon';

/** Heroicons 기반 FileZip 대체(ArchiveBoxArrowDown) 어댑터 (표준화 어댑터 버전)
 * 테스트 정규식 참고: h( Icon,
 */
export const HeroFileZip: (p: IconProps) => VNode = createHeroIconAdapter(
  () =>
    getHeroiconsOutline().ArchiveBoxArrowDownIcon as unknown as (
      p: Record<string, unknown>
    ) => VNode,
  // HeroFileZip 토큰 중복을 줄이기 위한 축약 displayName
  'HFz'
);
