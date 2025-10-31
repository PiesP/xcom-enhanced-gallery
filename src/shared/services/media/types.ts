/**
 * @fileoverview Twitter Media Types
 * @description Twitter API 응답 및 미디어 관련 타입 정의
 * @version 1.0.0 - Phase 291: TwitterVideoExtractor 분할
 */

export interface TwitterAPIResponse {
  data?: {
    tweetResult?: {
      result?: TwitterTweet;
    };
  };
}

export interface TwitterTweet {
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

export interface TwitterUser {
  rest_id?: string;
  screen_name?: string;
  name?: string;
  legacy?: {
    screen_name?: string;
    name?: string;
  };
}

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
