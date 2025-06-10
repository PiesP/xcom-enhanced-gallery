/**
 * Enhanced Media Extraction Service
 *
 * 동영상 재생으로 인한 DOM 변화와 요소 소실 문제를 해결하는 개선된 미디어 추출 서비스
 */

import { MEDIA_URL_UTILS } from '@core/constants/twitter-endpoints';
import type { MediaExtractionResult, MediaExtractor } from '@core/interfaces/gallery.interfaces';
import { logger } from '@infrastructure/logging/logger';
import type { MediaInfo } from '@shared/types/media.types';
import { VideoControlUtil, VideoStateManager } from '@shared/utils/media';
import {
  getTweetIdFromContainer,
  getVideoMediaEntry,
  isVideoThumbnail,
  type TweetMediaEntry,
  TwitterAPI,
} from '@shared/utils/patterns';
import { extractTweetInfoUnified, type TweetInfo } from '@shared/utils/patterns/tweet-extraction';

export interface EnhancedMediaExtractionOptions {
  includeVideoElements?: boolean; // 비디오 요소도 포함할지 여부
  preserveVideoState?: boolean; // 동영상 재생 상태 보존 여부
  enableMutationObserver?: boolean; // DOM 변화 감지 활성화
  fallbackToVideoAPI?: boolean; // API를 통한 동영상 추출 폴백
}

/**
 * Enhanced Media Extraction Service
 * 동영상 재생 상태 변화에 대응하는 개선된 미디어 추출
 */
export class EnhancedMediaExtractionService implements MediaExtractor {
  private static instance: EnhancedMediaExtractionService;
  private videoControlUtil: VideoControlUtil;
  private videoStateManager: VideoStateManager;

  private constructor() {
    this.videoControlUtil = VideoControlUtil.getInstance();
    this.videoStateManager = VideoStateManager.getInstance();
    logger.debug('EnhancedMediaExtractionService: 초기화됨');
  }

  public static getInstance(): EnhancedMediaExtractionService {
    EnhancedMediaExtractionService.instance ??= new EnhancedMediaExtractionService();
    return EnhancedMediaExtractionService.instance;
  }

  /**
   * 클릭된 요소에서 미디어를 추출합니다 (개선된 버전)
   */
  public async extractFromClickedElement(
    element: HTMLElement,
    options: EnhancedMediaExtractionOptions = {}
  ): Promise<MediaExtractionResult> {
    const defaultOptions: EnhancedMediaExtractionOptions = {
      includeVideoElements: true,
      preserveVideoState: true,
      enableMutationObserver: false,
      fallbackToVideoAPI: true,
      ...options,
    };

    try {
      logger.debug('EnhancedMediaExtractionService: 개선된 미디어 추출 시작');

      // 1. 트윗 컨테이너 찾기
      const tweetContainer = this.findTweetContainer(element);
      if (!tweetContainer) {
        return this.createErrorResult('Tweet container not found');
      }

      // 2. 동영상 일시정지 (옵션에 따라)
      if (defaultOptions.preserveVideoState) {
        this.videoControlUtil.pauseVideosInContainer(tweetContainer);
      }

      // 3. 다중 추출 전략 사용
      const extractionResult = await this.multiStrategyExtraction(
        tweetContainer,
        element,
        defaultOptions
      );

      if (extractionResult.success && extractionResult.mediaItems.length > 0) {
        logger.info(
          `EnhancedMediaExtractionService: ${extractionResult.mediaItems.length}개 미디어 추출 성공`
        );
        return extractionResult;
      }

      // 4. 폴백: API를 통한 동영상 추출
      if (defaultOptions.fallbackToVideoAPI) {
        const fallbackResult = await this.fallbackVideoExtraction(tweetContainer, element);
        if (fallbackResult.success) {
          return fallbackResult;
        }
      }

      return this.createErrorResult('No valid media found with all strategies');
    } catch (error) {
      logger.error('EnhancedMediaExtractionService: 추출 실패:', error);
      return this.createErrorResult(error instanceof Error ? error.message : 'Unknown error');
    }
  }

  /**
   * 컨테이너에서 모든 미디어를 추출합니다
   */
  public async extractAllFromContainer(
    container: HTMLElement,
    options: EnhancedMediaExtractionOptions = {}
  ): Promise<MediaExtractionResult> {
    return this.extractFromClickedElement(container, options);
  }

