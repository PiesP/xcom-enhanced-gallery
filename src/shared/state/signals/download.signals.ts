/**
 * Download state signals — separated from gallery.signals to avoid
 * coupling download lifecycle to gallery open/close transitions.
 */
import { createSignal } from 'solid-js';

const [_isProcessing, setIsProcessing] = createSignal<boolean>(false);

export const downloadState = {
  get isProcessing(): boolean {
    return _isProcessing();
  },
};

export function setDownloading(value: boolean): void {
  setIsProcessing(value);
}
