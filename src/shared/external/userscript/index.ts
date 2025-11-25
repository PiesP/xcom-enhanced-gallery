/**
 * Public surface for Tampermonkey helpers.
 * Prefer the service layer for production logic and reach for these getters only when necessary.
 */
export { detectEnvironment, isGMAPIAvailable, type EnvironmentInfo } from './environment-detector';

export { getUserscript, type UserscriptAPI, type UserscriptManager } from './adapter';