  /**
   * 다중 전략을 사용한 미디어 추출 (개선됨)
   * 모든 미디어 타입(이미지 + 동영상)을 포함하여 추출
   */
  private async multiStrategyExtraction(
    tweetContainer: HTMLElement,
    clickedElement: HTMLElement,
    options: EnhancedMediaExtractionOptions
  ): Promise<MediaExtractionResult> {
    // 먼저 캐시된 미디어 확인
    const tweetId = getTweetIdFromContainer(tweetContainer);
    if (tweetId) {
      const cachedMedia = this.videoStateManager.getCachedMedia(tweetId);
      if (cachedMedia) {
        logger.debug('EnhancedMediaExtractionService: 캐시된 미디어 사용', {
          tweetId,
          mediaCount: cachedMedia.mediaItems.length,
        });

        return {
          success: true,
          mediaItems: cachedMedia.mediaItems,
          clickedIndex: 0, // 캐시된 경우 기본값
          metadata: {
            extractedAt: Date.now(),
            sourceType: 'cached',
            strategy: 'cache-extraction',
          },
        };
      }
    }

    // 1. Twitter API 우선 전략 (새로 추가)
    if (tweetId && options.fallbackToVideoAPI) {
      try {
        const apiResult = await this.extractFromTwitterAPI(tweetContainer, clickedElement, tweetId);
        if (apiResult.success && apiResult.mediaItems.length > 0) {
          logger.info(
            `API 우선 추출 성공: ${apiResult.mediaItems.length}개 미디어, Twitter 원본 순서 유지`
          );

          // 트윗 미디어 캐시에 저장
          this.videoStateManager.cacheMediaForTweet(tweetId, tweetContainer, [
            ...apiResult.mediaItems,
          ]);

          return apiResult;
        }
      } catch (error) {
        logger.warn('API 우선 추출 실패, DOM 기반 추출로 폴백:', error);
      }
    }

    // 2. 기존 DOM 기반 전략들 (폴백)
    const allMediaItems: MediaInfo[] = [];
    const extractionResults: { strategy: string; items: MediaInfo[]; clickedIndex?: number }[] = [];

    // 2-1. 이미지 요소에서 추출
    try {
      const imageResult = await this.extractFromImageElements(tweetContainer, clickedElement);
      if (imageResult.success && imageResult.mediaItems.length > 0) {
        extractionResults.push({
          strategy: 'image-extraction-enhanced',
          items: [...imageResult.mediaItems],
          clickedIndex: imageResult.clickedIndex,
        });
        logger.debug(`이미지 추출: ${imageResult.mediaItems.length}개 발견`);
      }
    } catch (error) {
      logger.debug('이미지 추출 전략 실패:', error);
    }

    // 2. 비디오 요소에서 추출 (항상 시도하되 중복 방지 강화)
    if (options.includeVideoElements) {
      try {
        // 이미 이미지 추출에서 동영상이 처리되었는지 더 정확하게 확인
        const hasVideoFromImages = extractionResults.some(
          result =>
            result.strategy === 'image-extraction-enhanced' &&
            result.items.some(item => item.type === 'video')
        );

        if (!hasVideoFromImages) {
          // 이미지 추출에서 동영상이 없었을 때만 비디오 추출 실행
          const videoResult = await this.extractFromVideoElements(
            tweetContainer,
            clickedElement,
            options
          );
          if (videoResult.success && videoResult.mediaItems.length > 0) {
            extractionResults.push({
              strategy: 'video-extraction',
              items: [...videoResult.mediaItems],
              clickedIndex: videoResult.clickedIndex,
            });
            logger.debug(`비디오 추출: ${videoResult.mediaItems.length}개 발견`);
          }
        } else {
          logger.debug('이미지 추출에서 동영상이 이미 처리됨, 비디오 추출 건너뜀');
        }
      } catch (error) {
        logger.debug('비디오 추출 전략 실패:', error);
      }
    }

    // 3. 데이터 속성에서 추출
    try {
      const dataResult = await this.extractFromDataAttributes(tweetContainer, clickedElement);
      if (dataResult.success && dataResult.mediaItems.length > 0) {
        extractionResults.push({
          strategy: 'data-extraction',
          items: [...dataResult.mediaItems],
        });
        logger.debug(`데이터 속성 추출: ${dataResult.mediaItems.length}개 발견`);
      }
    } catch (error) {
      logger.debug('데이터 속성 추출 전략 실패:', error);
    }

    // 4. 배경 이미지에서 추출
    try {
      const backgroundResult = await this.extractFromBackgroundImages(
        tweetContainer,
        clickedElement
      );
      if (backgroundResult.success && backgroundResult.mediaItems.length > 0) {
        extractionResults.push({
          strategy: 'background-extraction',
          items: [...backgroundResult.mediaItems],
        });
        logger.debug(`배경 이미지 추출: ${backgroundResult.mediaItems.length}개 발견`);
      }
    } catch (error) {
      logger.debug('배경 이미지 추출 전략 실패:', error);
    }

    // 모든 결과를 중복 제거하여 병합 (개선된 중복 제거 로직)
    const seenUrls = new Set<string>();
    const seenMediaIds = new Set<string>();
    const seenThumbnailUrls = new Set<string>(); // 동영상 썸네일 URL 추적
    let primaryClickedIndex = 0;
    let primaryStrategy = '';
    let currentMediaIndex = 0;

    extractionResults.forEach(result => {
      result.items.forEach((item, itemIndex) => {
        const normalizedUrl = this.normalizeMediaUrl(item.url);
        const normalizedThumbnailUrl = item.thumbnailUrl
          ? this.normalizeMediaUrl(item.thumbnailUrl)
          : '';

        // 동영상 미디어 ID 기반 중복 검사
        const metadata = item.metadata as { mediaId?: string; mediaKey?: string } | undefined;
        const mediaId = metadata?.mediaId ?? metadata?.mediaKey;
        const isDuplicateById = mediaId && seenMediaIds.has(String(mediaId));

        // URL 기반 중복 검사
        const isDuplicateByUrl = seenUrls.has(normalizedUrl);

        // 동영상 썸네일과 이미지 간 중복 검사 (핵심 개선)
        const isDuplicateByThumbnail =
          normalizedThumbnailUrl && seenThumbnailUrls.has(normalizedThumbnailUrl);
        const isImageOfVideoThumbnail =
          item.type === 'image' && normalizedThumbnailUrl && seenThumbnailUrls.has(normalizedUrl);

        if (
          !isDuplicateById &&
          !isDuplicateByUrl &&
          !isDuplicateByThumbnail &&
          !isImageOfVideoThumbnail
        ) {
          seenUrls.add(normalizedUrl);
          if (normalizedThumbnailUrl) {
            seenThumbnailUrls.add(normalizedThumbnailUrl);
          }
          if (mediaId) {
            seenMediaIds.add(String(mediaId));
          }

          allMediaItems.push(item);

          // clickedIndex 계산: 현재 추가되는 미디어가 클릭된 미디어인지 확인
          if (
            result.clickedIndex !== undefined &&
            itemIndex === result.clickedIndex &&
            !primaryStrategy
          ) {
            primaryClickedIndex = currentMediaIndex;
            primaryStrategy = result.strategy;
          }

          currentMediaIndex++;
        } else {
          const duplicateReason = isDuplicateById
            ? 'mediaId'
            : isDuplicateByUrl
              ? 'url'
              : isDuplicateByThumbnail
                ? 'thumbnail'
                : 'video-thumbnail-as-image';
          logger.debug('중복 미디어 제거됨', {
            url: normalizedUrl,
            mediaId,
            duplicateType: duplicateReason,
            itemType: item.type,
          });
        }
      });
    });

    if (allMediaItems.length > 0) {
      logger.info(
        `DOM 기반 미디어 추출 성공: ${allMediaItems.length}개 (이미지+비디오), 주요 전략: ${primaryStrategy}`
      );

      // 트윗 미디어 캐시에 저장
      if (tweetId) {
        this.videoStateManager.cacheMediaForTweet(tweetId, tweetContainer, allMediaItems);
      }

      return {
        success: true,
        mediaItems: allMediaItems,
        clickedIndex: Math.max(0, Math.min(primaryClickedIndex, allMediaItems.length - 1)),
        metadata: {
          extractedAt: Date.now(),
          sourceType: 'media',
          strategy: `dom-fallback-combined: ${extractionResults.map(r => r.strategy).join(', ')}`,
        },
      };
    }

    return this.createErrorResult('All extraction strategies failed');
  }

