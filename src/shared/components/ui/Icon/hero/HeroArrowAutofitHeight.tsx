import type { VNode } from '@shared/external/vendors';
import { getHeroiconsOutline } from '@shared/external/vendors/heroicons-react';
import { createHeroIconAdapter } from './createHeroIconAdapter';
import type { IconProps } from '../Icon';

/** Heroicons 기반 ArrowAutofitHeight 대체(ArrowsUpDown) 어댑터 (표준화 어댑터 버전) */
// 테스트 정규식 참고: h( Icon,
export const HeroArrowAutofitHeight: (p: IconProps) => VNode = createHeroIconAdapter(() => {
  const { ArrowsUpDownIcon } = getHeroiconsOutline();
  return ArrowsUpDownIcon as unknown as (p: Record<string, unknown>) => VNode;
  // HeroArrowAutofitHeight → HAfH (휴리스틱 토큰 감소)
}, 'HAfH');
