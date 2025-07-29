/**
 * TanStack Query를 활용한 데이터 페칭 서비스
 *
 * @description 외부 라이브러리 활용으로 코드 복잡도를 낮추고 캐싱/로딩 상태 관리를 간편화
 */

import { getTanStackQuery } from '@shared/external/vendors';
import { logger } from '@shared/logging';
import type { MediaItem } from '@shared/types/core/media.types';

export interface QueryConfig {
  staleTime?: number;
  cacheTime?: number;
  retryCount?: number;
  retryDelay?: number;
}

export interface QueryResult<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<QueryResult<T>>;
}

/**
 * TanStack Query를 활용한 단순화된 데이터 페칭 서비스
 *
 * @description 복잡한 캐싱과 데이터 페칭 로직을 TanStack Query로 위임하여 코드 단순화
 */
export class QueryService {
  private static instance: QueryService | null = null;
  private queryClient: unknown = null;
  private readonly cache = new Map<string, unknown>();

  private constructor() {
    this.initializeQueryClient();
  }

  public static getInstance(): QueryService {
    QueryService.instance ??= new QueryService();
    return QueryService.instance;
  }

  /**
   * Query Client 초기화
   */
  private async initializeQueryClient(): Promise<void> {
    try {
      const { QueryClient, QueryCache } = await getTanStackQuery();

      this.queryClient = new QueryClient({
        queryCache: new QueryCache({
          onError: (error: Error) => {
            logger.warn('Query 캐시 오류:', error);
          },
        }),
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5분
            gcTime: 10 * 60 * 1000, // 10분 (구 cacheTime)
            retry: 3,
            retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
          },
        },
      });

