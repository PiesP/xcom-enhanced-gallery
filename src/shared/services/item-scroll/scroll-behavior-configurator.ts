/**
 * Scroll Behavior Configurator
 *
 * 스크롤 옵션 정규화 및 관리
 * - behavior, block, offset, alignToCenter 옵션 결정
 * - prefers-reduced-motion 미디어 쿼리 처리
 * - 접근성 고려
 */

import { logger } from '../../logging';
import type { Accessor } from 'solid-js';
import { toAccessor } from '../../utils/solid-helpers';

export interface ScrollBehaviorConfig {
  enabled: Accessor<boolean>;
  behavior: Accessor<ScrollBehavior>;
  block: Accessor<ScrollLogicalPosition>;
  offset: Accessor<number>;
  alignToCenter: Accessor<boolean>;
  respectReducedMotion: Accessor<boolean>;
}

export interface ResolvedScrollBehavior {
  behavior: ScrollBehavior;
  block: ScrollLogicalPosition;
  alignToCenter: boolean;
  offset: number;
}

/**
 * Scroll Behavior Configurator
 * 스크롤 동작 옵션을 관리하고 결정
 */
export class ScrollBehaviorConfigurator {
  private readonly config: ScrollBehaviorConfig;
  private readonly mediaQueryCache: Map<string, boolean> = new Map();

  constructor(
    options: {
      enabled?: boolean | Accessor<boolean>;
      behavior?: ScrollBehavior | Accessor<ScrollBehavior>;
      block?: ScrollLogicalPosition | Accessor<ScrollLogicalPosition>;
      offset?: number | Accessor<number>;
      alignToCenter?: boolean | Accessor<boolean>;
      respectReducedMotion?: boolean | Accessor<boolean>;
    } = {}
  ) {
    this.config = {
      enabled: toAccessor(options.enabled ?? true),
      behavior: toAccessor(options.behavior ?? 'smooth'),
      block: toAccessor(options.block ?? 'start'),
      offset: toAccessor(options.offset ?? 0),
      alignToCenter: toAccessor(options.alignToCenter ?? false),
      respectReducedMotion: toAccessor(options.respectReducedMotion ?? true),
    };
  }

  /**
   * 최종 스크롤 동작 옵션 반환
   */
  getResolvedBehavior(): ResolvedScrollBehavior {
    const behavior = this.resolveBehavior();

    return {
      behavior,
      block: this.config.alignToCenter() ? 'center' : this.config.block(),
      alignToCenter: this.config.alignToCenter(),
      offset: this.config.offset(),
    };
  }

  /**
   * behavior 옵션 결정
   * - respectReducedMotion이 true이고 prefers-reduced-motion 설정 시 'auto'
   * - 그 외 config의 behavior 사용
   */
  private resolveBehavior(): ScrollBehavior {
    if (!this.config.respectReducedMotion()) {
      return this.config.behavior();
    }

    // prefers-reduced-motion 감지
    if (this.prefersReducedMotion()) {
      logger.debug('ScrollBehaviorConfigurator: prefers-reduced-motion 감지, auto 동작 사용');
      return 'auto';
    }

    return this.config.behavior();
  }

  /**
   * prefers-reduced-motion 미디어 쿼리 확인
   */
  private prefersReducedMotion(): boolean {
    try {
      const cacheKey = 'prefers-reduced-motion';

      // 캐시 확인
      if (this.mediaQueryCache.has(cacheKey)) {
        return this.mediaQueryCache.get(cacheKey) ?? false;
      }

      // 미디어 쿼리 실행
      if (typeof window !== 'undefined') {
        const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        const matches = mediaQuery.matches;

        // 캐시 저장
        this.mediaQueryCache.set(cacheKey, matches);

        return matches;
      }
    } catch (error) {
      logger.warn('ScrollBehaviorConfigurator: matchMedia 실패, 기본값 사용', { error });
    }

    return false;
  }

  /**
   * 개별 옵션 업데이트
   */
  update(options: Partial<ScrollBehaviorConfig>): void {
    if (options.enabled !== undefined) {
      this.config.enabled = toAccessor(options.enabled());
    }
    if (options.behavior !== undefined) {
      this.config.behavior = toAccessor(options.behavior());
    }
    if (options.block !== undefined) {
      this.config.block = toAccessor(options.block());
    }
    if (options.offset !== undefined) {
      this.config.offset = toAccessor(options.offset());
    }
    if (options.alignToCenter !== undefined) {
      this.config.alignToCenter = toAccessor(options.alignToCenter());
    }
    if (options.respectReducedMotion !== undefined) {
      this.config.respectReducedMotion = toAccessor(options.respectReducedMotion());
    }

    logger.debug('ScrollBehaviorConfigurator: 옵션 업데이트');
  }

  /**
   * 캐시 초기화
   */
  clearCache(): void {
    this.mediaQueryCache.clear();
    logger.debug('ScrollBehaviorConfigurator: 캐시 초기화');
  }
}

/**
 * ScrollBehaviorConfigurator 팩토리
 */
export function createScrollBehaviorConfigurator(options?: {
  enabled?: boolean | Accessor<boolean>;
  behavior?: ScrollBehavior | Accessor<ScrollBehavior>;
  block?: ScrollLogicalPosition | Accessor<ScrollLogicalPosition>;
  offset?: number | Accessor<number>;
  alignToCenter?: boolean | Accessor<boolean>;
  respectReducedMotion?: boolean | Accessor<boolean>;
}): ScrollBehaviorConfigurator {
  return new ScrollBehaviorConfigurator(options);
}
