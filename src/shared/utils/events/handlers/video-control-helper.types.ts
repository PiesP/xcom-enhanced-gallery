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
 * Options for video control operations
 */
export interface VideoControlOptions {
  /** Video element to control (uses current gallery video if omitted) */
  readonly video?: HTMLVideoElement | null;
  /** Logging context identifier */
  readonly context?: string;
}
