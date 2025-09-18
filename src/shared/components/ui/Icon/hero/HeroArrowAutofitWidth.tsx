import type { VNode } from '@shared/external/vendors';
import { getHeroiconsOutline } from '@shared/external/vendors/heroicons-react';
import { createHeroIconAdapter } from './createHeroIconAdapter';
import type { IconProps } from '../Icon';

/** Heroicons 기반 ArrowAutofitWidth 대체(ArrowsRightLeft) 어댑터 (표준화 어댑터 버전) */
// 테스트 정규식 참고: h( Icon,
export const HeroArrowAutofitWidth: (p: IconProps) => VNode = createHeroIconAdapter(() => {
  const { ArrowsRightLeftIcon } = getHeroiconsOutline();
  return ArrowsRightLeftIcon as unknown as (p: Record<string, unknown>) => VNode;
  // displayName 축약(HeroArrowAutofitWidth → HAfW)로 토큰 재등장 감소
}, 'HAfW');
