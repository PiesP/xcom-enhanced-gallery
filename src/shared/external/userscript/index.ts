/**
 * Public surface for Tampermonkey helpers.
 * Prefer the service layer for production logic and reach for these getters only when necessary.
 */

export {
  getUserscript,
  getUserscriptSafe,
  resolveGMDownload,
  type UserscriptAPI,
} from '@shared/external/userscript/adapter';
export { isGMAPIAvailable } from '@shared/external/userscript/environment-detector';
