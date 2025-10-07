/**
 * @fileoverview Heroicons(React) getter (Phase 6: Simplified for Solid.js)
 * @description 외부 아이콘 라이브러리 접근은 전용 getter를 통해서만 수행합니다.
 * - 사용 아이콘만 개별 import하여 트리셰이킹을 보장합니다.
 * - Solid.js에서는 Dynamic 컴포넌트로 React 아이콘을 래핑합니다.
 */

import type { JSX } from 'solid-js';

// Outline 세트에서 필요한 아이콘만 개별 import
import {
  ChevronLeftIcon as ReactChevronLeftIcon,
  ChevronRightIcon as ReactChevronRightIcon,
  ArrowDownTrayIcon as ReactArrowDownTrayIcon,
  Cog6ToothIcon as ReactCog6ToothIcon,
  XMarkIcon as ReactXMarkIcon,
  MagnifyingGlassPlusIcon as ReactMagnifyingGlassPlusIcon,
  ArrowsRightLeftIcon as ReactArrowsRightLeftIcon,
  ArrowsUpDownIcon as ReactArrowsUpDownIcon,
  ArrowsPointingOutIcon as ReactArrowsPointingOutIcon,
  ArchiveBoxArrowDownIcon as ReactArchiveBoxArrowDownIcon,
} from '@heroicons/react/24/outline';

/**
 * Hero Icon Component type for Solid.js Dynamic
 * React 컴포넌트를 Solid의 Dynamic으로 사용하기 위한 타입
 */
export type HeroIconComponent = (props: {
  width?: string | number;
  height?: string | number;
  fill?: string;
  stroke?: string;
  strokeWidth?: string | number;
  'stroke-width'?: string | number;
  strokeLinecap?: string;
  strokeLinejoin?: string;
  class?: string;
  className?: string;
  [key: string]: unknown;
}) => JSX.Element;

export type HeroiconsOutline = {
  ChevronLeftIcon: HeroIconComponent;
  ChevronRightIcon: HeroIconComponent;
  ArrowDownTrayIcon: HeroIconComponent;
  Cog6ToothIcon: HeroIconComponent;
  XMarkIcon: HeroIconComponent;
  MagnifyingGlassPlusIcon: HeroIconComponent;
  ArrowsRightLeftIcon: HeroIconComponent;
  ArrowsUpDownIcon: HeroIconComponent;
  ArrowsPointingOutIcon: HeroIconComponent;
  ArchiveBoxArrowDownIcon: HeroIconComponent;
};

/**
 * Outline 아이콘 집합 getter (Simplified for Solid.js)
 *
 * 주의: React 아이콘들을 그대로 반환합니다.
 * Solid.js에서는 Dynamic 컴포넌트로 래핑하여 사용합니다.
 */
export function getHeroiconsOutline(): HeroiconsOutline {
  // 단순 패스스루: React 컴포넌트들을 그대로 반환
  // Solid Dynamic 컴포넌트에서 처리하도록 위임
  return {
    ChevronLeftIcon: ReactChevronLeftIcon as unknown as HeroIconComponent,
    ChevronRightIcon: ReactChevronRightIcon as unknown as HeroIconComponent,
    ArrowDownTrayIcon: ReactArrowDownTrayIcon as unknown as HeroIconComponent,
    Cog6ToothIcon: ReactCog6ToothIcon as unknown as HeroIconComponent,
    XMarkIcon: ReactXMarkIcon as unknown as HeroIconComponent,
    MagnifyingGlassPlusIcon: ReactMagnifyingGlassPlusIcon as unknown as HeroIconComponent,
    ArrowsRightLeftIcon: ReactArrowsRightLeftIcon as unknown as HeroIconComponent,
    ArrowsUpDownIcon: ReactArrowsUpDownIcon as unknown as HeroIconComponent,
    ArrowsPointingOutIcon: ReactArrowsPointingOutIcon as unknown as HeroIconComponent,
    ArchiveBoxArrowDownIcon: ReactArchiveBoxArrowDownIcon as unknown as HeroIconComponent,
  };
}
