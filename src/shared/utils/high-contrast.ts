/**
 * @fileoverview High Contrast Detection Utility
 * @description Utility to detect whether high contrast mode is needed for toolbar
 * @version 2.0.0 - Moved from services to utils (pure functions)
 */

export interface HighContrastDetectionInput {
  readonly toolbar: HTMLElement;
  readonly documentRef: Document;
  readonly windowRef: Window;
  readonly offsets: ReadonlyArray<number>;
}

/**
 * Basic high contrast detection algorithm
 *
 * @description
 * Sample background colors around toolbar element to determine if high contrast mode is needed.
 * Check background colors at positions in offsets array, activate high contrast mode
 * when encountering light-colored elements.
 *
 * @param input - Detection input data
 * @returns Whether high contrast mode is needed
 */
export function evaluateHighContrast(input: HighContrastDetectionInput): boolean {
  const { toolbar, documentRef, windowRef, offsets } = input;

  if (typeof documentRef.elementsFromPoint !== 'function') {
    return false;
  }

  const rect = toolbar.getBoundingClientRect();
  if (!rect.width || !rect.height) {
    return false;
  }

  const lightHits = offsets.filter(offset => {
    const x = rect.left + rect.width * offset;
    const y = rect.top + rect.height * 0.5;
    const elements = documentRef.elementsFromPoint(x, y);
    return elements.some(element => {
      const bg = windowRef.getComputedStyle(element).backgroundColor || '';
      return /(?:white|255)/i.test(bg);
    });
  }).length;

  return lightHits >= 2;
}

/**
 * High contrast detector class
 *
 * @description
 * Class to manage high contrast mode detection.
 * Monitors scroll events to detect background changes.
 */
export class HighContrastDetector {
  private input: HighContrastDetectionInput | null = null;
  private onChangeCallback: ((enabled: boolean) => void) | null = null;

  /**
   * Initialize detector
   */
  initialize(
    input: HighContrastDetectionInput,
    onChangeCallback: (enabled: boolean) => void
  ): void {
    this.input = input;
    this.onChangeCallback = onChangeCallback;
  }

  /**
   * Evaluate high contrast status
   */
  evaluate(): boolean {
    if (!this.input) {
      return false;
    }
    return evaluateHighContrast(this.input);
  }

  /**
   * Execute callback
   */
  notifyChange(enabled: boolean): void {
    if (this.onChangeCallback) {
      this.onChangeCallback(enabled);
    }
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.input = null;
    this.onChangeCallback = null;
  }
}
