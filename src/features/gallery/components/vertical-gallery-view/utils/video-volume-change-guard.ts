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

const DEFAULT_VOLUME_EPSILON = 1e-3;

function areVolumesEquivalent(a: number, b: number): boolean {
  if (!Number.isFinite(a) || !Number.isFinite(b)) {
    return a === b;
  }
  return Math.abs(a - b) <= DEFAULT_VOLUME_EPSILON;
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

  type ExpectedMark = {
    readonly snapshot: VideoVolumeSnapshot;
    readonly markedAt: number;
  };

  // Keep a small window of recent programmatic expectations.
  // This makes the guard resilient to:
  // - browsers firing `volumechange` more than once for the same state
  // - sequential programmatic assignments (muted + volume) whose events may arrive out-of-order
  const MAX_EXPECTED_MARKS = 4;

  let expectedMarks: ExpectedMark[] = [];

  const pruneExpiredMarks = (now: number) => {
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