  /**
   * 전략 0: Twitter API 우선 추출 (새로 추가)
   * Twitter API로 전체 미디어를 가져와 정확한 순서 보장
   */
  private async extractFromTwitterAPI(
    tweetContainer: HTMLElement,
    clickedElement: HTMLElement,
    tweetId: string
  ): Promise<MediaExtractionResult> {
    try {
      // Twitter API로 전체 미디어 가져오기
      const apiMedias = await TwitterAPI.getTweetMedias(tweetId);

      if (apiMedias.length === 0) {
        return this.createErrorResult('No media found in Twitter API response');
      }

      const mediaItems: MediaInfo[] = [];
      const tweetInfo = extractTweetInfoUnified(tweetContainer);

      // API 미디어를 MediaInfo로 변환 (원본 순서 유지)
      for (let i = 0; i < apiMedias.length; i++) {
        const apiMedia = apiMedias[i];
        const mediaInfo = this.createMediaInfoFromAPIMedia(apiMedia, tweetInfo, i);
        if (mediaInfo) {
          mediaItems.push(mediaInfo);
        }
      }

      // 클릭된 요소와 API 미디어 매핑으로 정확한 인덱스 계산
      const clickedIndex = await this.findClickedMediaIndexFromAPI(
        clickedElement,
        apiMedias,
        tweetContainer
      );

      logger.info(
        `API 우선 추출 성공: ${mediaItems.length}개 미디어, 클릭 인덱스: ${clickedIndex}, Twitter 원본 순서 보장`
      );

      return {
        success: true,
        mediaItems,
        clickedIndex,
        metadata: {
          extractedAt: Date.now(),
          sourceType: 'twitter-api',
          strategy: 'api-first-extraction',
        },
      };
    } catch (error) {
      logger.warn('API 우선 추출 실패:', error);
      return this.createErrorResult('Twitter API extraction failed');
    }
  }

