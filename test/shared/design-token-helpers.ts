import { readFileSync } from 'node:fs';
import path from 'node:path';

const DESIGN_TOKEN_FILES = [
  'src/shared/styles/design-tokens.primitive.css',
  'src/shared/styles/design-tokens.semantic.css',
  'src/shared/styles/design-tokens.component.css',
] as const;

/**
 * Read and concatenate all design token CSS files.
 * This reflects the three-tier token architecture introduced in Phase 352.
 */
export function readAllDesignTokens(): string {
  return DESIGN_TOKEN_FILES.map(relativePath =>
    readFileSync(path.join(process.cwd(), relativePath), 'utf-8')
  ).join('\n');
}

/**
 * Returns absolute paths for each design token tier.
 */
export function getDesignTokenPaths(): string[] {
  return DESIGN_TOKEN_FILES.map(relativePath => path.join(process.cwd(), relativePath));
}
