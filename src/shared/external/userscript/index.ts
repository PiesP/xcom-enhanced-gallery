/**
 * Userscript API Integration
 *
 * @description Tampermonkey/userscript API access layer
 * @see docs/ARCHITECTURE.md - Tampermonkey Service Layer (Phase 309+)
 */

export { getUserscript, type UserscriptAPI, type UserscriptManager } from './adapter';
export {
  detectEnvironment,
  isGMAPIAvailable,
  getEnvironmentDescription,
  type EnvironmentInfo,
} from './environment-detector';
