/**
 * Twitter Media Types and API Response Structures
 * @module @shared/services/media/types
 * @version 2.0.0 - Added inline media types for note_tweet support
 */

/** Twitter API response envelope */
export interface TwitterAPIResponse {
  data?: {
    tweetResult?: {
      result?: TwitterTweet;
    };
  };
  errors?: Array<{ message: string; code: number; [key: string]: unknown }>;
}

/** Inline media reference in note_tweet */
interface TwitterInlineMedia {
  media_id: string;
  index: number;
}

/** Tweet data structure */
export interface TwitterTweet {
  __typename?: string;
  tweet?: TwitterTweet;
  rest_id?: string;
  core?: {
    user_results?: {
      result?: TwitterUser;
    };
  };
  extended_entities?: { media?: TwitterMedia[] };
  full_text?: string;
  id_str?: string;
  note_tweet?: {
    is_expandable?: boolean;
    note_tweet_results?: {
      result?: {
        id?: string;
        text?: string;
        entity_set?: {
          urls?: Array<{
            url: string;
            expanded_url: string;
            display_url: string;
          }>;
          hashtags?: Array<{ text: string }>;
          user_mentions?: Array<{ screen_name: string }>;
        };
        richtext?: { richtext_tags?: Array<unknown> };
        media?: {
          inline_media?: TwitterInlineMedia[];
        };
      };
    };
  };
  quoted_status_result?: { result?: TwitterTweet };
  legacy?: {
    extended_entities?: { media?: TwitterMedia[] };
    full_text?: string;
    id_str?: string;
  };
}

/** Twitter user profile */
export interface TwitterUser {
  rest_id?: string;
  screen_name?: string;
  name?: string;
  legacy?: {
    screen_name?: string;
    name?: string;
  };
}

/** Twitter media object (API format) */
export interface TwitterMedia {
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

/** Unified media entry (application format) */
export interface TweetMediaEntry {
  screen_name: string;
  tweet_id: string;
  download_url: string;
  type: 'photo' | 'video';
  typeOriginal: 'photo' | 'video' | 'animated_gif';
  index: number;
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
  /** Media source: 'original' | 'quoted' */
  sourceLocation?: 'original' | 'quoted';
  /** Quoted tweet ID (if from quote) */
  quotedTweetId?: string;
  /** Quoted tweet author */
  quotedScreenName?: string;
  /** Original tweet ID (for quote tweets) */
  originalTweetId?: string;
}
