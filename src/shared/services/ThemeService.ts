// Compatibility re-export for tests and legacy imports
// Expose instance under the name `ThemeService` (as tests expect) and keep default export.

export type { Theme } from './theme-service';
export { ThemeService as ThemeServiceClass } from './theme-service';
export { themeService } from './theme-service';

import themeServiceInstance from './theme-service';

// Back-compat: named export that points to the singleton instance
export const ThemeService = themeServiceInstance;

export default themeServiceInstance;
