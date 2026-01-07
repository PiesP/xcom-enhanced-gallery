/**
 * @fileoverview Type definitions for video control operations
 */

/**
 * Supported video control actions
 */
export type VideoControlAction =
  | 'play'
  | 'pause'
  | 'togglePlayPause'
  | 'volumeUp'
  | 'volumeDown'
  | 'mute'
  | 'toggleMute';

/**
 * Options for executing video control actions
 */
export interface VideoControlOptions {
  /** Video element to control. If not provided, uses current gallery video */
  readonly video?: HTMLVideoElement | null;
  /** Context identifier for logging and debugging */
  readonly context?: string;
}

/**
 * Video playback state record stored in WeakMap
 * Tracks whether video is currently playing when Service is unavailable
 *
 * @internal
 */
export interface VideoPlaybackState {
  /** Whether video is currently in playing state */
  readonly playing: boolean;
}
