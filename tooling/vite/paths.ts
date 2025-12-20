import * as path from 'node:path';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const BUILD_DIR = path.dirname(fileURLToPath(import.meta.url));

export const REPO_ROOT = resolve(BUILD_DIR, '../..');
export const LICENSES_DIR = resolve(REPO_ROOT, 'LICENSES');
