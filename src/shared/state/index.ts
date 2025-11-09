/**
 * Barrel exports removed in Phase 371.
 *
 * Import state helpers from their dedicated modules instead:
 * - `@shared/state/signals/gallery.signals`
 * - `@shared/state/signals/toolbar.signals`
 * - `@shared/state/signals/download.signals`
 * - `@shared/state/signals/signal-factory`
 *
 * This placeholder remains to avoid breaking relative imports that still reference
 * `@shared/state`. No public API is re-exported from here.
 */

export {};
