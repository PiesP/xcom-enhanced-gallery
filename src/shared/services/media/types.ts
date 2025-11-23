/**
 * Twitter Media Types and API Response Structures
 *
 * @fileoverview Type definitions for Twitter/X.com API responses and media data.
 *
 * **Purpose**:
 * - Type-safe Twitter API response handling
 * - Unified media representation (TweetMediaEntry)
 * - Support for photos, videos, and animated GIFs
 * - Quote tweet media source tracking (Phase 342)
 *
 * **Type Hierarchy**:
 * - TwitterAPIResponse (API envelope)
 *   └─ TwitterTweet (tweet data with optional media)
 *      ├─ extended_entities (photo/video arrays)
 *      ├─ quoted_status_result (quote tweet)
 *      └─ legacy (v1.1 API compatibility)
 *
 * **Media Types**:
 * - TweetMediaEntry: Unified representation (photo, video, animated_gif)
 * - TwitterMedia: Raw API response format
 * - TwitterUser: Author information
 *
 * **Architecture Integration** (Phase 309):
 * - Used by TwitterAPI class for response parsing
 * - Used by media extraction services
 * - Used by gallery components for media display
 *
 * **Version History**:
 * - v1.0.0: Phase 291 (TwitterVideoExtractor split)
 * - v1.1.0: Phase 342 (Quote tweet support)
 *
 * @example
 * ```typescript
 * // API response structure
 * const response: TwitterAPIResponse = {
 *   data: {
 *     tweetResult: {
 *       result: { tweet: { ... } }
 *     }
 *   }
 * };
 *
 * // Unified media entry
 * const media: TweetMediaEntry = {
 *   screen_name: 'user123',
 *   tweet_id: '1234567890',
 *   download_url: 'https://...',
 *   type: 'photo' | 'video',
 *   index: 0,
 *   sourceLocation: 'original' // Phase 342
 * };
 * ```
 */

/**
 * Twitter API Response Envelope
 *
 * Top-level response structure from Twitter's GraphQL API endpoint.
 *
 * **Structure**:
 * - data.tweetResult.result: TwitterTweet object (may contain nested tweet)
 *
 * **Example**:
 * ```json
 * {
 *   "data": {
 *     "tweetResult": {
 *       "result": {
 *         "rest_id": "1234567890",
 *         "core": { "user_results": { "result": { ... } } },
 *         "extended_entities": { "media": [ ... ] }
 *       }
 *     }
 *   }
 * }
 * ```
 *
 * @see TwitterTweet
 */
export interface TwitterAPIResponse {
  data?: {
    tweetResult?: {
      result?: TwitterTweet;
    };
  };
  errors?: Array<{ message: string; code: number; [key: string]: unknown }>;
}

/**
 * Twitter Tweet Data Structure
 *
 * Represents a tweet with all associated metadata.
 *
 * **Media Location**:
 * - extended_entities: Primary media array (multiple photos/videos)
 * - legacy.extended_entities: Fallback for older tweets
 *
 * **Quote Tweet Support** (Phase 342):
 * - quoted_status_result: Nested tweet (for quote tweets)
 *
 * **Text Content**:
 * - full_text: Complete tweet text (if not a retweet)
 * - note_tweet: Rich text note (X Premium feature)
 *
 * **User Information**:
 * - core.user_results.result: Author's user profile
 *
 * @see TwitterMedia
 * @see TwitterUser
 */
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
        richtext?: {
          richtext_tags?: Array<unknown>;
        };
        media?: {
          inline_media?: Array<unknown>;
        };
      };
    };
  };
  quoted_status_result?: {
    result?: TwitterTweet;
  };
  legacy?: {
    extended_entities?: { media?: TwitterMedia[] } | undefined;
    full_text?: string | undefined;
    id_str?: string | undefined;
  };
}

/**
 * Twitter User Profile Information
 *
 * Author/owner information attached to tweets.
 *
 * **Properties**:
 * - rest_id: Numeric user ID (Twitter ID)
 * - screen_name: Username handle (without @)
 * - name: Display name
 * - legacy: Fallback for older API responses
 *
 * **Example**:
 * ```typescript
 * const user: TwitterUser = {
 *   rest_id: '12345',
 *   screen_name: 'user123',
 *   name: 'User Display Name'
 * };
 * ```
 */
export interface TwitterUser {
  rest_id?: string;
  screen_name?: string;
  name?: string;
  legacy?: {
    screen_name?: string;
    name?: string;
  };
}

