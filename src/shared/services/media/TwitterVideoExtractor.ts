/**
 * Twitter Video Extractor Utility
 *
 * Twitter Click'n'Save 스크립트의 동영상 추출 로직을 참고하여
 * 동영상 썸네일에서 실제 동영상 URL을 추출합니다.
 */

import { logger } from '@shared/logging/logger';
import { undefinedToNull } from '@shared/utils/type-safety-helpers';

import { TWITTER_API_CONFIG } from '@/constants';

/**
 * Twitter API 응답 타입 정의
 */
interface TwitterAPIResponse {
  data?: {
    tweetResult?: {
      result?: TwitterTweet;
    };
  };
}

// 간소화된 트윗 타입 정의 (현대적 API 구조)
interface TwitterTweet {
  __typename?: string;
  tweet?: TwitterTweet;
  rest_id?: string;
  core?: {
    user_results?: {
      result?: TwitterUser;
    };
  };
  // 통합된 미디어 정보
  extended_entities?:
    | {
        media?: TwitterMedia[];
      }
    | undefined;
  full_text?: string | undefined;
  id_str?: string | undefined;
  quoted_status_result?: {
    result?: TwitterTweet;
  };
  // Legacy API 호환성
  legacy?: {
    extended_entities?:
      | {
          media?: TwitterMedia[];
        }
      | undefined;
    full_text?: string | undefined;
    id_str?: string | undefined;
  };
}

interface TwitterUser {
  rest_id?: string;
  screen_name?: string;
  name?: string;
  // Legacy API 호환성
  legacy?: {
    screen_name?: string;
    name?: string;
  };
}

interface TwitterMedia {
  type: 'photo' | 'video' | 'animated_gif';
  id_str: string;
  media_key?: string;
  media_url_https: string;
  expanded_url?: string;
  display_url?: string;
  url?: string;
  video_info?: {
    variants: Array<{
      bitrate?: number;
      url: string;
      content_type: string;
    }>;
  };
}

/**
 * 트윗 미디어 엔트리 타입
 */
export interface TweetMediaEntry {
  screen_name: string;
  tweet_id: string;
  download_url: string;
  type: 'photo' | 'video';
  typeOriginal: 'photo' | 'video' | 'animated_gif';
  index: number;
  typeIndex: number;
  typeIndexOriginal: number;
  preview_url: string;
  media_id: string;
  media_key: string;
  expanded_url: string;
  short_expanded_url: string;
  short_tweet_url: string;
  tweet_text: string;
}

/**
 * 동영상 썸네일인지 감지하는 함수
 */
export function isVideoThumbnail(imgElement: HTMLImageElement): boolean {
  const src = imgElement.src;
  const alt = imgElement.alt;

  return (
    src.includes('ext_tw_video_thumb') ||
    src.includes('amplify_video_thumb') ||
    src.includes('tweet_video_thumb') ||
    alt === 'Animated Text GIF' ||
    alt === 'Embedded video' ||
    imgElement.closest('[data-testid="videoComponent"]') !== null ||
    imgElement.closest('a[aria-label*="video"]') !== null ||
    imgElement.closest('a[aria-label*="Video"]') !== null ||
    imgElement.closest('a[aria-label="Embedded video"]') !== null
  );
}

/**
 * 동영상 플레이어인지 감지하는 함수 (재생 중인 동영상 요소)
 */
export function isVideoPlayer(element: HTMLElement): boolean {
  return (
    element.tagName === 'VIDEO' ||
    element.closest('[data-testid="videoPlayer"]') !== null ||
    element.closest('[data-testid="videoComponent"]') !== null ||
    element.closest('div[role="img"][aria-label*="video"]') !== null ||
    element.closest('div[role="img"][aria-label*="Video"]') !== null
  );
}

/**
 * 동영상 관련 요소인지 감지 (썸네일 또는 플레이어)
 */
