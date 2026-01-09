/**
 * @fileoverview App Global Types
 *
 * App-level type definitions: AppConfig, Brand types, DeepPartial, Optional, Option.
 */

/** Application configuration **/
export interface AppConfig {
  readonly version: string;
  readonly isDevelopment: boolean;
  readonly debug: boolean;
  readonly autoStart: boolean;
}

// Utility types
/** Option type - T or null */
export type Option<T> = T | null;

/** Optional - T or undefined */
export type Optional<T> = T | undefined;

/** Deep Partial - all nested properties become optional */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// Brand types
/** Brand type base structure - compile-time type safety **/
export type Brand<T, B> = T & { readonly __brand: B };

/** User ID */
export type UserId = Brand<string, 'UserId'>;
/** Tweet ID */
export type TweetId = Brand<string, 'TweetId'>;
/** Service key */
export type ServiceKey = Brand<string, 'ServiceKey'>;
/** Element ID */
export type ElementId = Brand<string, 'ElementId'>;
/** Media URL */
export type MediaUrl = Brand<string, 'MediaUrl'>;
/** Thumbnail URL */
export type ThumbnailUrl = Brand<string, 'ThumbnailUrl'>;
/** Original URL */
export type OriginalUrl = Brand<string, 'OriginalUrl'>;
/** Filename */
export type FileName = Brand<string, 'FileName'>;
/** File extension */
export type FileExtension = Brand<string, 'FileExtension'>;

/** Component Types */
export type {
  BaseComponentProps,
  ComponentChildren,
  ComponentType,
  CSSProperties,
  VNode,
} from './component.types';
// Lifecycle/Cleanup Types
export type { Cleanupable } from './lifecycle.types';
// Media Types
export type {
  APIExtractor,
  ExtractionStrategy,
  GalleryRenderOptions,
  MediaEntity,
  MediaExtractionOptions,
  MediaExtractionResult,
  MediaExtractor,
  MediaId,
  MediaInfo,
  MediaInfoWithFilename,
  QuoteTweetInfo,
  TweetInfo,
} from './media.types';
export { ExtractionError, ExtractionSource, PageType } from './media.types';
// Navigation Types
export type { NavigationSource } from './navigation.types';
// Result and Error Codes
export type { AsyncResult, Result } from './result.types';
export { ErrorCode, failure, isSuccess, success } from './result.types';
// Toolbar UI State Types
export type { FitMode, ToolbarActions, ToolbarDataState, ToolbarState } from './toolbar.types';
// UI/Theme Types
export type {
  AnimationConfig,
  AsyncState,
  ButtonSize,
  ButtonVariant,
  ColorVariant,
  FilenameStrategy,
  GalleryTheme,
  GlobalConfig,
  ImageFitMode,
  ImageFitOptions,
  LoadingState,
  MediaFileExtension,
  Theme,
} from './ui.types';