/**
 * Twitter Media Object (API Format)
 *
 * Raw media representation from Twitter API.
 *
 * **Media Types**:
 * - 'photo': Static image
 * - 'video': MP4 video
 * - 'animated_gif': GIF-like looping video (no sound)
 *
 * **Properties**:
 * - media_url_https: Preview/thumbnail URL
 * - expanded_url: Full Twitter URL with /photo/N or /video/N
 * - video_info.variants: Different bitrate/format options
 * - original_info: Width/height dimensions
 *
 * **Bitrate Variants** (video_info.variants):
 * - content_type 'video/mp4': MP4 video stream
 * - content_type 'application/x-mpegURL': HLS playlist
 * - bitrate (optional): Stream quality indicator
 *
 * **Example**:
 * ```typescript
 * const media: TwitterMedia = {
 *   type: 'video',
 *   media_url_https: 'https://pbs.twimg.com/media/...',
 *   expanded_url: 'https://twitter.com/.../video/1',
 *   video_info: {
 *     variants: [
 *       { content_type: 'video/mp4', bitrate: 2176000, url: '...' },
 *       { content_type: 'video/mp4', bitrate: 832000, url: '...' }
 *     ]
 *   }
 * };
 * ```
 */
export interface TwitterMedia {
  type: "photo" | "video" | "animated_gif";
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

/**
 * Unified Media Entry (Application Format)
 *
 * Normalized media representation for gallery and download operations.
 *
 * **Purpose**:
 * - Single interface for all media types (photo, video, animated_gif)
 * - Enhanced with metadata (typeIndex, download_url)
 * - Supports quote tweet tracking (Phase 342)
 *
 * **Core Properties**:
 * - screen_name: Tweet author
 * - tweet_id: Tweet numeric ID
 * - download_url: Direct media URL (for download)
 * - type: Normalized type ('photo' | 'video')
 * - index: Position in tweet (0-3 for 4-image tweet)
 *
 * **Type Information**:
 * - type: Normalized ('photo' | 'video')
 * - typeOriginal: Original API value ('photo' | 'video' | 'animated_gif')
 * - typeIndex: Position among same type (0, 1, 2...)
 * - typeIndexOriginal: Same for original type
 *
 * **Phase 342 (Quote Tweet Support)**:
 * - sourceLocation: 'original' or 'quoted' tweet
 * - quotedTweetId: Quote tweet ID (if from quote)
 * - quotedScreenName: Quote tweet author
 * - originalTweetId: Original tweet ID (if retweet)
 *
 * **Example**:
 * ```typescript
 * const entry: TweetMediaEntry = {
 *   screen_name: 'user123',
 *   tweet_id: '1234567890',
 *   download_url: 'https://pbs.twimg.com/media/...:orig',
 *   type: 'photo',
 *   typeOriginal: 'photo',
 *   index: 1,
 *   typeIndex: 1,
 *   sourceLocation: 'original',  // Phase 342
 *   preview_url: 'https://pbs.twimg.com/media/...'
 * };
 * ```
 *
 * @see TwitterMedia
 * @see TwitterTweet
 */

export interface TweetMediaEntry {
  screen_name: string;
  tweet_id: string;
  download_url: string;
  type: "photo" | "video";
  typeOriginal: "photo" | "video" | "animated_gif";
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
  /**
   * Media source location (Phase 342: Quote Tweet Support)
   *
   * Indicates whether media comes from original tweet or quoted tweet.
   *
   * **Values**:
   * - 'original': Media from main tweet (typical case)
   * - 'quoted': Media from nested quoted tweet
   * - undefined: Unknown (default for backward compatibility)
   *
   * **Use Case**:
   * When user quotes a tweet with media, both tweets may contain media.
   * sourceLocation disambiguates which tweet owns the media.
   */
  sourceLocation?: "original" | "quoted" | undefined;

  /**
   * Quoted tweet ID (Phase 342: Quote Tweet Support)
   *
   * If this media comes from a quote tweet, this contains the quoted tweet's ID.
   * undefined for media from original tweets.
   */
  quotedTweetId?: string | undefined;

  /**
   * Quoted tweet author (Phase 342: Quote Tweet Support)
   *
   * Username of the quoted tweet author (if sourceLocation='quoted').
   * Useful for attribution in gallery UI.
   */
  quotedScreenName?: string | undefined;

  /**
   * Original tweet ID (Phase 342: Quote Tweet Support)
   *
   * For quote tweets, this is the main tweet ID.
   * For original tweets, same as tweet_id.
   */
  originalTweetId?: string | undefined;
}
