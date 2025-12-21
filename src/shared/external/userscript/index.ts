/**
 * Public surface for Tampermonkey helpers.
 * Prefer the service layer for production logic and reach for these getters only when necessary.
 */

export {
  getUserscript,
  getUserscriptSafe,
  type ResolvedGMAPIs,
  resolveGMAPIs,
  resolveGMDownload,
  type UserscriptAPI,
  type UserscriptManager,
} from '@shared/external/userscript/adapter';
export {
  detectEnvironment,
  type EnvironmentInfo,
  type GMAPIName,
  isGMAPIAvailable,
} from '@shared/external/userscript/environment-detector';
