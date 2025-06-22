/**
 * @fileoverview CSS Manager - 통합 CSS 주입 관리
 * @version 1.0.0
 */

import { logger } from '../logging/logger';
import {
  OptimizationEngine,
  type CSSOptimizationConfig,
  type OptimizationResult,
} from './OptimizationEngine';

/**
 * CSS 관리 설정
 */
export interface CSSManagerConfig {
  /** CSS 주입 활성화 */
  enabled: boolean;
  /** 중복 주입 방지 */
  preventDuplicates: boolean;
  /** CSS 최적화 활성화 */
  enableOptimization: boolean;
  /** 최적화 엔진 설정 */
  optimization: CSSOptimizationConfig;
}

/**
 * CSS 항목 정보
 */
interface CSSEntry {
  id: string;
  css: string;
  optimizedCSS?: string;
  element: HTMLStyleElement;
  injectedAt: number;
  optimizationResult?: OptimizationResult;
}

/**
 * 통합 CSS 관리자
 * 동적 CSS 주입, 최적화, 생명주기 관리
 */
export class CSSManager {
  private static instance: CSSManager | null = null;

  private readonly config: CSSManagerConfig;
  private readonly optimizationEngine: OptimizationEngine;
  private readonly injectedStyles = new Map<string, CSSEntry>();

  private static readonly DEFAULT_CONFIG: CSSManagerConfig = {
    enabled: true,
    preventDuplicates: true,
    enableOptimization: true,
    optimization: {
      removeDuplicates: true,
      minify: true,
      optimizeVendorPrefixes: true,
      removeUnused: false,
    },
  };

  private constructor(config: Partial<CSSManagerConfig> = {}) {
    this.config = { ...CSSManager.DEFAULT_CONFIG, ...config };
    this.optimizationEngine = new OptimizationEngine(this.config.optimization);

    logger.debug('[CSSManager] Initialized');

    if (this.config.enabled) {
      this.injectBaseStyles();
    }
  }

  /**
   * 싱글톤 인스턴스 가져오기
   */
  public static getInstance(config?: Partial<CSSManagerConfig>): CSSManager {
    CSSManager.instance ??= new CSSManager(config);
    return CSSManager.instance;
  }

  /**
   * 인스턴스 초기화 (테스트용)
   */
  public static resetInstance(): void {
    if (CSSManager.instance) {
      CSSManager.instance.cleanup();
      CSSManager.instance = null;
    }
  }

  /**
   * CSS 주입 (최적화 포함)
   */
  public inject(
    id: string,
    css: string,
    optimize: boolean = this.config.enableOptimization
  ): boolean {
    if (!this.config.enabled) {
      logger.debug(`[CSSManager] CSS injection disabled, skipping: ${id}`);
      return false;
    }

    // 중복 체크
    if (this.config.preventDuplicates && this.injectedStyles.has(id)) {
      logger.debug(`[CSSManager] CSS already injected, skipping: ${id}`);
      return false;
    }

    try {
      let finalCSS = css;
      let optimizationResult: OptimizationResult | undefined;

      // 최적화 적용
      if (optimize) {
        optimizationResult = this.optimizationEngine.optimize(css, id);
        finalCSS = this.optimizationEngine.optimizeCSS(css);
      }

      // style 요소 생성
      const styleElement = document.createElement('style');
      styleElement.id = id;
      styleElement.textContent = finalCSS;
      styleElement.setAttribute('data-injected-by', 'xeg-css-manager');

      if (optimizationResult) {
        styleElement.setAttribute('data-optimized', 'true');
        styleElement.setAttribute('data-original-size', optimizationResult.originalSize.toString());
        styleElement.setAttribute(
          'data-optimized-size',
          optimizationResult.optimizedSize.toString()
        );
      }

      // head에 추가
      document.head.appendChild(styleElement);

      // 등록
      const entry: CSSEntry = {
        id,
        css,
        element: styleElement,
        injectedAt: Date.now(),
      };

      if (optimize && finalCSS) {
        entry.optimizedCSS = finalCSS;
      }

      if (optimizationResult) {
        entry.optimizationResult = optimizationResult;
      }

      this.injectedStyles.set(id, entry);

      logger.debug(
        `[CSSManager] CSS injected: ${id}${
          optimizationResult
            ? `, optimized: ${optimizationResult.originalSize} → ${optimizationResult.optimizedSize} bytes (${optimizationResult.savingsPercentage}% saved)`
            : ''
        }`
      );
      return true;
    } catch (error) {
      logger.error(`[CSSManager] Failed to inject CSS '${id}':`, error);
      return false;
    }
  }