  /**
   * API 미디어로부터 MediaInfo 생성
   */
  private createMediaInfoFromAPIMedia(
    apiMedia: TweetMediaEntry,
    tweetInfo: TweetInfo | null,
    index: number
  ): MediaInfo | null {
    try {
      const safeTweetInfo = tweetInfo ?? {
        username: apiMedia.screen_name,
        tweetId: apiMedia.tweet_id,
        tweetUrl: `https://x.com/${apiMedia.screen_name}/status/${apiMedia.tweet_id}`,
      };

      const mediaId = `${safeTweetInfo.tweetId}_media_${index}`;

      return {
        id: mediaId,
        url: apiMedia.download_url,
        type: apiMedia.type === 'video' ? 'video' : 'image',
        filename: '', // MediaFilenameService에서 생성
        tweetUsername: safeTweetInfo.username,
        tweetId: safeTweetInfo.tweetId,
        tweetUrl: safeTweetInfo.tweetUrl,
        originalUrl: apiMedia.download_url,
        thumbnailUrl: apiMedia.preview_url,
        alt: `${apiMedia.type === 'video' ? 'Video' : 'Image'} ${index + 1}`,
        metadata: {
          mediaId: apiMedia.media_id,
          mediaKey: apiMedia.media_key,
          expandedUrl: apiMedia.expanded_url,
          typeOriginal: apiMedia.type_original,
          typeIndex: apiMedia.type_index,
          apiIndex: index, // API 원본 순서 보존
        },
      };
    } catch (error) {
      logger.error('API 미디어 MediaInfo 생성 실패:', error);
      return null;
    }
  }

  /**
   * 클릭된 요소와 API 미디어 매핑으로 정확한 인덱스 찾기
   */
  private async findClickedMediaIndexFromAPI(
    clickedElement: HTMLElement,
    apiMedias: TweetMediaEntry[],
    tweetContainer: HTMLElement
  ): Promise<number> {
    try {
      // 클릭된 요소가 이미지인 경우
      if (clickedElement.tagName === 'IMG') {
        const clickedImg = clickedElement as HTMLImageElement;
        const clickedImgSrc = this.normalizeMediaUrl(clickedImg.src);

        // API 미디어와 매핑 시도
        for (let i = 0; i < apiMedias.length; i++) {
          const apiMedia = apiMedias[i];
          const normalizedPreviewUrl = this.normalizeMediaUrl(apiMedia.preview_url);

          // 썸네일 URL 매칭
          if (
            clickedImgSrc === normalizedPreviewUrl ||
            clickedImgSrc.includes(normalizedPreviewUrl)
          ) {
            logger.debug('클릭된 이미지와 API 미디어 매핑 성공', {
              apiIndex: i,
              clickedSrc: clickedImgSrc,
              apiPreview: normalizedPreviewUrl,
            });
            return i;
          }
        }
      }

      // 클릭된 요소 내부의 이미지 확인
      const imgInside = clickedElement.querySelector('img');
      if (imgInside) {
        const insideImgSrc = this.normalizeMediaUrl(imgInside.src);

        for (let i = 0; i < apiMedias.length; i++) {
          const apiMedia = apiMedias[i];
          const normalizedPreviewUrl = this.normalizeMediaUrl(apiMedia.preview_url);

          if (
            insideImgSrc === normalizedPreviewUrl ||
            insideImgSrc.includes(normalizedPreviewUrl)
          ) {
            logger.debug('클릭된 요소 내부 이미지와 API 미디어 매핑 성공', {
              apiIndex: i,
              insideSrc: insideImgSrc,
              apiPreview: normalizedPreviewUrl,
            });
            return i;
          }
        }
      }

      // DOM 이미지 순서 기반 폴백 매핑
      const allImages = Array.from(tweetContainer.querySelectorAll('img')).filter(img =>
        MEDIA_URL_UTILS.isValidDiscoveryUrl(img.src)
      );

      let clickedDOMIndex = -1;
      if (clickedElement.tagName === 'IMG') {
        const clickedImg = clickedElement as HTMLImageElement;
        const normalizedClickedUrl = this.normalizeMediaUrl(clickedImg.src);
        clickedDOMIndex = allImages.findIndex(img => {
          const normalizedUrl = this.normalizeMediaUrl(img.src);
          return normalizedUrl === normalizedClickedUrl;
        });
      } else {
        const imgInside = clickedElement.querySelector('img');
        if (imgInside) {
          const normalizedInsideUrl = this.normalizeMediaUrl(imgInside.src);
          clickedDOMIndex = allImages.findIndex(img => {
            const normalizedUrl = this.normalizeMediaUrl(img.src);
            return normalizedUrl === normalizedInsideUrl;
          });
        }
      }

      if (clickedDOMIndex >= 0 && clickedDOMIndex < apiMedias.length) {
        logger.debug('DOM 순서 기반 폴백 매핑 사용', {
          domIndex: clickedDOMIndex,
          apiMediasCount: apiMedias.length,
        });
        return clickedDOMIndex;
      }

      // 기본값: 첫 번째 미디어
      logger.debug('클릭된 요소 매핑 실패, 첫 번째 미디어 사용');
      return 0;
    } catch (error) {
      logger.warn('클릭된 미디어 인덱스 찾기 실패:', error);
      return 0;
    }
  }