export function isVideoElement(element: HTMLElement): boolean {
  if (element.tagName === 'IMG') {
    return isVideoThumbnail(element as HTMLImageElement);
  }
  return isVideoPlayer(element);
}

/**
 * 쿠키에서 값 가져오기
 */
function getCookie(name: string): string | undefined {
  const regExp = new RegExp(`(?<=${name}=)[^;]+`);
  return document.cookie.match(regExp)?.[0];
}

/**
 * Twitter API 클래스 (외부 사용을 위해 export)
 */
export class TwitterAPI {
  private static readonly guestToken = getCookie('gt');
  private static readonly csrfToken = getCookie('ct0');
  private static readonly requestCache = new Map<string, TwitterAPIResponse>();

  /**
   * 캐시 정리 (16개 이상일 때)
   */
  private static vacuumCache(): void {
    if (this.requestCache.size > 16) {
      const firstKey = this.requestCache.keys().next().value;
      if (firstKey) {
        this.requestCache.delete(firstKey);
      }
    }
  }

  /**
   * Twitter API 요청
   */
  private static async apiRequest(url: string): Promise<TwitterAPIResponse> {
    const _url = url.toString();

    // 캐시 확인
    if (this.requestCache.has(_url)) {
      logger.debug('Using cached API request:', _url);
      const cachedResult = this.requestCache.get(_url);
      if (cachedResult) {
        return cachedResult;
      }
    }

    const headers = new Headers({
      authorization: TWITTER_API_CONFIG.GUEST_AUTHORIZATION,
      'x-csrf-token': this.csrfToken ?? '',
      'x-twitter-client-language': 'en',
      'x-twitter-active-user': 'yes',
      'content-type': 'application/json',
    });

    if (this.guestToken) {
      headers.append('x-guest-token', this.guestToken);
    } else {
      headers.append('x-twitter-auth-type', 'OAuth2Session');
    }

    try {
      const response = await fetch(_url, { headers });
      const json = (await response.json()) as TwitterAPIResponse;

      if (response.ok) {
        this.vacuumCache();
        this.requestCache.set(_url, json);
      }

      return json;
    } catch (error) {
      logger.error('Twitter API request failed:', error);
      throw error;
    }
  }

  /**
   * TweetResultByRestId API URL 생성
   */
  private static createTweetJsonEndpointUrlByRestId(tweetId: string): string {
    const sitename = window.location.hostname.replace('.com', '');

    const variables = {
      tweetId,
      withCommunity: false,
      includePromotedContent: false,
      withVoice: false,
    };

    const features = {
      creator_subscriptions_tweet_preview_api_enabled: true,
      premium_content_api_read_enabled: false,
      communities_web_enable_tweet_community_results_fetch: true,
      c9s_tweet_anatomy_moderator_badge_enabled: true,
      responsive_web_grok_analyze_button_fetch_trends_enabled: false,
      responsive_web_grok_analyze_post_followups_enabled: false,
      responsive_web_jetfuel_frame: false,
      responsive_web_grok_share_attachment_enabled: true,
      articles_preview_enabled: true,
      responsive_web_edit_tweet_api_enabled: true,
      graphql_is_translatable_rweb_tweet_is_translatable_enabled: true,
      view_counts_everywhere_api_enabled: true,
      longform_notetweets_consumption_enabled: true,
      responsive_web_twitter_article_tweet_consumption_enabled: true,
      tweet_awards_web_tipping_enabled: false,
      responsive_web_grok_show_grok_translated_post: false,
      responsive_web_grok_analysis_button_from_backend: false,
      creator_subscriptions_quote_tweet_preview_enabled: false,
      freedom_of_speech_not_reach_fetch_enabled: true,
      standardized_nudges_misinfo: true,
      tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled: true,
      longform_notetweets_rich_text_read_enabled: true,
      longform_notetweets_inline_media_enabled: true,
      profile_label_improvements_pcf_label_in_post_enabled: true,
      rweb_tipjar_consumption_enabled: true,
      verified_phone_label_enabled: false,
      responsive_web_grok_image_annotation_enabled: true,
      responsive_web_graphql_skip_user_profile_image_extensions_enabled: false,
      responsive_web_graphql_timeline_navigation_enabled: true,
      responsive_web_enhance_cards_enabled: false,
    };

    const fieldToggles = {
      withArticleRichContentState: true,
      withArticlePlainText: false,
      withGrokAnalyze: false,
      withDisallowedReplyControls: false,
    };

    const urlBase = `https://${sitename}.com/i/api/graphql/${TWITTER_API_CONFIG.TWEET_RESULT_BY_REST_ID_QUERY_ID}/TweetResultByRestId`;
    
    // URL 생성자를 안전하게 시도
    let URLConstructor: typeof URL | undefined;
    
    if (typeof globalThis !== 'undefined' && typeof globalThis.URL === 'function') {
      URLConstructor = globalThis.URL;
    } else if (typeof window !== 'undefined' && typeof window.URL === 'function') {
      URLConstructor = window.URL;
    }
    
    if (!URLConstructor) {
      // Fallback: 간단한 문자열 조합
      const encodedVariables = encodeURIComponent(JSON.stringify(variables));
      const encodedFeatures = encodeURIComponent(JSON.stringify(features));
      const encodedFieldToggles = encodeURIComponent(JSON.stringify(fieldToggles));
      return `${urlBase}?variables=${encodedVariables}&features=${encodedFeatures}&fieldToggles=${encodedFieldToggles}`;
    }

    const urlObj = new URLConstructor(urlBase);
    urlObj.searchParams.set('variables', JSON.stringify(variables));
    urlObj.searchParams.set('features', JSON.stringify(features));
    urlObj.searchParams.set('fieldToggles', JSON.stringify(fieldToggles));

    return urlObj.toString();
  }

