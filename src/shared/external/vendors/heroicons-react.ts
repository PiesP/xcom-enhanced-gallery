/**
 * @fileoverview Heroicons(React) getter
 * @description 외부 아이콘 라이브러리 접근은 전용 getter를 통해서만 수행합니다.
 * - 사용 아이콘만 개별 import하여 트리셰이킹을 보장합니다.
 * - Preact 환경에서는 preact/compat alias 하에서 React 컴포넌트가 동작합니다.
 */

export type HeroIconComponent = (props: Record<string, unknown>) => unknown;

/**
 * @deprecated Heroicons React wrapper는 Solid 전환과 함께 제거되었습니다.
 * 기존 코드에서는 각 Hero 아이콘 컴포넌트를 직접 import 하세요.
 */

export type HeroiconsOutline = Record<string, HeroIconComponent>;

/**
 * Outline 아이콘 집합 getter
 * 주: 정적 import된 참조를 객체로 노출해 테스트에서 모킹이 용이합니다.
 */
export function getHeroiconsOutline(): HeroiconsOutline {
  throw new Error(
    'getHeroiconsOutline()는 더 이상 지원되지 않습니다. Solid 용 hero 컴포넌트를 직접 import 하세요.'
  );
}

// 필요 시 Solid도 동일 패턴으로 제공
// export function getHeroiconsSolid() { return { ... } }