  /**
   * CSS 제거
   */
  public remove(id: string): boolean {
    const entry = this.injectedStyles.get(id);
    if (!entry) {
      return false;
    }

    try {
      entry.element.remove();
      this.injectedStyles.delete(id);
      logger.debug(`[CSSManager] CSS removed: ${id}`);
      return true;
    } catch (error) {
      logger.error(`[CSSManager] Failed to remove CSS '${id}':`, error);
      return false;
    }
  }

  /**
   * CSS 업데이트
   */
  public update(id: string, css: string, optimize?: boolean): boolean {
    if (this.injectedStyles.has(id)) {
      this.remove(id);
    }
    return this.inject(id, css, optimize);
  }

  /**
   * 모든 주입된 CSS 제거
   */
  public removeAll(): void {
    const entries = Array.from(this.injectedStyles.values());
    for (const entry of entries) {
      try {
        entry.element.remove();
      } catch (error) {
        logger.warn(`[CSSManager] Failed to remove CSS element: ${entry.id}`, error);
      }
    }

    this.injectedStyles.clear();
    logger.debug(`[CSSManager] All CSS removed: ${entries.length} entries`);
  }

  /**
   * 주입된 CSS 목록
   */
  public getInjectedStyles(): string[] {
    return Array.from(this.injectedStyles.keys());
  }

  /**
   * CSS가 주입되었는지 확인
   */
  public isInjected(id: string): boolean {
    return this.injectedStyles.has(id);
  }

  /**
   * CSS 엔트리 정보 조회
   */
  public getEntry(id: string): CSSEntry | undefined {
    return this.injectedStyles.get(id);
  }

  /**
   * 최적화 통계 조회
   */
  public getOptimizationStats() {
    const entries = Array.from(this.injectedStyles.values());
    const optimizedEntries = entries.filter(entry => entry.optimizationResult);

    if (optimizedEntries.length === 0) {
      return null;
    }

    const totalOriginalSize = optimizedEntries.reduce(
      (sum, entry) => sum + (entry.optimizationResult?.originalSize ?? 0),
      0
    );
    const totalOptimizedSize = optimizedEntries.reduce(
      (sum, entry) => sum + (entry.optimizationResult?.optimizedSize ?? 0),
      0
    );
    const totalSavings = totalOriginalSize - totalOptimizedSize;
    const averageSavingsPercentage =
      totalOriginalSize > 0 ? Math.round((totalSavings / totalOriginalSize) * 100) : 0;

    return {
      totalEntries: entries.length,
      optimizedEntries: optimizedEntries.length,
      totalOriginalSize,
      totalOptimizedSize,
      totalSavings,
      averageSavingsPercentage,
    };
  }

  /**
   * 임시 CSS 정리 (특정 접두사)
   */
  public clearTemporary(prefix = 'xeg-temp-'): void {
    const temporaryIds = Array.from(this.injectedStyles.keys()).filter(id => id.startsWith(prefix));

    for (const id of temporaryIds) {
      this.remove(id);
    }

    if (temporaryIds.length > 0) {
      logger.debug(`[CSSManager] Cleared temporary CSS: ${temporaryIds.length} entries`);
    }
  }

  /**
   * 설정 업데이트
   */
  public updateConfig(newConfig: Partial<CSSManagerConfig>): void {
    Object.assign(this.config, newConfig);
    logger.debug('[CSSManager] Configuration updated');
  }

  /**
   * 정리
   */
  public cleanup(): void {
    this.removeAll();
    logger.debug('[CSSManager] Cleanup completed');
  }

  // Private 메서드들

  /**
   * 기본 스타일 주입
   */
  private injectBaseStyles(): void {
    const baseCSS = `
      /* X.com Enhanced Gallery 기본 스타일 */
      .xeg-hidden {
        display: none !important;
      }
      .xeg-disabled {
        pointer-events: none !important;
        opacity: 0.5 !important;
      }
      .xeg-loading {
        cursor: wait !important;
      }
      .xeg-transition {
        transition: all 0.3s ease !important;
      }
      .xeg-no-scroll {
        overflow: hidden !important;
      }
      .xeg-blur {
        filter: blur(2px) !important;
      }
    `.trim();

    this.inject('xeg-base-styles', baseCSS, false); // 기본 스타일은 최적화하지 않음
  }
}