  /**
   * 트윗에서 미디어 정보 추출 (통합된 현대적 방식)
   */
  private static extractMediaFromTweet(
    tweetResult: TwitterTweet,
    tweetUser: TwitterUser
  ): TweetMediaEntry[] {
    if (!tweetResult.extended_entities?.media) {
      return [];
    }

    const mediaItems: TweetMediaEntry[] = [];
    const typeIndex: Record<string, number> = {};
    const screenName = tweetUser.screen_name ?? '';
    const tweetId = tweetResult.rest_id ?? tweetResult.id_str ?? '';

    for (let index = 0; index < tweetResult.extended_entities.media.length; index++) {
      const media: TwitterMedia | undefined = tweetResult.extended_entities.media[index];
      if (!media?.type || !media.id_str || !media.media_url_https) {
        continue;
      }

      try {
        const mediaUrl = this.getHighQualityMediaUrl(media);
        if (!mediaUrl) continue;

        const mediaType = media.type === 'animated_gif' ? 'video' : media.type;
        typeIndex[mediaType] = (typeIndex[mediaType] ?? -1) + 1;

        const tweetText = (tweetResult.full_text ?? '').replace(` ${media.url}`, '').trim();

        const mediaEntry: TweetMediaEntry = {
          screen_name: screenName,
          tweet_id: tweetId,
          download_url: mediaUrl,
          type: mediaType as 'photo' | 'video',
          typeOriginal: media.type as 'photo' | 'video' | 'animated_gif',
          index,
          typeIndex: typeIndex[mediaType] ?? 0,
          typeIndexOriginal: typeIndex[media.type] ?? 0,
          preview_url: media.media_url_https,
          media_id: media.id_str,
          media_key: media.media_key ?? '',
          expanded_url: media.expanded_url ?? '',
          short_expanded_url: media.display_url ?? '',
          short_tweet_url: media.url ?? '',
          tweet_text: tweetText,
        };

        mediaItems.push(mediaEntry);
      } catch (error) {
        logger.warn(`Failed to process media ${media.id_str}:`, error);
      }
    }

    return mediaItems;
  }

