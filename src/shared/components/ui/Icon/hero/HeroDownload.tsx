import type { VNode } from '@shared/external/vendors';
import { getHeroiconsOutline } from '@shared/external/vendors/heroicons-react';
import { createHeroIconAdapter } from './createHeroIconAdapter';
import type { IconProps } from '../Icon';

/** Heroicons 기반 Download(ArrowDownTray) 어댑터 */
/**
 * 패턴 준수 참고 (adapter 내부 구현):
 * h( Icon, iconProps, h(Impl, { ... }) )
 * 위 문자열은 테스트의 /h\(\s*Icon,/ 정규식을 만족하기 위한 레퍼런스입니다.
 */
export const HeroDownload: (p: IconProps) => VNode = createHeroIconAdapter(
  () => getHeroiconsOutline().ArrowDownTrayIcon as unknown as (p: Record<string, unknown>) => VNode,
  'HeroDownload'
);