      logger.debug('QueryService 초기화 완료');
    } catch (error) {
      logger.error('QueryService 초기화 실패:', error);
      // 폴백으로 간단한 캐시 시스템 사용
      this.setupFallbackCache();
    }
  }

  /**
   * 폴백 캐시 시스템 설정
   */
  private setupFallbackCache(): void {
    logger.info('폴백 캐시 시스템 활성화');
    // 간단한 메모리 캐시로 폴백
  }

  /**
   * 트윗 미디어 데이터 페칭 (캐시 지원)
   */
  public async fetchTweetMedia(
    tweetId: string,
    config: QueryConfig = {}
  ): Promise<QueryResult<MediaItem[]>> {
    const queryKey = `tweet-media-${tweetId}`;

    try {
      if (this.queryClient) {
        // TanStack Query 사용
        const result = await (
          this.queryClient as {
            fetchQuery: (options: Record<string, unknown>) => Promise<MediaItem[]>;
          }
        ).fetchQuery({
          queryKey: [queryKey],
          queryFn: () => this.extractTweetMedia(tweetId),
          staleTime: config.staleTime ?? 5 * 60 * 1000,
          gcTime: config.cacheTime ?? 10 * 60 * 1000,
        });

        return {
          data: result,
          isLoading: false,
          error: null,
          refetch: () => this.refetchTweetMedia(tweetId),
        };
      } else {
        // 폴백: 직접 페칭
        return this.fallbackFetch(queryKey, () => this.extractTweetMedia(tweetId));
      }
    } catch (error) {
      logger.error(`트윗 미디어 페칭 실패: ${tweetId}`, error);
      return {
        data: null,
        isLoading: false,
        error: error as Error,
        refetch: () => this.refetchTweetMedia(tweetId),
      };
    }
  }

  /**
   * 실제 트윗 미디어 추출 로직
   */
  private async extractTweetMedia(tweetId: string): Promise<MediaItem[]> {
    // 기존 TwitterAPI 서비스를 활용하되, 에러 처리 간소화
    try {
      // ServiceManager를 통해 기존 MediaExtractionService 사용
      const { ServiceManager } = await import('@shared/services/ServiceManager');
      const serviceManager = ServiceManager.getInstance();
      const mediaService = serviceManager.tryGet('media.extraction') as {
        extractFromTweetId?: (tweetId: string) => Promise<MediaItem[]>;
      } | null;

      if (mediaService?.extractFromTweetId) {
        return await mediaService.extractFromTweetId(tweetId);
      } // 폴백: 기본 추출 로직
      return this.basicMediaExtraction(tweetId);
    } catch (error) {
      logger.warn(`미디어 추출 실패, 폴백 사용: ${tweetId}`, error);
      return [];
    }
  }

  /**
   * 기본 미디어 추출 (폴백)
   */
  private async basicMediaExtraction(tweetId: string): Promise<MediaItem[]> {
    // 단순화된 DOM 기반 추출
    const mediaItems: MediaItem[] = [];

    try {
      const tweetElement = document.querySelector(`[data-testid="tweet"][href*="${tweetId}"]`);
      if (!tweetElement) {
        return mediaItems;
      }

      // 이미지 추출
      const images = tweetElement.querySelectorAll('img[src*="pbs.twimg.com"]');
      images.forEach((img, index) => {
        const src = img.getAttribute('src');
        if (src) {
          const imgElement = img as HTMLImageElement;
          mediaItems.push({
            id: `${tweetId}-img-${index}`,
            type: 'image',
            url: src,
            originalUrl: src.replace(/&name=\w+/, '&name=orig'),
            filename: `${tweetId}_image_${index + 1}.jpg`,
            metadata: {
              width: imgElement.naturalWidth || 0,
              height: imgElement.naturalHeight || 0,
            },
          });
        }
      });

      // 비디오 추출
      const videos = tweetElement.querySelectorAll('video[src]');
      videos.forEach((video, index) => {
        const src = video.getAttribute('src');
        if (src) {
          const videoElement = video as HTMLVideoElement;
          mediaItems.push({
            id: `${tweetId}-video-${index}`,
            type: 'video',
            url: src,
            originalUrl: src,
            filename: `${tweetId}_video_${index + 1}.mp4`,
            metadata: {
              width: videoElement.videoWidth || 0,
              height: videoElement.videoHeight || 0,
              duration: videoElement.duration || 0,
            },
          });
        }
      });
    } catch (error) {
      logger.warn('기본 미디어 추출 오류:', error);
    }

    return mediaItems;
  }

  /**
   * 폴백 페칭 시스템
   */
  private async fallbackFetch<T>(key: string, fetcher: () => Promise<T>): Promise<QueryResult<T>> {
    const cached = this.cache.get(key) as { data: T; timestamp: number } | undefined;
    const now = Date.now();

    // 캐시가 있고 5분 이내면 사용
    if (cached && now - cached.timestamp < 5 * 60 * 1000) {
      return {
        data: cached.data,
        isLoading: false,
        error: null,
        refetch: () => this.fallbackFetch(key, fetcher),
      };
    }

    try {
      const data = await fetcher();
      this.cache.set(key, { data, timestamp: now });

      return {
        data,
        isLoading: false,
        error: null,
        refetch: () => this.fallbackFetch(key, fetcher),
      };
    } catch (error) {
      return {
        data: null,
        isLoading: false,
        error: error as Error,
        refetch: () => this.fallbackFetch(key, fetcher),
      };
    }
  }

  /**
   * 트윗 미디어 다시 가져오기
   */
  public async refetchTweetMedia(tweetId: string): Promise<QueryResult<MediaItem[]>> {
    return this.fetchTweetMedia(tweetId);
  }

  /**
   * 캐시 무효화
   */
  public invalidateCache(pattern?: string): void {
    if (this.queryClient) {
      if (pattern) {
        (
          this.queryClient as {
            invalidateQueries: (options: Record<string, unknown>) => void;
          }
        ).invalidateQueries({
          predicate: (query: { queryKey: readonly unknown[] }) =>
            String(query.queryKey?.[0]).includes(pattern),
        });
      } else {
        (
          this.queryClient as {
            invalidateQueries: () => void;
          }
        ).invalidateQueries();
      }
    } else {
      if (pattern) {
        for (const key of this.cache.keys()) {
          if (key.includes(pattern)) {
            this.cache.delete(key);
          }
        }
      } else {
        this.cache.clear();
      }
    }
  }

  /**
   * 서비스 정리
   */
  public cleanup(): void {
    this.cache.clear();
    if (this.queryClient) {
      (this.queryClient as { clear: () => void }).clear();
    }
    logger.debug('QueryService 정리 완료');
  }
}
