/**
 * Twitter Video Extractor Utility
 *
 * Twitter Click'n'Save 스크립트의 동영상 추출 로직을 참고하여
 * 동영상 썸네일에서 실제 동영상 URL을 추출합니다.
 */

import { logger } from '@infrastructure/logging/logger';

import { TWITTER_API_CONFIG } from '@core/constants/MEDIA_CONSTANTS';

/**
 * Twitter API 응답 타입 정의
 */
interface TwitterAPIResponse {
  data?: {
    tweetResult?: {
      result?: TwitterTweetResult;
    };
  };
}

interface TwitterTweetResult {
  __typename?: string;
  tweet?: TwitterTweetResult;
  rest_id?: string;
  core?: {
    user_results?: {
      result?: TwitterUserResult;
    };
  };
  legacy?: TwitterTweetLegacy;
  quoted_status_result?: {
    result?: TwitterTweetResult;
  };
}

interface TwitterUserResult {
  legacy?: {
    screen_name?: string;
  };
}

interface TwitterTweetLegacy {
  id_str?: string;
  full_text?: string;
  extended_entities?: {
    media?: TwitterMediaEntity[];
  };
}

interface TwitterMediaEntity {
  type?: string;
  id_str?: string;
  media_key?: string;
  media_url_https?: string;
  expanded_url?: string;
  display_url?: string;
  url?: string;
  video_info?: {
    variants?: Array<{
      bitrate?: number;
      url?: string;
      content_type?: string;
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
  type_original: 'photo' | 'video' | 'animated_gif';
  index: number;
  type_index: number;
  type_index_original: number;
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
  private static guestToken = getCookie('gt');
  private static csrfToken = getCookie('ct0');
  private static requestCache = new Map<string, TwitterAPIResponse>();

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
    const urlObj = new URL(urlBase);
    urlObj.searchParams.set('variables', JSON.stringify(variables));
    urlObj.searchParams.set('features', JSON.stringify(features));
    urlObj.searchParams.set('fieldToggles', JSON.stringify(fieldToggles));

    return urlObj.toString();
  }

  /**
   * 트윗 JSON에서 미디어 파싱
   */
  private static parseTweetLegacyMedias(
    tweetResult: TwitterTweetResult,
    tweetLegacy: TwitterTweetLegacy,
    tweetUser: TwitterUserResult
  ): TweetMediaEntry[] {
    if (!tweetLegacy.extended_entities?.media) {
      return [];
    }

    const medias: TweetMediaEntry[] = [];
    const typeIndex: Record<string, number> = {};
    let index = -1;

    for (const media of tweetLegacy.extended_entities.media) {
      if (!media.type || !media.id_str || !media.media_url_https) {
        continue;
      }

      index++;
      let type = media.type;
      const type_original = media.type;

      typeIndex[type] = (typeIndex[type] ?? -1) + 1;

      if (type === 'animated_gif') {
        type = 'video';
        typeIndex[type] = (typeIndex[type] ?? -1) + 1;
      }

      let download_url: string;

      if (media.video_info?.variants) {
        // 동영상의 경우 최고 품질 비트레이트 선택
        const videoInfo = media.video_info.variants
          .filter(el => el.bitrate !== undefined)
          .reduce((acc, cur) => ((cur.bitrate ?? 0) > (acc.bitrate ?? 0) ? cur : acc));
        download_url = videoInfo.url ?? media.media_url_https;
      } else {
        // 이미지의 경우
        if (media.media_url_https.includes('?format=')) {
          download_url = media.media_url_https;
        } else {
          const parts = media.media_url_https.split('.');
          const ext = parts[parts.length - 1];
          const urlPart = parts.slice(0, -1).join('.');
          download_url = `${urlPart}?format=${ext}&name=orig`;
        }
      }

      const screen_name = tweetUser.legacy?.screen_name ?? '';
      const tweet_id = tweetResult.rest_id ?? tweetLegacy.id_str ?? '';
      const type_index = typeIndex[type] ?? 0;
      const type_index_original = typeIndex[type_original] ?? 0;
      const preview_url = media.media_url_https;
      const media_id = media.id_str;
      const media_key = media.media_key ?? '';
      const expanded_url = media.expanded_url ?? '';
      const short_expanded_url = media.display_url ?? '';
      const short_tweet_url = media.url ?? '';
      const tweet_text = (tweetLegacy.full_text ?? '').replace(` ${media.url}`, '');

      const mediaEntry: TweetMediaEntry = {
        screen_name,
        tweet_id,
        download_url,
        type: type as 'photo' | 'video',
        type_original: type_original as 'photo' | 'video' | 'animated_gif',
        index,
        type_index,
        type_index_original,
        preview_url,
        media_id,
        media_key,
        expanded_url,
        short_expanded_url,
        short_tweet_url,
        tweet_text,
      };

      medias.push(mediaEntry);
    }

    return medias;
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
    const tweetLegacy = tweetResult.legacy;

    if (!tweetUser || !tweetLegacy) {
      return [];
    }

    let result = this.parseTweetLegacyMedias(tweetResult, tweetLegacy, tweetUser);

    // 인용 트윗 처리
    if (tweetResult.quoted_status_result?.result) {
      const tweetResultQuoted = tweetResult.quoted_status_result.result;
      const tweetLegacyQuoted = tweetResultQuoted.legacy;
      const tweetUserQuoted = tweetResultQuoted.core?.user_results?.result;

      if (tweetLegacyQuoted && tweetUserQuoted) {
        result = [
          ...result,
          ...this.parseTweetLegacyMedias(tweetResultQuoted, tweetLegacyQuoted, tweetUserQuoted),
        ];
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