  /**
   * 전략 1: 이미지 요소에서 추출 (개선됨 - 동영상 썸네일 중복 방지)
   */
  private async extractFromImageElements(
    tweetContainer: HTMLElement,
    clickedElement: HTMLElement
  ): Promise<MediaExtractionResult> {
    const allImages = Array.from(tweetContainer.querySelectorAll('img')).filter(img =>
      MEDIA_URL_UTILS.isValidDiscoveryUrl(img.src)
    );

    if (allImages.length === 0) {
      return this.createErrorResult('No valid images found');
    }

    const mediaItems: MediaInfo[] = [];
    const tweetInfo = extractTweetInfoUnified(tweetContainer);
    const tweetId = getTweetIdFromContainer(tweetContainer);
    const processedVideoThumbnails = new Set<string>(); // 처리된 동영상 썸네일 추적

    for (let i = 0; i < allImages.length; i++) {
      const img = allImages[i] as HTMLImageElement;
      const normalizedImgUrl = this.normalizeMediaUrl(img.src);

      // 이미 동영상으로 처리된 썸네일은 건너뛰기
      if (processedVideoThumbnails.has(normalizedImgUrl)) {
        logger.debug('동영상으로 이미 처리된 썸네일 건너뛰기:', normalizedImgUrl);
        continue;
      }

      // 동영상 썸네일 감지 및 처리
      if (isVideoThumbnail(img) && tweetId) {
        try {
          const videoEntry = await getVideoMediaEntry(tweetId, img.src);
          if (videoEntry) {
            const videoMediaInfo = this.createVideoMediaInfo(
              videoEntry,
              tweetInfo,
              mediaItems.length + 1
            );
            if (videoMediaInfo) {
              mediaItems.push(videoMediaInfo);
              processedVideoThumbnails.add(normalizedImgUrl);
              logger.debug('동영상 썸네일을 동영상으로 변환:', normalizedImgUrl);
              continue; // 동영상으로 처리했으므로 이미지로는 추가하지 않음
            }
          }
        } catch (error) {
          logger.warn('동영상 썸네일 처리 실패, 이미지로 처리:', error);
          // 동영상 처리 실패 시 아래로 계속해서 이미지로 처리
        }
      }

      // 일반 이미지 처리 (동영상 썸네일이 아니거나 동영상 처리에 실패한 경우)
      const galleryUrl = MEDIA_URL_UTILS.generateOriginalUrl(img.src);
      if (galleryUrl && MEDIA_URL_UTILS.isValidGalleryUrl(galleryUrl)) {
        const imageMediaInfo = this.createImageMediaInfo(
          galleryUrl,
          tweetInfo,
          mediaItems.length + 1
        );
        if (imageMediaInfo) {
          mediaItems.push(imageMediaInfo);
          logger.debug('일반 이미지로 처리:', normalizedImgUrl);
        }
      }
    }

    const clickedIndex = this.findClickedIndex(clickedElement, allImages);

    return {
      success: mediaItems.length > 0,
      mediaItems,
      clickedIndex,
      metadata: {
        extractedAt: Date.now(),
        sourceType: 'image-elements',
        strategy: 'image-extraction-enhanced',
      },
    };
  }

