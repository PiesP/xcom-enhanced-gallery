/**
 * @fileoverview Media Tab URL Direct Strategy
 * @description 미디어 탭 URL에서 직접 매핑하는 전략
 */

import type { MediaMapping, MediaPageType } from '@shared/types/media.types';
import { logger } from '@shared/logging';
import { safeParseInt } from '@shared/utils/type-safety-helpers';
import type { MediaMappingStrategy } from '@shared/types/media.types';

export class MediaTabUrlDirectStrategy implements MediaMappingStrategy {
  readonly name = 'media-tab-url-direct';
  readonly priority = 1;

  async execute(
    clickedElement: HTMLElement,
    pageType: MediaPageType
  ): Promise<MediaMapping | null> {
    logger.debug('[MediaTabUrlDirectStrategy] 실행 시작', { pageType });

    if (pageType !== 'photoDetail' && pageType !== 'videoDetail') {
      return null;
    }

    // 현재 URL에서 트윗 ID 추출
    const currentUrl = window.location.href;
    const tweetIdMatch = currentUrl.match(/\/status\/(\d+)/);

    if (!tweetIdMatch) {
      logger.debug('[MediaTabUrlDirectStrategy] URL에서 트윗 ID를 찾을 수 없음');
      return null;
    }

    const tweetId = tweetIdMatch[1];

    // tweetId가 없으면 null 반환
    if (!tweetId) {
      logger.debug('[MediaTabUrlDirectStrategy] 트윗 ID가 유효하지 않음');
      return null;
    }

    // 클릭된 요소에서 미디어 정보 추출
    const mediaInfo = this.extractMediaInfo(clickedElement);
    if (!mediaInfo) {
      return null;
    }

    const result: MediaMapping = {
      pageType,
      mediaUrls: [mediaInfo.url], // URL 배열로 설정
      tweetId,
      mediaIndex: mediaInfo.index,
      confidence: 0.95, // 전체 신뢰도 점수
      method: this.name,
      metadata: {
        mediaUrl: mediaInfo.url,
      },
    };

    logger.debug('[MediaTabUrlDirectStrategy] 매핑 성공', result);
    return result;
  }

  private extractMediaInfo(element: HTMLElement): { url: string; index: number } | null {
    // 이미지나 비디오 요소 찾기
    const img = element.querySelector('img') ?? element.closest('img');
    const video = element.querySelector('video') ?? element.closest('video');

    let url = '';
    if (img) {
      url = (img as HTMLImageElement).src;
    } else if (video) {
      url = (video as HTMLVideoElement).src || (video as HTMLVideoElement).poster || '';
    }

    if (!url) {
      return null;
    }

    // URL에서 미디어 인덱스 추출 시도
    const indexMatch = url.match(/\/media\/(\d+)/);
    const index = indexMatch ? safeParseInt(indexMatch[1], 10) - 1 : 0;

    return { url, index };
  }
}
