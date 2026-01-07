/**
 * @fileoverview File path utilities for Vite build configuration.
 *
 * Provides paths to critical directories: repository root, licenses, and build outputs.
 * All paths are resolved relative to the current module location.
 */

import * as path from 'node:path';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Current build directory (tooling/vite/).
 *
 * Derived from the current module's file URL for ES module compatibility.
 *
 * @internal
 */
const BUILD_DIR = path.dirname(fileURLToPath(import.meta.url));

/**
 * Repository root directory (absolute path).
 *
 * Points to the project root where package.json, src/, and other top-level files are located.
 * Resolved relative to BUILD_DIR (../../).
 */
export const REPO_ROOT = resolve(BUILD_DIR, '../..');

/**
 * Third-party licenses directory (absolute path).
 *
 * Contains .txt and .md license files for third-party dependencies.
 * Located at LICENSES/ in the repository root.
 */
export const LICENSES_DIR = resolve(REPO_ROOT, 'LICENSES');
