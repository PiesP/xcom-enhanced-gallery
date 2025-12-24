/**
 * Shared PersistentStorage type contracts.
 *
 * Important: this project swaps implementations via Vite aliasing in production.
 * Keep the public API shape identical between the full and slim variants.
 */

export interface PersistentStorageGetOptions {
  /**
   * When JSON parsing fails, log a warning only once per key to improve observability
   * without creating noisy logs.
   *
   * Full implementation only. Slim builds may ignore this option.
   *
   * @default true
   */
  readonly warnOnParseErrorOnce?: boolean;

  /**
   * When JSON parsing fails, attempt to delete the key to self-heal corrupted values.
   * This is opt-in because some keys may intentionally store non-JSON strings.
   *
   * @default false
   */
  readonly selfHealOnParseError?: boolean;
}
