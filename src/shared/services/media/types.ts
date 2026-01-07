/**
 * Twitter Media Types and API Response Structures
 * @module @shared/services/media/types
 * @version 2.0.0 - Added inline media types for note_tweet support
 */

/** Twitter API response envelope */
export interface TwitterAPIResponse {
  readonly data?: {
    readonly tweetResult?: {
      readonly result?: TwitterTweet;
    };
  };
  readonly errors?: Array<{ message: string; code: number; [key: string]: unknown }>;
}

/** Inline media reference in note_tweet */
interface TwitterInlineMedia {
  readonly media_id: string;
  readonly index: number;
}

/** Tweet data structure */
export interface TwitterTweet {
  readonly __typename?: string;
  readonly tweet?: TwitterTweet;
  readonly rest_id?: string;
  readonly core?: {
    readonly user_results?: {
      readonly result?: TwitterUser;
    };
  };
  readonly extended_entities?: { readonly media?: TwitterMedia[] };
  readonly full_text?: string;
  readonly id_str?: string;
  readonly note_tweet?: {
    readonly is_expandable?: boolean;
    readonly note_tweet_results?: {
      readonly result?: {
        readonly id?: string;
        readonly text?: string;
        readonly entity_set?: {
          readonly urls?: Array<{
            readonly url: string;
            readonly expanded_url: string;
            readonly display_url: string;
          }>;
          readonly hashtags?: Array<{ readonly text: string }>;
          readonly user_mentions?: Array<{ readonly screen_name: string }>;
        };
        readonly richtext?: { readonly richtext_tags?: Array<unknown> };
        readonly media?: {
          readonly inline_media?: TwitterInlineMedia[];
        };
      };
    };
  };
  readonly quoted_status_result?: { readonly result?: TwitterTweet };
  readonly legacy?: {
    readonly extended_entities?: { readonly media?: TwitterMedia[] };
    readonly full_text?: string;
    readonly id_str?: string;
  };
}

/** Twitter user profile */
export interface TwitterUser {
  readonly rest_id?: string;
  readonly screen_name?: string;
  readonly name?: string;
  readonly legacy?: {
    readonly screen_name?: string;
    readonly name?: string;
  };
}

/** Twitter media object (API format) */
export interface TwitterMedia {
  readonly type: 'photo' | 'video' | 'animated_gif';
  readonly id_str: string;
  readonly media_key?: string;
  readonly media_url_https: string;
  readonly expanded_url?: string;
  readonly display_url?: string;
  readonly url?: string;
  readonly video_info?: {
    readonly aspect_ratio?: [number, number];
    readonly variants: Array<{
      readonly bitrate?: number;
      readonly url: string;
      readonly content_type: string;
    }>;
  };
  readonly original_info?: {
    readonly height?: number;
    readonly width?: number;
  };
}

/** Unified media entry (application format) */
export interface TweetMediaEntry {
  readonly screen_name: string;
  readonly tweet_id: string;
  readonly download_url: string;
  readonly type: 'photo' | 'video';
  readonly typeOriginal: 'photo' | 'video' | 'animated_gif';
  readonly index: number;
  readonly preview_url: string;
  readonly media_id: string;
  readonly media_key: string;
  readonly expanded_url: string;
  readonly short_expanded_url: string;
  readonly short_tweet_url: string;
  readonly tweet_text: string;
  readonly original_width?: number;
  readonly original_height?: number;
  readonly aspect_ratio?: [number, number];
  /** Media source: 'original' | 'quoted' */
  readonly sourceLocation?: 'original' | 'quoted';
  /** Quoted tweet ID (if from quote) */
  readonly quotedTweetId?: string;
  /** Quoted tweet author */
  readonly quotedScreenName?: string;
  /** Original tweet ID (for quote tweets) */
  readonly originalTweetId?: string;
}
