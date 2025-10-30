// Twitter Video Extractor - Optimized for bundle size
import { logger } from '@shared/logging';
import { STABLE_SELECTORS, TWITTER_API_CONFIG } from '@/constants';

interface TwitterAPIResponse {
  data?: {
    tweetResult?: {
      result?: TwitterTweet;
    };
  };
}

interface TwitterTweet {
  __typename?: string;
  tweet?: TwitterTweet;
  rest_id?: string;
  core?: {
    user_results?: {
      result?: TwitterUser;
    };
  };
  extended_entities?: { media?: TwitterMedia[] } | undefined;
  full_text?: string | undefined;
  id_str?: string | undefined;
  quoted_status_result?: {
    result?: TwitterTweet;
  };
  legacy?: {
    extended_entities?: { media?: TwitterMedia[] } | undefined;
    full_text?: string | undefined;
    id_str?: string | undefined;
  };
}

interface TwitterUser {
  rest_id?: string;
  screen_name?: string;
  name?: string;
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
    aspect_ratio?: [number, number];
    variants: Array<{
      bitrate?: number;
      url: string;
      content_type: string;
    }>;
  };
  original_info?: {
    height?: number;
    width?: number;
  };
}

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
  original_width?: number;
  original_height?: number;
  aspect_ratio?: [number, number];
}

export function isVideoThumbnail(imgElement: HTMLImageElement): boolean {
  const src = imgElement.src;
  const alt = imgElement.alt;
  return (
    src.includes('ext_tw_video_thumb') ||
    src.includes('amplify_video_thumb') ||
    src.includes('tweet_video_thumb') ||
    alt === 'Animated Text GIF' ||
    alt === 'Embedded video' ||
    imgElement.closest(STABLE_SELECTORS.MEDIA_PLAYERS.join(', ')) !== null ||
    imgElement.closest('a[aria-label*="video"]') !== null ||
    imgElement.closest('a[aria-label*="Video"]') !== null ||
    imgElement.closest('a[aria-label="Embedded video"]') !== null
  );
}

export function isVideoPlayer(element: HTMLElement): boolean {
  return (
    element.tagName === 'VIDEO' ||
    element.closest(STABLE_SELECTORS.MEDIA_PLAYERS.join(', ')) !== null ||
    element.closest('div[role="img"][aria-label*="video"]') !== null ||
    element.closest('div[role="img"][aria-label*="Video"]') !== null
  );
}

export function isVideoElement(element: HTMLElement): boolean {
  if (element.tagName === 'IMG') {
    return isVideoThumbnail(element as HTMLImageElement);
  }
  return isVideoPlayer(element);
}

function getCookie(name: string): string | undefined {
  if (typeof document === 'undefined' || !document.cookie) return undefined;
  const match = document.cookie.match(new RegExp(`(?<=${name}=)[^;]+`));
  return match?.[0];
}

export class TwitterAPI {
  private static _guestToken: string | undefined = undefined;
  private static _csrfToken: string | undefined = undefined;
  private static _tokensInitialized = false;
  private static readonly requestCache = new Map<string, TwitterAPIResponse>();

  private static initializeTokens(): void {
    if (!this._tokensInitialized) {
      this._guestToken = getCookie('gt');
      this._csrfToken = getCookie('ct0');
      this._tokensInitialized = true;
    }
  }

  private static get guestToken(): string | undefined {
    this.initializeTokens();
    return this._guestToken;
  }

  private static get csrfToken(): string | undefined {
    this.initializeTokens();
    return this._csrfToken;
  }

