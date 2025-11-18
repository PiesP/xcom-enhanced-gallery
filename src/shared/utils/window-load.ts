// Deprecated utility removed.

export interface WaitForWindowLoadOptions {
  /** @deprecated No longer used. */
  timeoutMs?: number;
  /** @deprecated No longer used. */
  forceEventPath?: boolean;
}

/**
 * @deprecated Window-load deferral has been removed. This helper now resolves immediately.
 */
export function waitForWindowLoad(_options: WaitForWindowLoadOptions = {}): Promise<boolean> {
  return Promise.resolve(true);
}
// Deprecated utility removed.