  /**
   * 고품질 미디어 URL 추출
   */
  private static getHighQualityMediaUrl(media: TwitterMedia): string | null {
    if (media.type === 'photo') {
      return media.media_url_https.includes('?format=')
        ? media.media_url_https
        : media.media_url_https.replace(/\.(jpg|png)$/, '?format=$1&name=orig');
    }

    if (media.type === 'video' || media.type === 'animated_gif') {
      const variants = media.video_info?.variants ?? [];
      const mp4Variants = variants.filter(v => v.content_type === 'video/mp4');

      if (mp4Variants.length === 0) return null;

      // 가장 높은 비트레이트 선택
      const bestVariant = mp4Variants.reduce((best, current) => {
        const bestBitrate = best.bitrate ?? 0;
        const currentBitrate = current.bitrate ?? 0;
        return currentBitrate > bestBitrate ? current : best;
      });

      return bestVariant.url;
    }

    return null;
  }

  /**
   * 트윗 미디어 가져오기
   */
  public static async getTweetMedias(tweetId: string): Promise<TweetMediaEntry[]> {
    const url = this.createTweetJsonEndpointUrlByRestId(tweetId);
    const json = await this.apiRequest(url);

    if (!json.data?.tweetResult?.result) {
      return [];
    }

    let tweetResult = json.data.tweetResult.result;
    if (tweetResult.tweet) {
      tweetResult = tweetResult.tweet;
    }

    const tweetUser = tweetResult.core?.user_results?.result;

    // 현대적 API 구조와 legacy 구조 통합
    if (tweetResult.legacy) {
      // legacy에서 현대적 구조로 데이터 복사
      tweetResult.extended_entities = tweetResult.legacy.extended_entities;
      tweetResult.full_text = tweetResult.legacy.full_text;
      tweetResult.id_str = tweetResult.legacy.id_str;
    }

    if (!tweetUser) {
      return [];
    }

    // tweetUser의 legacy 정보도 직접 복사
    if (tweetUser.legacy?.screen_name) {
      tweetUser.screen_name = tweetUser.legacy.screen_name;
    }

    let result = this.extractMediaFromTweet(tweetResult, tweetUser);

    // 인용 트윗 처리
    if (tweetResult.quoted_status_result?.result) {
      const quotedTweet = tweetResult.quoted_status_result.result;
      const quotedUser = quotedTweet.core?.user_results?.result;

      if (quotedTweet && quotedUser) {
        // 인용 트윗의 legacy 정보도 통합
        if (quotedTweet.legacy) {
          quotedTweet.extended_entities = quotedTweet.legacy.extended_entities;
          quotedTweet.full_text = quotedTweet.legacy.full_text;
          quotedTweet.id_str = quotedTweet.legacy.id_str;
        }
        if (quotedUser.legacy?.screen_name) {
          quotedUser.screen_name = quotedUser.legacy.screen_name;
        }

        result = [...result, ...this.extractMediaFromTweet(quotedTweet, quotedUser)];
      }
    }

    return result;
  }
}

/**
 * 트윗 ID 추출
 */
export function extractTweetId(url: string): string | null {
  const match = url.match(/(?<=\/status\/)\d+/);
  return match?.[0] ?? null;
}

/**
 * 트윗 컨테이너에서 트윗 ID 추출
 */