  private static async apiRequest(url: string): Promise<TwitterAPIResponse> {
    const _url = url.toString();
    if (this.requestCache.has(_url)) {
      logger.debug('Using cached API request:', _url);
      const cachedResult = this.requestCache.get(_url);
      if (cachedResult) return cachedResult;
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
        if (this.requestCache.size > 16) {
          const firstKey = this.requestCache.keys().next().value;
          if (firstKey) this.requestCache.delete(firstKey);
        }
        this.requestCache.set(_url, json);
      }
      return json;
    } catch (error) {
      logger.error('Twitter API request failed:', error);
      throw error;
    }
  }

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

  private static extractMediaFromTweet(
    tweetResult: TwitterTweet,
    tweetUser: TwitterUser
  ): TweetMediaEntry[] {
    if (!tweetResult.extended_entities?.media) return [];
    const mediaItems: TweetMediaEntry[] = [];
    const typeIndex: Record<string, number> = {};
    const screenName = tweetUser.screen_name ?? '';
    const tweetId = tweetResult.rest_id ?? tweetResult.id_str ?? '';
    for (let index = 0; index < tweetResult.extended_entities.media.length; index++) {
      const media: TwitterMedia | undefined = tweetResult.extended_entities.media[index];
      if (!media?.type || !media.id_str || !media.media_url_https) continue;
      try {
        const mediaUrl = this.getHighQualityMediaUrl(media);
        if (!mediaUrl) continue;
        const mediaType = media.type === 'animated_gif' ? 'video' : media.type;
        typeIndex[mediaType] = (typeIndex[mediaType] ?? -1) + 1;
        const tweetText = (tweetResult.full_text ?? '').replace(` ${media.url}`, '').trim();

        const dimensionsFromUrl = this.extractDimensionsFromUrl(mediaUrl);
        const widthFromOriginal = this.normalizeDimension(media.original_info?.width);
        const heightFromOriginal = this.normalizeDimension(media.original_info?.height);
        const widthFromUrl = this.normalizeDimension(dimensionsFromUrl?.width);
        const heightFromUrl = this.normalizeDimension(dimensionsFromUrl?.height);
        const resolvedWidth = widthFromOriginal ?? widthFromUrl;
        const resolvedHeight = heightFromOriginal ?? heightFromUrl;

        const aspectRatioValues = Array.isArray(media.video_info?.aspect_ratio)
          ? media.video_info?.aspect_ratio
          : undefined;
        const aspectRatioWidth = this.normalizeDimension(aspectRatioValues?.[0]);
        const aspectRatioHeight = this.normalizeDimension(aspectRatioValues?.[1]);

        const entry: TweetMediaEntry = {
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

        if (resolvedWidth) {
          entry.original_width = resolvedWidth;
        }

        if (resolvedHeight) {
          entry.original_height = resolvedHeight;
        }

        if (aspectRatioWidth && aspectRatioHeight) {
          entry.aspect_ratio = [aspectRatioWidth, aspectRatioHeight];
        } else if (resolvedWidth && resolvedHeight) {
          entry.aspect_ratio = [resolvedWidth, resolvedHeight];
        }

        mediaItems.push(entry);
      } catch (error) {
        logger.warn(`Failed to process media ${media.id_str}:`, error);
      }
    }
    return mediaItems;
  }

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
      const bestVariant = mp4Variants.reduce((best, current) => {
        const bestBitrate = best.bitrate ?? 0;
        const currentBitrate = current.bitrate ?? 0;
        return currentBitrate > bestBitrate ? current : best;
      });
      return bestVariant.url;
    }
    return null;
  }

  public static extractDimensionsFromUrl(url: string): { width: number; height: number } | null {
    if (!url) {
      return null;
    }

    const match = url.match(/\/(\d{2,6})x(\d{2,6})\//);
    if (!match) {
      return null;
    }

    const width = Number.parseInt(match[1] ?? '', 10);
    const height = Number.parseInt(match[2] ?? '', 10);

    if (!Number.isFinite(width) || width <= 0 || !Number.isFinite(height) || height <= 0) {
      return null;
    }

    return {
      width,
      height,
    };
  }

  private static normalizeDimension(value: unknown): number | undefined {
    if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
      return Math.round(value);
    }

    if (typeof value === 'string') {
      const parsed = Number.parseFloat(value);
      if (Number.isFinite(parsed) && parsed > 0) {
        return Math.round(parsed);
      }
    }

    return undefined;
  }

  public static async getTweetMedias(tweetId: string): Promise<TweetMediaEntry[]> {
    const url = this.createTweetJsonEndpointUrlByRestId(tweetId);
    const json = await this.apiRequest(url);
    if (!json.data?.tweetResult?.result) return [];
    let tweetResult = json.data.tweetResult.result;
    if (tweetResult.tweet) tweetResult = tweetResult.tweet;
    const tweetUser = tweetResult.core?.user_results?.result;
    // Inline legacy normalization
    if (tweetResult.legacy) {
      if (!tweetResult.extended_entities && tweetResult.legacy.extended_entities) {
        tweetResult.extended_entities = tweetResult.legacy.extended_entities;
      }
      if (!tweetResult.full_text && tweetResult.legacy.full_text) {
        tweetResult.full_text = tweetResult.legacy.full_text;
      }
      if (!tweetResult.id_str && tweetResult.legacy.id_str) {
        tweetResult.id_str = tweetResult.legacy.id_str;
      }
    }
    if (!tweetUser) return [];
    if (tweetUser.legacy) {
      if (!tweetUser.screen_name && tweetUser.legacy.screen_name) {
        tweetUser.screen_name = tweetUser.legacy.screen_name;
      }
      if (!tweetUser.name && tweetUser.legacy.name) {
        tweetUser.name = tweetUser.legacy.name;
      }
    }
    let result = this.extractMediaFromTweet(tweetResult, tweetUser);
    if (tweetResult.quoted_status_result?.result) {
      const quotedTweet = tweetResult.quoted_status_result.result;
      const quotedUser = quotedTweet.core?.user_results?.result;
      if (quotedTweet && quotedUser) {
        if (quotedTweet.legacy) {
          if (!quotedTweet.extended_entities && quotedTweet.legacy.extended_entities) {
            quotedTweet.extended_entities = quotedTweet.legacy.extended_entities;
          }
          if (!quotedTweet.full_text && quotedTweet.legacy.full_text) {
            quotedTweet.full_text = quotedTweet.legacy.full_text;
          }
          if (!quotedTweet.id_str && quotedTweet.legacy.id_str) {
            quotedTweet.id_str = quotedTweet.legacy.id_str;
          }
        }
        if (quotedUser.legacy) {
          if (!quotedUser.screen_name && quotedUser.legacy.screen_name) {
            quotedUser.screen_name = quotedUser.legacy.screen_name;
          }
          if (!quotedUser.name && quotedUser.legacy.name) {
            quotedUser.name = quotedUser.legacy.name;
          }
        }
        // 인용 트윗의 미디어를 먼저 배치
        result = [...this.extractMediaFromTweet(quotedTweet, quotedUser), ...result];
      }
    }
    return result;
  }
}

