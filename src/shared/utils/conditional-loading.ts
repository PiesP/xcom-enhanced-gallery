/**
 * @fileoverview Feature flag utilities
 * @description Lightweight helpers for evaluating user-facing feature flags.
 */

// ─────────────────────────────────────────
// Types & constants
// ─────────────────────────────────────────

/**
 * Supported feature keys.
 * Only user-facing features remain; telemetry/dev hooks are excluded from production bundles.
 */
export type FeatureKey =
  | "gallery"
  | "settings"
  | "download"
  | "mediaExtraction"
  | "accessibility";

/**
 * Ordered list of feature keys (preserves deterministic logging/tests).
 */
export const FEATURE_KEYS: readonly FeatureKey[] = [
  "gallery",
  "settings",
  "download",
  "mediaExtraction",
  "accessibility",
] as const;

/**
 * Minimal settings shape required for feature evaluation.
 * We intentionally allow unknown keys for forward compatibility.
 */
export interface SettingsWithFeatures {
  features: Record<string, boolean | undefined>;
}

const DEFAULT_FEATURE_STATE: Record<FeatureKey, boolean> = {
  gallery: true,
  settings: true,
  download: true,
  mediaExtraction: true,
  accessibility: true,
};

function coerceBoolean(value: unknown, fallback: boolean): boolean {
  if (typeof value === "boolean") {
    return value;
  }
  return fallback;
}

function readFlag(
  settings: SettingsWithFeatures | null | undefined,
  feature: FeatureKey,
): boolean {
  const source = settings?.features ?? {};
  return coerceBoolean(source[feature], DEFAULT_FEATURE_STATE[feature]);
}

// ─────────────────────────────────────────
// Public helpers
// ─────────────────────────────────────────

/**
 * Returns the enabled/disabled status for a specific feature.
 */
export function getFeatureStatus(
  settings: SettingsWithFeatures,
  feature: FeatureKey,
): boolean {
  return readFlag(settings, feature);
}

/**
 * Returns a normalized feature map to simplify downstream checks.
 */
export function resolveFeatureStates(
  settings?: SettingsWithFeatures | null,
): Record<FeatureKey, boolean> {
  return FEATURE_KEYS.reduce<Record<FeatureKey, boolean>>(
    (state, key) => {
      state[key] = readFlag(settings ?? undefined, key);
      return state;
    },
    {} as Record<FeatureKey, boolean>,
  );
}

/**
 * Returns a list of enabled feature keys in deterministic order.
 */
export function getEnabledFeatures(
  settings: SettingsWithFeatures,
): FeatureKey[] {
  return FEATURE_KEYS.filter((key) => readFlag(settings, key));
}

/**
 * Returns a list of disabled feature keys in deterministic order.
 */
export function getDisabledFeatures(
  settings: SettingsWithFeatures,
): FeatureKey[] {
  return FEATURE_KEYS.filter((key) => !readFlag(settings, key));
}

/**
 * Convenience helper used primarily by tests to assert group membership.
 */
export function areAllFeaturesEnabled(
  settings: SettingsWithFeatures,
  features: FeatureKey[],
): boolean {
  return features.every((feature) => readFlag(settings, feature));
}
