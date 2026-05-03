/**
 * Download state management with signals.
 * Simplified to only track isProcessing flag — full task tracking was unused.
 */

import { createSignalSafe } from './signal-factory';

const [_isProcessing, setIsProcessing] = createSignalSafe<boolean>(false);

export function acquireDownloadLock(): () => void {
  setIsProcessing(true);
  return () => {
    setIsProcessing(false);
  };
}

export function isDownloadLocked(): boolean {
  return _isProcessing();
}

export const downloadState = {
  get value(): { isProcessing: boolean } {
    return { isProcessing: _isProcessing() };
  },
};
