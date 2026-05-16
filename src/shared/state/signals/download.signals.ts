/**
 * Download state management with signals.
 * Simplified to only track isProcessing flag — full task tracking was unused.
 */

import { createSignal } from 'solid-js';

const [_isProcessing, setIsProcessing] = createSignal<boolean>(false);

export function acquireDownloadLock(): (() => void) | null {
  if (_isProcessing()) return null; // Already locked — prevent re-entry
  setIsProcessing(true);
  return () => {
    setIsProcessing(false);
  };
}

export const downloadState = {
  get value(): { isProcessing: boolean } {
    return { isProcessing: _isProcessing() };
  },
};
