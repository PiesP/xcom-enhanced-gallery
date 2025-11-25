/**
 * @fileoverview Observable pattern implementation
 * @description Provides a lightweight observable for managing listeners
 */

/**
 * Unsubscribe function type
 */
export type Unsubscribe = () => void;

/**
 * Listener function type
 */
export type Listener<T> = (value: T) => void;

/**
 * Observable class for managing value changes and listeners.
 * Used by services like ThemeService and LanguageService.
 *
 * @example
 * ```typescript
 * class MyService {
 *   private readonly themeObservable = new Observable<Theme>();
 *
 *   subscribe(listener: Listener<Theme>): Unsubscribe {
 *     return this.themeObservable.subscribe(listener);
 *   }
 *
 *   setTheme(theme: Theme): void {
 *     this.themeObservable.notify(theme);
 *   }
 * }
 * ```
 */
export class Observable<T> {
  private readonly listeners = new Set<Listener<T>>();

  /**
   * Subscribe to value changes
   * @param listener - Callback function
   * @returns Unsubscribe function
   */
  subscribe(listener: Listener<T>): Unsubscribe {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Notify all listeners of a value change
   * @param value - The new value
   */
  notify(value: T): void {
    for (const listener of this.listeners) {
      try {
        listener(value);
      } catch {
        // Prevent one listener from breaking others
      }
    }
  }

  /**
   * Remove all listeners
   */
  clear(): void {
    this.listeners.clear();
  }

  /**
   * Get the current number of listeners
   */
  get size(): number {
    return this.listeners.size;
  }

  /**
   * Check if there are any listeners
   */
  get hasListeners(): boolean {
    return this.listeners.size > 0;
  }
}

/**
 * ValueObservable - Observable with current value tracking
 *
 * @example
 * ```typescript
 * const counter = new ValueObservable(0);
 * counter.subscribe(console.log);
 * counter.value = 1; // logs: 1
 * console.log(counter.value); // 1
 * ```
 */
export class ValueObservable<T> extends Observable<T> {
  private currentValue: T;

  constructor(initialValue: T) {
    super();
    this.currentValue = initialValue;
  }

  /**
   * Get current value
   */
  get value(): T {
    return this.currentValue;
  }

  /**
   * Set value and notify listeners
   */
  set value(newValue: T) {
    this.currentValue = newValue;
    this.notify(newValue);
  }

  /**
   * Update value only if different and notify
   * @returns true if value was changed
   */
  update(newValue: T): boolean {
    if (this.currentValue === newValue) {
      return false;
    }
    this.value = newValue;
    return true;
  }
}
