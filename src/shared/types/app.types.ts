/**
 * @fileoverview App Global Types
 *
 * App-level type definitions: AppConfig and re-exports.
 */

/** Application configuration **/
export interface AppConfig {
  readonly version: string;
  readonly isDevelopment: boolean;
  readonly debug: boolean;
  readonly autoStart: boolean;
}

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
// Media Types
export { ExtractionError, ExtractionSource, PageType } from './media.types';
// Navigation Types
export type { NavigationSource } from './navigation.types';
export type { AsyncResult, Result } from './result.types';
// Result and Error Codes
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
