/**
 * @fileoverview Guard for distinguishing programmatic vs user-driven video volume changes.
 *
 * The browser fires `volumechange` events for both user interactions (video controls)
 * and programmatic assignments (e.g., restoring state, auto-muting off-screen videos).
 *
 * This helper allows callers to mark an expected programmatic (volume, muted) pair
 * and ignore the matching `volumechange` event(s) within a short time window.
 */

/** Video volume and muted state snapshot for comparison */
export interface VideoVolumeSnapshot {
  readonly volume: number;
  readonly muted: boolean;
}

/** Guard to identify and ignore programmatic volume changes */
export interface VideoVolumeChangeGuard {
  markProgrammaticChange(expected: VideoVolumeSnapshot): void;
  shouldIgnoreChange(current: VideoVolumeSnapshot): boolean;
}

/** Configuration for volume change guard (windowMs: max age in milliseconds, default 500) */
export interface CreateVideoVolumeChangeGuardOptions {
  readonly windowMs?: number;
}

const DEFAULT_VOLUME_EPSILON = 1e-3;

/** Compare volume values with epsilon for rounding tolerance */
function areVolumesEquivalent(a: number, b: number): boolean {
  if (!Number.isFinite(a) || !Number.isFinite(b)) {
    return a === b;
  }
  return Math.abs(a - b) <= DEFAULT_VOLUME_EPSILON;
}

/** Monotonic timestamp in milliseconds (performance.now() with Date.now() fallback) */
function nowMs(): number {
  // `performance.now()` is monotonic; fall back to Date.now() where unavailable.
  return typeof performance !== 'undefined' && typeof performance.now === 'function'
    ? performance.now()
    : Date.now();
}

export function createVideoVolumeChangeGuard(
  options: CreateVideoVolumeChangeGuardOptions = {}
): VideoVolumeChangeGuard {
  const windowMsInput = options.windowMs;
  const windowMs =
    typeof windowMsInput === 'number' && Number.isFinite(windowMsInput)
      ? Math.max(0, windowMsInput)
      : 500;

  type ExpectedMark = {
    readonly snapshot: VideoVolumeSnapshot;
    readonly markedAt: number;
  };

  // Keep a small window of recent programmatic expectations.
  // This makes the guard resilient to:
  // - browsers firing `volumechange` more than once for the same state
  // - sequential programmatic assignments (muted + volume) whose events may arrive out-of-order
  const MAX_EXPECTED_MARKS = 4 as const;

  let expectedMarks: ExpectedMark[] = [];

  const pruneExpiredMarks = (now: number): void => {
    if (expectedMarks.length === 0) return;
    expectedMarks = expectedMarks.filter((mark) => {
      const age = now - mark.markedAt;
      // If time goes backwards (or is stubbed inconsistently), treat marks as expired.
      if (age < 0) return false;
      return age <= windowMs;
    });
  };

  return {
    markProgrammaticChange(expected) {
      const now = nowMs();
      pruneExpiredMarks(now);

      expectedMarks = [...expectedMarks, { snapshot: expected, markedAt: now }];
      if (expectedMarks.length > MAX_EXPECTED_MARKS) {
        expectedMarks = expectedMarks.slice(-MAX_EXPECTED_MARKS);
      }
    },

    shouldIgnoreChange(current) {
      if (expectedMarks.length === 0) return false;

      const now = nowMs();
      pruneExpiredMarks(now);

      if (expectedMarks.length === 0) {
        return false;
      }

      // Within the window, ignore *all* events that match any expected snapshot.
      // Do not clear on match: some browsers may emit multiple identical events.
      return expectedMarks.some(
        (mark) =>
          areVolumesEquivalent(current.volume, mark.snapshot.volume) &&
          current.muted === mark.snapshot.muted
      );
    },
  };
}
