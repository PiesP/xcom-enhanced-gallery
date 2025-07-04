/**
 * Media Cache Service
 *
 * 향상된 미디어 캐시 서비스 - Core Layer의 중앙 캐시 관리
 * Clean Architecture 원칙을 따라 비즈니스 로직을 포함
 */

import { logger } from '../../../infrastructure/logging/logger';

/**
 * 기본 캐시 항목
 */
interface CacheItem<T = unknown> {
  data: T;
  timestamp: number;
  expiresAt?: number;
}

/**
 * 향상된 미디어 캐시 서비스
 */
export class MediaCacheService {
  private static instance: MediaCacheService;
  private readonly cache = new Map<string, CacheItem>();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5분

  private constructor() {}

  public static getInstance(): MediaCacheService {
    MediaCacheService.instance ??= new MediaCacheService();
    return MediaCacheService.instance;
  }

  /**
   * 캐시에 데이터 저장
   */
  public set<T>(key: string, data: T, ttl?: number): void {
    const now = Date.now();
    const expiresAt = ttl ? now + ttl : now + this.DEFAULT_TTL;

    this.cache.set(key, {
      data,
      timestamp: now,
      expiresAt,
    });

    logger.debug('Data cached', { key, expiresAt });
  }

  /**
   * 캐시에서 데이터 조회
   */
  public get<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) {
      return null;
    }

    const now = Date.now();
    if (item.expiresAt && now > item.expiresAt) {
      this.cache.delete(key);
      logger.debug('Cache expired and removed', { key });
      return null;
    }

    return item.data as T;
  }

  /**
   * 캐시에서 데이터 삭제
   */
  public delete(key: string): boolean {
    const result = this.cache.delete(key);
    if (result) {
      logger.debug('Cache item deleted', { key });
    }
    return result;
  }

  /**
   * 캐시 존재 여부 확인
   */
  public has(key: string): boolean {
    const item = this.cache.get(key);
    if (!item) {
      return false;
    }

    const now = Date.now();
    if (item.expiresAt && now > item.expiresAt) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * 만료된 캐시 항목 정리
   */
  public cleanup(): void {
    const now = Date.now();
    let removedCount = 0;

    for (const [key, item] of this.cache.entries()) {
      if (item.expiresAt && now > item.expiresAt) {
        this.cache.delete(key);
        removedCount++;
      }
    }

    if (removedCount > 0) {
      logger.debug('Cache cleanup completed', { removedCount });
    }
  }

  /**
   * 전체 캐시 클리어
   */
  public clear(): void {
    const size = this.cache.size;
    this.cache.clear();
    logger.debug('Cache cleared', { previousSize: size });
  }

  /**
   * 캐시 상태 정보
   */
  public getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }

  /**
   * 트윗의 미디어 컬렉션 캐시 저장
   */
  public cacheTweetMedia(
    tweetId: string,
    mediaItems: unknown[],
    options: {
      userHandle?: string;
      pageType?: 'timeline' | 'tweet' | 'media' | 'profile';
      pageUrl?: string;
      clickedIndex?: number;
    } = {}
  ): void {
    const cacheKey = `tweet_${tweetId}`;
    this.set(cacheKey, { mediaItems, ...options });
  }

  /**
   * 캐시된 트윗 미디어 조회
   */
  public async getCachedTweetMedia(
    tweetId: string,
    _options: {
      pageType?: 'timeline' | 'tweet' | 'media' | 'profile';
      pageUrl?: string;
    } = {}
  ): Promise<unknown[] | null> {
    const cacheKey = `tweet_${tweetId}`;
    const cached = this.get<{ mediaItems: unknown[] }>(cacheKey);
    return cached?.mediaItems || null;
  }

  /**
   * 모든 캐시 클리어
   */
  public async clearAllCache(): Promise<void> {
    this.clear();
  }
}
