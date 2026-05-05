/**
 * @fileoverview Re-export from gallery.signals for backward compatibility.
 * UI state signals are now inlined in gallery.signals.ts.
 */

import { gallerySignals } from '@shared/state/signals/gallery.signals';

export type { ViewMode } from '@shared/state/signals/gallery.signals';
export { setError } from '@shared/state/signals/gallery.signals';
export const uiSignals = gallerySignals;
export default uiSignals;
