/**
 * @fileoverview CSS Optimization Engine
 * @version 1.0.0
 */

import { logger } from '../logging/logger';

/**
 * CSS 최적화 설정
 */
export interface CSSOptimizationConfig {
  /** 중복 CSS 제거 */
  removeDuplicates: boolean;
  /** 불필요한 공백 제거 */
  minify: boolean;
  /** vendor prefix 최적화 */
  optimizeVendorPrefixes: boolean;
  /** 사용하지 않는 CSS 제거 */
  removeUnused: boolean;
}

/**
 * CSS 최적화 결과
 */
export interface OptimizationResult {
  originalSize: number;
  optimizedSize: number;
  savings: number;
  savingsPercentage: number;
  optimizations: string[];
}

/**
 * CSS 최적화 엔진
 * CSS 코드를 최적화하고 압축합니다.
 */
export class OptimizationEngine {
  private readonly config: CSSOptimizationConfig;

  private static readonly DEFAULT_CONFIG: CSSOptimizationConfig = {
    removeDuplicates: true,
    minify: true,
    optimizeVendorPrefixes: true,
    removeUnused: false, // 기본적으로는 보수적 접근
  };

  constructor(config: Partial<CSSOptimizationConfig> = {}) {
    this.config = { ...OptimizationEngine.DEFAULT_CONFIG, ...config };
  }

  /**
   * CSS를 최적화합니다.
   */
  public optimize(css: string, id: string = 'unknown'): OptimizationResult {
    const originalSize = css.length;
    const optimizations: string[] = [];
    let optimizedCSS = css;

    try {
      // 1. 중복 규칙 제거
      if (this.config.removeDuplicates) {
        const beforeSize = optimizedCSS.length;
        optimizedCSS = this.removeDuplicateRules(optimizedCSS);
        if (optimizedCSS.length < beforeSize) {
          optimizations.push('duplicate-rules-removed');
        }
      }

      // 2. 미니파이
      if (this.config.minify) {
        const beforeSize = optimizedCSS.length;
        optimizedCSS = this.minify(optimizedCSS);
        if (optimizedCSS.length < beforeSize) {
          optimizations.push('minified');
        }
      }

      // 3. vendor prefix 최적화
      if (this.config.optimizeVendorPrefixes) {
        const beforeSize = optimizedCSS.length;
        optimizedCSS = this.optimizeVendorPrefixes(optimizedCSS);
        if (optimizedCSS.length < beforeSize) {
          optimizations.push('vendor-prefixes-optimized');
        }
      }

      const optimizedSize = optimizedCSS.length;
      const savings = originalSize - optimizedSize;
      const savingsPercentage = originalSize > 0 ? Math.round((savings / originalSize) * 100) : 0;

      const result: OptimizationResult = {
        originalSize,
        optimizedSize,
        savings,
        savingsPercentage,
        optimizations,
      };

      logger.debug(
        `[OptimizationEngine] CSS optimized: ${id}, saved ${savings} bytes (${savingsPercentage}%)`
      );
      return result;
    } catch (error) {
      logger.error(`[OptimizationEngine] Failed to optimize CSS: ${id}`, error);

      return {
        originalSize,
        optimizedSize: originalSize,
        savings: 0,
        savingsPercentage: 0,
        optimizations: [],
      };
    }
  }

  /**
   * CSS 최적화만 반환 (문자열)
   */
  public optimizeCSS(css: string): string {
    return this.optimize(css).optimizations.length > 0 ? this.applyAllOptimizations(css) : css;
  }

  // Private 메서드들

  /**
   * 중복 CSS 규칙 제거
   */
  private removeDuplicateRules(css: string): string {
    // 간단한 중복 제거 - 동일한 선택자와 속성을 찾아서 마지막 것만 유지
    const rules = css.split('}').filter(rule => rule.trim());
    const uniqueRules = new Map<string, string>();

    for (const rule of rules) {
      const trimmed = rule.trim();
      if (!trimmed) continue;

      // 선택자와 속성 분리
      const colonIndex = trimmed.indexOf('{');
      if (colonIndex === -1) continue;

      const selector = trimmed.substring(0, colonIndex).trim();
      const properties = trimmed.substring(colonIndex);

      // 동일한 선택자가 있으면 덮어쓰기 (나중 것이 우선)
      uniqueRules.set(selector, properties);
    }

    // 재조립
    return Array.from(uniqueRules.entries())
      .map(([selector, properties]) => `${selector}${properties}}`)
      .join('\\n');
  }

  /**
   * CSS 미니파이
   */
  private minify(css: string): string {
    return (
      css
        // 주석 제거
        .replace(/\/\*[\s\S]*?\*\//g, '')
        // 불필요한 공백 제거
        .replace(/\s+/g, ' ')
        // 세미콜론 앞 공백 제거
        .replace(/\s*;\s*/g, ';')
        // 중괄호 앞뒤 공백 제거
        .replace(/\s*{\s*/g, '{')
        .replace(/\s*}\s*/g, '}')
        // 콜론 앞뒤 공백 제거
        .replace(/\s*:\s*/g, ':')
        // 쉼표 뒤 불필요한 공백 제거
        .replace(/,\s+/g, ',')
        // 시작과 끝 공백 제거
        .trim()
    );
  }

  /**
   * Vendor prefix 최적화
   */
  private optimizeVendorPrefixes(css: string): string {
    // 현대 브라우저에서 불필요한 vendor prefix 제거
    const unnecessaryPrefixes = [
      /-webkit-border-radius/g,
      /-moz-border-radius/g,
      /-webkit-box-shadow/g,
      /-moz-box-shadow/g,
      // 더 많은 불필요한 prefix들 추가 가능
    ];

    let optimized = css;
    for (const prefix of unnecessaryPrefixes) {
      optimized = optimized.replace(prefix, '');
    }

    return optimized;
  }

  /**
   * 모든 최적화 적용
   */
  private applyAllOptimizations(css: string): string {
    let result = css;

    if (this.config.removeDuplicates) {
      result = this.removeDuplicateRules(result);
    }

    if (this.config.minify) {
      result = this.minify(result);
    }

    if (this.config.optimizeVendorPrefixes) {
      result = this.optimizeVendorPrefixes(result);
    }

    return result;
  }
}
