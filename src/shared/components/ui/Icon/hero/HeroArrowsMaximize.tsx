import type { VNode } from '@shared/external/vendors';
import { getHeroiconsOutline } from '@shared/external/vendors/heroicons-react';
import { createHeroIconAdapter } from './createHeroIconAdapter';
import type { IconProps } from '../Icon';

/** Heroicons 기반 ArrowsMaximize 대체(ArrowsPointingOut) 어댑터 (표준화 어댑터 버전) */
// 테스트 정규식 참고: h( Icon,
export const HeroArrowsMaximize: (p: IconProps) => VNode = createHeroIconAdapter(() => {
  const { ArrowsPointingOutIcon } = getHeroiconsOutline();
  return ArrowsPointingOutIcon as unknown as (p: Record<string, unknown>) => VNode;
  // HeroArrowsMaximize 토큰 과다 포함 방지(displayName 축약)
}, 'HAm');