export function getTweetIdFromContainer(container: HTMLElement): string | null {
  // 트윗 링크에서 ID 추출
  const tweetLinks = container.querySelectorAll('a[href*="/status/"]');
  for (const link of tweetLinks) {
    const href = (link as HTMLAnchorElement).href;
    const tweetId = extractTweetId(href);
    if (tweetId) {
      return tweetId;
    }
  }

  // 시간 요소의 부모 링크에서 추출
  const timeElements = container.querySelectorAll('time');
  for (const timeElement of timeElements) {
    const parentLink = timeElement.closest('a[href*="/status/"]');
    if (parentLink) {
      const href = (parentLink as HTMLAnchorElement).href;
      const tweetId = extractTweetId(href);
      if (tweetId) {
        return tweetId;
      }
    }
  }

  // 미디어 링크에서 추출
  const mediaLinks = container.querySelectorAll(
    'a[href*="/status/"][href*="photo"], a[href*="/status/"][href*="video"]'
  );
  for (const link of mediaLinks) {
    const href = (link as HTMLAnchorElement).href;
    const tweetId = extractTweetId(href);
    if (tweetId) {
      return tweetId;
    }
  }

  // 부모 요소에서 링크 검색
  const parentLinks = container.querySelectorAll('a[href*="/status/"]');
  for (const link of parentLinks) {
    const href = (link as HTMLAnchorElement).href;
    const tweetId = extractTweetId(href);
    if (tweetId) {
      return tweetId;
    }
  }

  // 상대 경로 href 처리
  const relativeLinks = container.querySelectorAll('a[href^="/"][href*="/status/"]');
  for (const link of relativeLinks) {
    const href = (link as HTMLAnchorElement).getAttribute('href');
    if (href) {
      const tweetId = extractTweetId(`https://x.com${href}`);
      if (tweetId) {
        return tweetId;
      }
    }
  }

  // data attribute에서 트윗 ID 추출
  const elementsWithData = container.querySelectorAll('[data-tweet-id]');
  for (const element of elementsWithData) {
    const tweetId = element.getAttribute('data-tweet-id');
    if (tweetId && /^\d{15,20}$/.test(tweetId)) {
      return tweetId;
    }
  }

  // aria-label에서 트윗 ID 추출
  const elementsWithAriaLabel = container.querySelectorAll('[aria-label]');
  for (const element of elementsWithAriaLabel) {
    const ariaLabel = element.getAttribute('aria-label');
    if (ariaLabel) {
      const match = ariaLabel.match(/\b(\d{15,20})\b/);
      if (match) {
        return undefinedToNull(match?.[1]);
      }
    }
  }

  // 텍스트 콘텐츠에서 트윗 ID 패턴 추출
  const textContent = container.textContent ?? '';
  const textMatch = textContent.match(/\b(\d{15,20})\b/);
  if (textMatch) {
    return undefinedToNull(textMatch?.[1]);
  }

  // 현재 URL에서 추출 시도
  if (window.location.pathname.includes('/status/')) {
    return extractTweetId(window.location.href);
  }

  return null;
}

/**
 * 동영상 미디어 엔트리 가져오기
 */
export async function getVideoMediaEntry(
  tweetId: string,
  thumbnailUrl?: string
): Promise<TweetMediaEntry | null> {
  try {
    const medias = await TwitterAPI.getTweetMedias(tweetId);

    // 동영상 미디어만 필터링
    const videoMedias = medias.filter(media => media.type === 'video');

    if (videoMedias.length === 0) {
      return null;
    }

    // 썸네일 URL이 제공된 경우 매칭 시도
    if (thumbnailUrl) {
      const normalizedThumbnail = thumbnailUrl.replace(/\?.*$/, '');
      const matchedVideo = videoMedias.find(media =>
        media.preview_url.startsWith(normalizedThumbnail)
      );

      if (matchedVideo) {
        return matchedVideo;
      }
    }

    // 첫 번째 동영상 반환
    return videoMedias[0] ?? null;
  } catch (error) {
    logger.error('Failed to get video media entry:', error);
    return null;
  }
}

/**
 * 이미지가 동영상 썸네일인지 확인하고 실제 동영상 URL 반환
 */
export async function getVideoUrlFromThumbnail(
  imgElement: HTMLImageElement,
  tweetContainer: HTMLElement
): Promise<string | null> {
  if (!isVideoThumbnail(imgElement)) {
    return null;
  }

  const tweetId = getTweetIdFromContainer(tweetContainer);
  if (!tweetId) {
    logger.warn('Cannot extract tweet ID from container');
    return null;
  }

  const videoEntry = await getVideoMediaEntry(tweetId, imgElement.src);
  return videoEntry?.download_url ?? null;
}
