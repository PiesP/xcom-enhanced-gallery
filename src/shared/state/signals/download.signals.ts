/**
 * Download state management with signals.
 */

import { createSignal } from 'solid-js';

const [_isProcessing, setIsProcessing] = createSignal<boolean>(false);

export const downloadState = {
  get value(): { isProcessing: boolean } {
    return { isProcessing: _isProcessing() };
  },
};

export function setDownloading(value: boolean): void {
  setIsProcessing(value);
}