export function extractTweetId(url: string): string | null {
  const match = url.match(/(?<=\/status\/)\d+/);
  return match?.[0] ?? null;
}

export function getTweetIdFromContainer(container: HTMLElement): string | null {
  const links = container.querySelectorAll('a[href*="/status/"], time');
  for (const element of links) {
    let href: string | null = null;
    if (element.tagName === 'A') {
      href = (element as HTMLAnchorElement).href;
    } else if (element.tagName === 'TIME') {
      const parentLink = element.closest('a[href*="/status/"]');
      if (parentLink) href = (parentLink as HTMLAnchorElement).href;
    }
    if (href) {
      if (href.startsWith('/')) href = `https://x.com${href}`;
      const tweetId = extractTweetId(href);
      if (tweetId) return tweetId;
    }
  }
  const dataElements = container.querySelectorAll('[data-tweet-id], [aria-label]');
  for (const element of dataElements) {
    const dataTweetId = element.getAttribute('data-tweet-id');
    if (dataTweetId && /^\d{15,20}$/.test(dataTweetId)) return dataTweetId;
    const ariaLabel = element.getAttribute('aria-label');
    if (ariaLabel) {
      const match = ariaLabel.match(/\b(\d{15,20})\b/);
      if (match?.[1]) return match[1];
    }
  }
  const textContent = container.textContent ?? '';
  const textMatch = textContent.match(/\b(\d{15,20})\b/);
  if (textMatch?.[1]) return textMatch[1];
  if (window.location.pathname.includes('/status/')) {
    return extractTweetId(window.location.href);
  }
  return null;
}

export async function getVideoMediaEntry(
  tweetId: string,
  thumbnailUrl?: string
): Promise<TweetMediaEntry | null> {
  try {
    const medias = await TwitterAPI.getTweetMedias(tweetId);
    const videoMedias = medias.filter(media => media.type === 'video');
    if (videoMedias.length === 0) return null;
    if (thumbnailUrl) {
      const normalizedThumbnail = thumbnailUrl.replace(/\?.*$/, '');
      const matchedVideo = videoMedias.find(media =>
        media.preview_url.startsWith(normalizedThumbnail)
      );
      if (matchedVideo) return matchedVideo;
    }
    return videoMedias[0] ?? null;
  } catch (error) {
    logger.error('Failed to get video media entry:', error);
    return null;
  }
}

export async function getVideoUrlFromThumbnail(
  imgElement: HTMLImageElement,
  tweetContainer: HTMLElement
): Promise<string | null> {
  if (!isVideoThumbnail(imgElement)) return null;
  const tweetId = getTweetIdFromContainer(tweetContainer);
  if (!tweetId) {
    logger.warn('Cannot extract tweet ID from container');
    return null;
  }
  const videoEntry = await getVideoMediaEntry(tweetId, imgElement.src);
  return videoEntry?.download_url ?? null;
}
