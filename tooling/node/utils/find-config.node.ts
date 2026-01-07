/**
 * Node-only config discovery utilities.
 *
 * This module uses Node built-ins (node:fs, node:path) and must never be
 * imported by browser/runtime code.
 */

// Node.js built-ins
import fs from 'node:fs';
import path from 'node:path';

/**
 * Get the current working directory as the default base path.
 * Used when no explicit base is provided.
 */
function getDefaultBase(): string {
  return process.cwd();
}

/**
 * Search upwards along the directory tree to find a config file.
 *
 * Search strategy:
 * 1. Start from the base directory (or current working directory)
 * 2. For each directory from base upward to the filesystem root:
 *    - Check for <current>/<relative> path
 *    - Check for <current>/test/<relative> path
 * 3. Return the first matching path found
 * 4. If no file found, return the resolved path (base + relative)
 *
 * @param relative - Relative path to the config file (e.g., 'tsconfig.json')
 * @param base - Optional base directory path; defaults to current working directory
 * @returns The absolute path to the config file (may not exist if search failed)
 */
export function findConfigFilePath(relative: string, base?: string): string {
  const effectiveBase = base ?? getDefaultBase();
  let current = path.resolve(effectiveBase);
  const root = path.parse(current).root;

  // Walk up directory tree until reaching filesystem root
  while (true) {
    // Check both direct and nested test/ path
    const candidates = [path.resolve(current, relative), path.resolve(current, 'test', relative)];

    for (const p of candidates) {
      try {
        // Return as soon as a file is found
        if (fs.existsSync(p)) return p;
      } catch {
        // Ignore errors and continue searching up the tree
      }
    }

    // Stop at filesystem root
    if (current === root) break;
    current = path.resolve(current, '..');
  }

  // Fallback: return resolved path even if file doesn't exist
  return path.resolve(effectiveBase, relative);
}

/**
 * Find the first matching config file from a list of candidates.
 *
 * Iterates through candidate file names, checking each one via findConfigFilePath.
 * Returns the first existing file found, or falls back to the path of the first candidate.
 *
 * @param candidates - List of candidate config file names (e.g., ['tsconfig.json', 'tsconfig.build.json'])
 * @param base - Optional base directory path; defaults to current working directory
 * @returns The absolute path to the first matching config file
 * @throws Error if candidates array is empty
 */
export function findFirstConfigFilePath(candidates: readonly string[], base?: string): string {
  // Check each candidate until one exists
  for (const name of candidates) {
    const p = findConfigFilePath(name, base);
    if (fs.existsSync(p)) return p;
  }

  // Fallback: ensure we have at least one candidate
  const first = candidates[0];
  if (!first) {
    throw new Error('findFirstConfigFilePath requires at least one candidate');
  }

  // Return path to first candidate (even if it doesn't exist)
  return findConfigFilePath(first, base);
}