  /**
   * 전략 2: 비디오 요소에서 직접 추출 (개선됨 - 실제 다운로드 가능한 파일 사용)
   */
  private async extractFromVideoElements(
    tweetContainer: HTMLElement,
    _clickedElement: HTMLElement,
    options: EnhancedMediaExtractionOptions
  ): Promise<MediaExtractionResult> {
    if (!options.includeVideoElements) {
      return this.createErrorResult('Video element extraction disabled');
    }

    const videoElements = tweetContainer.querySelectorAll('video');
    if (videoElements.length === 0) {
      return this.createErrorResult('No video elements found');
    }

    const mediaItems: MediaInfo[] = [];
    const tweetInfo = extractTweetInfoUnified(tweetContainer);
    const tweetId = getTweetIdFromContainer(tweetContainer);
    let clickedIndex = 0;

    // 트윗 ID가 있으면 실제 다운로드 가능한 동영상 파일 정보를 가져옴
    if (tweetId) {
      try {
        const videoEntry = await getVideoMediaEntry(tweetId);
        if (videoEntry) {
          // 실제 다운로드 가능한 동영상 파일로 MediaInfo 생성
          const mediaInfo = this.createVideoMediaInfo(videoEntry, tweetInfo, 1);
          if (mediaInfo) {
            mediaItems.push(mediaInfo);
            logger.debug('동영상 요소 감지 → 실제 다운로드 파일 사용', {
              tweetId,
              downloadUrl: videoEntry.download_url,
            });
          }
        } else {
          // API에서 동영상 정보를 가져올 수 없으면 폴백: 동영상 요소 직접 사용
          logger.warn('동영상 API 추출 실패, 동영상 요소 직접 사용으로 폴백');
          this.fallbackToVideoElements(videoElements, tweetInfo, mediaItems, _clickedElement);
        }
      } catch (error) {
        logger.warn('동영상 API 추출 중 오류, 동영상 요소 직접 사용으로 폴백:', error);
        this.fallbackToVideoElements(videoElements, tweetInfo, mediaItems, _clickedElement);
      }
    } else {
      // 트윗 ID가 없으면 동영상 요소 직접 사용
      logger.debug('트윗 ID 없음, 동영상 요소 직접 사용');
      this.fallbackToVideoElements(videoElements, tweetInfo, mediaItems, _clickedElement);
    }

    // 클릭된 요소와 관련된 인덱스 계산
    videoElements.forEach((video, index) => {
      if (
        video.contains(_clickedElement) ||
        _clickedElement.contains(video) ||
        video === _clickedElement ||
        _clickedElement.closest('video') === video
      ) {
        clickedIndex = Math.min(index, mediaItems.length - 1);
      }
    });

    // 동영상 요소가 있는 트윗의 캐시 저장 (향후 DOM 변화 대응)
    if (tweetId && mediaItems.length > 0) {
      this.videoStateManager.cacheMediaForTweet(tweetId, tweetContainer, mediaItems);
      logger.debug('비디오 요소 추출 결과 캐시됨', { tweetId, mediaCount: mediaItems.length });
    }

    return {
      success: mediaItems.length > 0,
      mediaItems,
      clickedIndex,
      metadata: {
        extractedAt: Date.now(),
        sourceType: 'video-elements',
        strategy: tweetId ? 'video-api-preferred' : 'video-element-fallback',
      },
    };
  }

  /**
   * 동영상 요소 직접 사용 폴백 메서드
   */
  private fallbackToVideoElements(
    videoElements: NodeListOf<HTMLVideoElement>,
    tweetInfo: TweetInfo | null,
    mediaItems: MediaInfo[],
    _clickedElement: HTMLElement
  ): void {
    videoElements.forEach((video, index) => {
      const videoMediaData = this.videoControlUtil.extractMediaFromVideoElement(video);
      if (videoMediaData) {
        const mediaInfo = this.createVideoMediaInfoFromElement(
          videoMediaData,
          tweetInfo,
          index + 1
        );
        if (mediaInfo) {
          mediaItems.push(mediaInfo);
        }
      }
    });
  }

  /**
   * 전략 3: 데이터 속성에서 추출
   */
  private async extractFromDataAttributes(
    tweetContainer: HTMLElement,
    _clickedElement: HTMLElement
  ): Promise<MediaExtractionResult> {
    // 트위터에서 사용하는 데이터 속성들을 검색
    const possibleDataAttributes = [
      'data-expanded-url',
      'data-media-url',
      'data-src',
      'data-video-url',
    ];

    const mediaItems: MediaInfo[] = [];
    const tweetInfo = extractTweetInfoUnified(tweetContainer);

    possibleDataAttributes.forEach(attr => {
      const elements = tweetContainer.querySelectorAll(`[${attr}]`);
      elements.forEach((element, index) => {
        const url = element.getAttribute(attr);
        if (url && MEDIA_URL_UTILS.isValidGalleryUrl(url)) {
          const mediaInfo = this.createImageMediaInfo(url, tweetInfo, index + 1);
          if (mediaInfo) {
            mediaItems.push(mediaInfo);
          }
        }
      });
    });

    return {
      success: mediaItems.length > 0,
      mediaItems,
      clickedIndex: 0,
      metadata: {
        extractedAt: Date.now(),
        sourceType: 'data-attributes',
        strategy: 'data-extraction',
      },
    };
  }

