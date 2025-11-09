/**
 * Deprecated barrel removed in Phase 371.
 *
 * The signals module now expects consumers to import from the specific signal files
 * (e.g. `@shared/state/signals/gallery.signals`).
 *
 * This empty module remains to avoid breaking bare path resolution while we migrate
 * existing call sites. Intentionally exporting nothing keeps tree-shaking optimal.
 */

export {};
