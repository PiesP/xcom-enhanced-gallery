import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL, URL as NodeURL } from 'node:url';

const SUPPORTED_EXTENSIONS = ['.ts', '.mts', '.cts', '.mjs', '.cjs', '.js', '.json'];

function resolveBaseDirectory(baseRef) {
  if (baseRef instanceof NodeURL) {
    return path.dirname(fileURLToPath(baseRef));
  }

  if (typeof baseRef === 'string' && baseRef.startsWith('file:')) {
    return path.dirname(fileURLToPath(new NodeURL(baseRef)));
  }

  return path.resolve(baseRef);
}

/**
 * Loads a local (developer-specific) configuration module if it exists.
 *
 * @template T
 * @param {string | URL} baseRef - Base directory reference (e.g. import.meta.url)
 * @param {string} basename - Basename of the config file without extension
 * @param {{ searchDir?: string; allowInCI?: boolean }} [options]
 * @returns {Promise<T | null>} Resolved module default export or null when absent
 */
export async function loadLocalConfig(baseRef, basename, options = {}) {
  const allowInCI = Boolean(options.allowInCI);
  const env =
    typeof globalThis !== 'undefined' &&
    'process' in globalThis &&
    globalThis.process &&
    globalThis.process.env
      ? globalThis.process.env
      : {};

  if (!allowInCI) {
    if (env.XEG_DISABLE_LOCAL_CONFIG === 'true') {
      return null;
    }

    if (env.CI === 'true') {
      return null;
    }
  }

  const baseDir = resolveBaseDirectory(baseRef);
  const searchDir = options.searchDir
    ? path.resolve(baseDir, options.searchDir)
    : path.resolve(baseDir, 'config/local');

  for (const ext of SUPPORTED_EXTENSIONS) {
    const candidate = path.join(searchDir, `${basename}${ext}`);
    if (!existsSync(candidate)) continue;

    const moduleUrl = pathToFileURL(candidate).href;
    const mod = await import(moduleUrl);
    return (mod && typeof mod === 'object' && 'default' in mod ? mod.default : mod) ?? null;
  }

  return null;
}
