/**
 * Bootstrap initial theme synchronously to avoid first-paint transparency.
 * - No event listeners
 * - No timers
 * - No service/container dependencies
 *
 * Logic:
 * 1) Read saved setting from localStorage('xeg-theme') if available
 * 2) If 'light' | 'dark' → set as-is
 * 3) Else (auto | missing | invalid) → use matchMedia('(prefers-color-scheme: dark)')
 * 4) Fallback to 'light' on any failure/missing APIs
 */
export function bootstrapInitialTheme(): void {
  try {
    // Guard DOM APIs
    if (typeof document === 'undefined' || typeof window === 'undefined') return;

    // Read persisted setting
    let setting: string | null = null;
    try {
      setting = globalThis.localStorage?.getItem('xeg-theme') ?? null;
    } catch {
      // ignore storage access errors
    }

    let theme: 'light' | 'dark' | null = null;

    if (setting === 'light' || setting === 'dark') {
      theme = setting;
    } else if (setting === 'auto' || setting === null) {
      // auto or missing → system preference
      let prefersDark = false;
      try {
        const hasMM = typeof globalThis.matchMedia === 'function';
        prefersDark = hasMM && globalThis.matchMedia('(prefers-color-scheme: dark)').matches;
      } catch {
        prefersDark = false;
      }
      theme = prefersDark ? 'dark' : 'light';
    } else {
      // invalid saved value → safe fallback
      theme = 'light';
    }

    // Apply without side-effects beyond an attribute set
    const el = document.documentElement;
    const current = el.getAttribute('data-theme');
    if (current !== theme) {
      el.setAttribute('data-theme', theme);
    }
  } catch {
    // Silent fallback on any unexpected error
  }
}