  /**
   * 전략 4: 배경 이미지에서 추출
   */
  private async extractFromBackgroundImages(
    tweetContainer: HTMLElement,
    _clickedElement: HTMLElement
  ): Promise<MediaExtractionResult> {
    const mediaItems: MediaInfo[] = [];
    const tweetInfo = extractTweetInfoUnified(tweetContainer);

    // 배경 이미지가 있는 요소들 검색
    const allElements = tweetContainer.querySelectorAll('*');

    allElements.forEach((element, index) => {
      const style = window.getComputedStyle(element);
      const backgroundImage = style.backgroundImage;

      if (backgroundImage && backgroundImage !== 'none') {
        const urlMatch = backgroundImage.match(/url\(["']?([^"')]+)["']?\)/);
        if (urlMatch?.[1]) {
          const url = urlMatch[1];
          if (MEDIA_URL_UTILS.isValidDiscoveryUrl(url)) {
            const galleryUrl = MEDIA_URL_UTILS.generateOriginalUrl(url);
            if (galleryUrl && MEDIA_URL_UTILS.isValidGalleryUrl(galleryUrl)) {
              const mediaInfo = this.createImageMediaInfo(galleryUrl, tweetInfo, index + 1);
              if (mediaInfo) {
                mediaItems.push(mediaInfo);
              }
            }
          }
        }
      }
    });

    return {
      success: mediaItems.length > 0,
      mediaItems,
      clickedIndex: 0,
      metadata: {
        extractedAt: Date.now(),
        sourceType: 'background-images',
        strategy: 'background-extraction',
      },
    };
  }

  /**
   * 폴백: API를 통한 동영상 추출
   */
  private async fallbackVideoExtraction(
    tweetContainer: HTMLElement,
    _clickedElement: HTMLElement
  ): Promise<MediaExtractionResult> {
    const tweetId = getTweetIdFromContainer(tweetContainer);
    if (!tweetId) {
      return this.createErrorResult('Cannot extract tweet ID for video fallback');
    }

    try {
      // Twitter API를 통해 미디어 정보 가져오기
      const { getVideoMediaEntry } = await import('@shared/utils/patterns');
      const videoEntry = await getVideoMediaEntry(tweetId);

      if (videoEntry) {
        const tweetInfo = extractTweetInfoUnified(tweetContainer);
        const mediaInfo = this.createVideoMediaInfo(videoEntry, tweetInfo, 1);

        if (mediaInfo) {
          return {
            success: true,
            mediaItems: [mediaInfo],
            clickedIndex: 0,
            metadata: {
              extractedAt: Date.now(),
              sourceType: 'twitter-api',
              strategy: 'api-fallback',
            },
          };
        }
      }

      return this.createErrorResult('API fallback failed to extract video');
    } catch (error) {
      logger.error('API 폴백 동영상 추출 실패:', error);
      return this.createErrorResult('API fallback extraction failed');
    }
  }

  // 기존 헬퍼 메서드들...
  private findTweetContainer(element: Element): HTMLElement | null {
    let current = element as HTMLElement;
    let depth = 0;
    const maxSearchDepth = 10;

    while (current && depth < maxSearchDepth) {
      const testId = current.getAttribute('data-testid');

      if (testId === 'tweetPhoto') {
        let tweetContainer = current.parentElement;
        let parentDepth = 0;

        while (tweetContainer && parentDepth < 5) {
          if (tweetContainer.getAttribute('data-testid') === 'tweet') {
            return tweetContainer;
          }
          tweetContainer = tweetContainer.parentElement;
          parentDepth++;
        }

        return current.closest('[data-testid="tweet"]') ?? current.closest('article') ?? current;
      }

      current = current.parentElement as HTMLElement;
      depth++;
    }

    const tweetContainer = element.closest('[data-testid="tweet"]');
    if (tweetContainer) {
      return tweetContainer as HTMLElement;
    }

    const articleContainer = element.closest('article');
    if (articleContainer) {
      return articleContainer;
    }

    return null;
  }

  private findClickedIndex(clickedElement: Element, allImages: HTMLImageElement[]): number {
    if (clickedElement.tagName === 'IMG') {
      const clickedImg = clickedElement as HTMLImageElement;
      const normalizedClickedUrl = this.normalizeMediaUrl(clickedImg.src);

      const matchIndex = allImages.findIndex(img => {
        const normalizedUrl = this.normalizeMediaUrl(img.src);
        return normalizedUrl === normalizedClickedUrl;
      });

      if (matchIndex !== -1) {
        return matchIndex;
      }
    }

    const imgInside = clickedElement.querySelector('img');
    if (imgInside) {
      const normalizedInsideUrl = this.normalizeMediaUrl(imgInside.src);
      const matchIndex = allImages.findIndex(img => {
        const normalizedUrl = this.normalizeMediaUrl(img.src);
        return normalizedUrl === normalizedInsideUrl;
      });

      if (matchIndex !== -1) {
        return matchIndex;
      }
    }

    return 0;
  }

