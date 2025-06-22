/**
 * Media Page Type Detector
 *
 * @fileoverview 정확한 미디어 페이지 타입 감지를 위한 서비스
 * @description URL 패턴을 기반으로 미디어 페이지 타입을 감지
 * @version 1.0.0
 */

import { logger } from '@infrastructure/logging/logger';

/**
 * 미디어 페이지 타입
 */
export type MediaPageType = 'timeline' | 'tweet' | 'media' | 'profile' | 'unknown';

/**
 * URL 패턴 매처
 */
interface URLPatternMatcher {
  pattern: RegExp;
  type: MediaPageType;
  priority: number;
}

/**
 * 미디어 페이지 타입 감지기
 */
export class MediaPageTypeDetector {
  private static instance: MediaPageTypeDetector;

  /** URL 패턴 매처들 (우선순위 순) */
  private readonly urlPatterns: URLPatternMatcher[] = [
    {
      pattern: /\/photo\/\d+$/,
      type: 'media',
      priority: 1,
    },
    {
      pattern: /\/status\/\d+$/,
      type: 'tweet',
      priority: 2,
    },
    {
      pattern: /\/media$/,
      type: 'media',
      priority: 3,
    },
    {
      pattern: /^\/[^/]+\/?$/,
      type: 'profile',
      priority: 4,
    },
    {
      pattern: /\/(home|timeline)/,
      type: 'timeline',
      priority: 5,
    },
  ];

  private constructor() {}

  public static getInstance(): MediaPageTypeDetector {
    MediaPageTypeDetector.instance ??= new MediaPageTypeDetector();
    return MediaPageTypeDetector.instance;
  }

  /**
   * 현재 페이지의 미디어 타입을 감지합니다
   */
  public detect(url?: string): MediaPageType {
    const targetUrl = url || window.location.href;
    const pathname = new URL(targetUrl).pathname;

    // URL 패턴으로 타입 감지
    for (const matcher of this.urlPatterns) {
      if (matcher.pattern.test(pathname)) {
        logger.debug('Page type detected', {
          url: targetUrl,
          type: matcher.type,
          pattern: matcher.pattern.source,
        });
        return matcher.type;
      }
    }

    // 기본값
    logger.debug('Page type unknown', { url: targetUrl });
    return 'unknown';
  }

  /**
   * 특정 URL의 미디어 타입을 감지합니다
   */
  public detectFromUrl(url: string): MediaPageType {
    return this.detect(url);
  }

  /**
   * 현재 페이지가 특정 타입인지 확인합니다
   */
  public isPageType(type: MediaPageType, url?: string): boolean {
    return this.detect(url) === type;
  }

  /**
   * 현재 페이지의 미디어 타입을 감지합니다 (기존 코드 호환성)
   */
  public detectCurrentPageType(): MediaPageType {
    return this.detect();
  }
}
