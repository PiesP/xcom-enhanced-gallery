/**
 * @fileoverview Guard for distinguishing programmatic vs user-driven video volume changes.
 *
 * The browser fires `volumechange` events for both user interactions (video controls)
 * and programmatic assignments (e.g., restoring state, auto-muting off-screen videos).
 *
 * This helper allows callers to mark an expected programmatic (volume, muted) pair
 * and ignore the matching `volumechange` event(s) within a short time window.
 */

export interface VideoVolumeSnapshot {
  readonly volume: number;
  readonly muted: boolean;
}

export interface VideoVolumeChangeGuard {
  /** Mark a programmatic change and the exact expected resulting state. */
  markProgrammaticChange(expected: VideoVolumeSnapshot): void;

  /** Return true when the change should be ignored as programmatic noise. */
  shouldIgnoreChange(current: VideoVolumeSnapshot): boolean;
}

export interface CreateVideoVolumeChangeGuardOptions {
  /**
   * Maximum age of a programmatic mark (milliseconds).
   *
   * @default 500
   */
  readonly windowMs?: number;
}

function nowMs(): number {
  // `performance.now()` is monotonic; fall back to Date.now() where unavailable.
  return typeof performance !== 'undefined' && typeof performance.now === 'function'
    ? performance.now()
    : Date.now();
}

export function createVideoVolumeChangeGuard(
  options: CreateVideoVolumeChangeGuardOptions = {}
): VideoVolumeChangeGuard {
  const windowMs = options.windowMs ?? 500;

  let lastExpected: VideoVolumeSnapshot | null = null;
  let lastMarkedAt = 0;

  return {
    markProgrammaticChange(expected) {
      lastExpected = expected;
      lastMarkedAt = nowMs();
    },

    shouldIgnoreChange(current) {
      if (!lastExpected) return false;

      const age = nowMs() - lastMarkedAt;
      if (age < 0 || age > windowMs) return false;

      const matches =
        current.volume === lastExpected.volume && current.muted === lastExpected.muted;

      // One-shot: once the expected programmatic event is observed, clear it.
      if (matches) {
        lastExpected = null;
        lastMarkedAt = 0;
      }

      return matches;
    },
  };
}
