/**
 * @fileoverview 통합 스타일 관리자
 * @description 모든 CSS 주입을 중앙화하여 순서와 우선순위를 보장
 * @version 1.0.0
 */

import { createScopedLogger } from '@shared/logging';
import { BrowserCSSUtils } from '@shared/browser/browser-css-utils';

const logger = createScopedLogger('UnifiedStyleManager');

/**
 * CSS 주입 단계별 우선순위
 */
enum StylePriority {
  // 1. 기본 설정 (가장 낮은 우선순위)
  RESET = 10,

  // 2. 디자인 토큰 (CSS 변수)
  DESIGN_TOKENS = 20,

  // 3. 기본 컴포넌트 스타일
  BASE_COMPONENTS = 30,

  // 4. 격리된 갤러리 스타일
  ISOLATED_GALLERY = 40,

  // 5. UI 컴포넌트 스타일 (Toast, Button 등)
  UI_COMPONENTS = 45,

  // 6. CSS Modules (빌드 시점)
  CSS_MODULES = 50,

  // 7. 테마별 오버라이드
  THEME_OVERRIDES = 60,

  // 8. 동적 스타일 (런타임)
  DYNAMIC_STYLES = 70,

  // 9. Z-index 시스템
  Z_INDEX_SYSTEM = 80,

  // 10. 접근성 오버라이드 (최고 우선순위)
  ACCESSIBILITY = 90,
}

/**
 * 스타일 엔트리 인터페이스
 */
interface StyleEntry {
  id: string;
  priority: StylePriority;
  css: string;
  condition?: (() => boolean) | undefined; // 조건부 적용
  injected?: boolean; // 주입 완료 여부
  element?: HTMLStyleElement; // DOM 엘리먼트 참조
}

/**
 * 통합 스타일 관리자
 */
export class UnifiedStyleManager {
  private static instance: UnifiedStyleManager | null = null;
  private readonly styleEntries = new Map<string, StyleEntry>();
  private isInitialized = false;

  private constructor() {
    logger.debug('UnifiedStyleManager 인스턴스 생성');
  }

  public static getInstance(): UnifiedStyleManager {
    if (!UnifiedStyleManager.instance) {
      UnifiedStyleManager.instance = new UnifiedStyleManager();
    }
    return UnifiedStyleManager.instance;
  }

  /**
   * 스타일 등록 (즉시 주입하지 않음)
   */
  public register(
    id: string,
    css: string,
    priority: StylePriority,
    condition?: () => boolean
  ): void {
    const entry: StyleEntry = {
      id,
      priority,
      css,
      condition,
    };

    this.styleEntries.set(id, entry);
    logger.debug(`스타일 등록: ${id} (우선순위: ${priority})`);

    // 이미 초기화된 경우 즉시 주입
    if (this.isInitialized) {
      this.injectSingleStyle(entry);
    }
  }

  /**
   * 모든 등록된 스타일을 순서대로 주입
   */
  public async injectAll(): Promise<void> {
    try {
      logger.info('모든 스타일 주입 시작');

      // 우선순위별로 정렬
      const sortedEntries = Array.from(this.styleEntries.values()).sort(
        (a, b) => a.priority - b.priority
      );

      // 순차적으로 주입
      for (const entry of sortedEntries) {
        await this.injectSingleStyle(entry);
        // 브라우저 렌더링 차단 방지
        await this.nextTick();
      }

      this.isInitialized = true;
      logger.info(`✅ 모든 스타일 주입 완료: ${sortedEntries.length}개`);
    } catch (error) {
      logger.error('❌ 스타일 주입 실패:', error);
      throw error;
    }
  }

  /**
   * 단일 스타일 주입
   */
  private async injectSingleStyle(entry: StyleEntry): Promise<void> {
    try {
      // 조건 확인
      if (entry.condition && !entry.condition()) {
        logger.debug(`조건 불만족으로 스타일 건너뛰기: ${entry.id}`);
        return;
      }

      // 기존 스타일 제거
      if (entry.element) {
        entry.element.remove();
      }

      // 새 스타일 주입
      entry.element = BrowserCSSUtils.injectCSS(entry.css, entry.id);
      logger.debug(`스타일 주입 완료: ${entry.id}`);
    } catch (error) {
      logger.error(`스타일 주입 실패: ${entry.id}`, error);
    }
  }

  /**
   * 특정 스타일 업데이트
   */
  public async updateStyle(id: string, newCSS: string): Promise<void> {
    const entry = this.styleEntries.get(id);
    if (!entry) {
      logger.warn(`존재하지 않는 스타일 ID: ${id}`);
      return;
    }

    entry.css = newCSS;

    if (this.isInitialized) {
      await this.injectSingleStyle(entry);
    }
  }

  /**
   * 스타일 제거
   */
  public removeStyle(id: string): void {
    const entry = this.styleEntries.get(id);
    if (entry?.element) {
      entry.element.remove();
    }

    this.styleEntries.delete(id);
    logger.debug(`스타일 제거: ${id}`);
  }

  /**
   * 모든 스타일 제거
   */
  public cleanup(): void {
    for (const entry of this.styleEntries.values()) {
      if (entry.element) {
        entry.element.remove();
      }
    }

    this.styleEntries.clear();
    this.isInitialized = false;
    logger.info('모든 스타일 정리 완료');
  }

  /**
   * 다음 틱까지 대기 (비차단적)
   */
  private nextTick(): Promise<void> {
    return new Promise(resolve => {
      if (typeof requestAnimationFrame !== 'undefined') {
        requestAnimationFrame(() => resolve());
      } else {
        setTimeout(() => resolve(), 0);
      }
    });
  }

  /**
   * 진단 정보
   */
  public getDiagnostics() {
    return {
      isInitialized: this.isInitialized,
      totalStyles: this.styleEntries.size,
      injectedStyles: Array.from(this.styleEntries.values())
        .filter(entry => entry.element)
        .map(entry => ({
          id: entry.id,
          priority: entry.priority,
          hasElement: !!entry.element,
        })),
    };
  }
}

// 편의를 위한 싱글톤 인스턴스 export
export const unifiedStyleManager = UnifiedStyleManager.getInstance();

// Priority enum export
export { StylePriority };