  private normalizeMediaUrl(url: string): string {
    try {
      // blob URL은 고유하므로 그대로 반환
      if (url.startsWith('blob:')) {
        return url;
      }

      // URL 객체로 파싱하여 정규화
      const urlObj = new URL(url);
      let normalized = urlObj.origin + urlObj.pathname;

      // Twitter 미디어 URL 크기 변형자 제거
      normalized = normalized
        .replace(/:small$/, '')
        .replace(/:medium$/, '')
        .replace(/:large$/, '')
        .replace(/:orig$/, '');

      // 파일 확장자 정규화 (.jpg:large -> .jpg)
      normalized = normalized.replace(/\.(jpg|jpeg|png|gif|mp4|webm|mov):.*$/, '.$1');

      return normalized;
    } catch {
      // URL 파싱 실패 시 원본 반환
      return url;
    }
  }

  private createImageMediaInfo(
    url: string,
    tweetInfo: TweetInfo | null,
    index: number
  ): MediaInfo | null {
    try {
      const safeTweetInfo = tweetInfo ?? {
        username: '',
        tweetId: '',
        tweetUrl: '',
      };

      // 일관된 ID 형식: {tweetId}_media_{0-based-index}
      const mediaId = `${safeTweetInfo.tweetId || 'unknown'}_media_${index - 1}`;

      return {
        id: mediaId,
        url,
        type: 'image',
        filename: '', // MediaFilenameService에서 생성하도록 빈 값
        tweetUsername: safeTweetInfo.username,
        tweetId: safeTweetInfo.tweetId,
        tweetUrl: safeTweetInfo.tweetUrl,
        originalUrl: url,
        thumbnailUrl: url,
        alt: `Image ${index}`,
      };
    } catch (error) {
      logger.error('이미지 MediaInfo 생성 실패:', error);
      return null;
    }
  }

  private createVideoMediaInfo(
    videoEntry: TweetMediaEntry,
    tweetInfo: TweetInfo | null,
    index: number
  ): MediaInfo | null {
    try {
      const safeTweetInfo = tweetInfo ?? {
        username: videoEntry.screen_name,
        tweetId: videoEntry.tweet_id,
        tweetUrl: `https://x.com/${videoEntry.screen_name}/status/${videoEntry.tweet_id}`,
      };

      // 일관된 ID 형식: {tweetId}_media_{0-based-index}
      const mediaId = `${safeTweetInfo.tweetId || 'unknown'}_media_${index - 1}`;

      return {
        id: mediaId,
        url: videoEntry.download_url,
        type: 'video',
        filename: '', // MediaFilenameService에서 생성하도록 빈 값
        tweetUsername: safeTweetInfo.username,
        tweetId: safeTweetInfo.tweetId,
        tweetUrl: safeTweetInfo.tweetUrl,
        originalUrl: videoEntry.download_url,
        thumbnailUrl: videoEntry.preview_url,
        alt: `Video ${index}`,
        metadata: {
          mediaId: videoEntry.media_id,
          mediaKey: videoEntry.media_key,
          expandedUrl: videoEntry.expanded_url,
          typeOriginal: videoEntry.type_original,
          typeIndex: videoEntry.type_index,
        },
      };
    } catch (error) {
      logger.error('비디오 MediaInfo 생성 실패:', error);
      return null;
    }
  }

  private createVideoMediaInfoFromElement(
    videoData: { url: string; thumbnailUrl?: string; type: 'video' },
    tweetInfo: TweetInfo | null,
    index: number
  ): MediaInfo | null {
    try {
      const safeTweetInfo = tweetInfo ?? {
        username: '',
        tweetId: '',
        tweetUrl: '',
      };

      // 일관된 ID 형식: {tweetId}_media_{0-based-index}
      const mediaId = `${safeTweetInfo.tweetId || 'unknown'}_media_${index - 1}`;

      return {
        id: mediaId,
        url: videoData.url,
        type: 'video',
        filename: '', // MediaFilenameService에서 생성하도록 빈 값
        tweetUsername: safeTweetInfo.username,
        tweetId: safeTweetInfo.tweetId,
        tweetUrl: safeTweetInfo.tweetUrl,
        originalUrl: videoData.url,
        thumbnailUrl: videoData.thumbnailUrl ?? videoData.url,
        alt: `Video ${index}`,
      };
    } catch (error) {
      logger.error('비디오 요소 MediaInfo 생성 실패:', error);
      return null;
    }
  }

  private createErrorResult(error: string): MediaExtractionResult {
    return {
      success: false,
      mediaItems: [],
      clickedIndex: 0,
      error,
      metadata: {
        extractedAt: Date.now(),
        sourceType: 'unknown',
      },
    };
  }
}
