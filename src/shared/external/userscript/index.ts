/**
 * Public surface for Tampermonkey helpers.
 * Prefer the service layer for production logic and reach for these getters only when necessary.
 */

export {
  getUserscript,
  type ResolvedGMAPIs,
  resolveGMAPIs,
  resolveGMDownload,
  type UserscriptAPI,
  type UserscriptManager,
} from './adapter';
export { detectEnvironment, type EnvironmentInfo, isGMAPIAvailable } from './environment-detector';
