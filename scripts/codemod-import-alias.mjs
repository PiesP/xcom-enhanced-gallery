#!/usr/bin/env node

/**
 * @fileoverview Codemod for normalizing import paths to use TypeScript path aliases
 * @description Converts relative imports to absolute path aliases (@shared/, @features/, etc.)
 * @version 1.0.0 - Basic draft (Wave 0)
 */

/**
 * NOTE: This is a Wave 0 draft script.
 * Console logging and full implementation will be completed in Wave 1.
 *
 * Basic functionality:
 * - Transform relative imports (../shared/) to aliases (@shared/)
 * - Process TypeScript files in src/ and test/
 * - Export functions for testing
 */

import { readFileSync, writeFileSync } from 'fs';

/**
 * Transform import statement to use path aliases
 */
function transformImportPath(importPath) {
  // Skip if already using alias
  if (importPath.startsWith('@')) {
    return importPath;
  }

  // Skip external modules
  if (!importPath.startsWith('.')) {
    return importPath;
  }

  // Transform all shared/ imports - more aggressive pattern
  if (importPath.includes('/shared/')) {
    return importPath.replace(/^\.\.\/\.\.\/.*?\/src\/shared\//, '@shared/');
  }

  // Transform all features/ imports
  if (importPath.includes('/features/')) {
    return importPath.replace(/^\.\.\/\.\.\/.*?\/src\/features\//, '@features/');
  }

  // Transform src/ imports from test files
  if (importPath.includes('/src/')) {
    const srcMatch = importPath.match(/^(\.\.\/)*src\/(.+)$/);
    if (srcMatch) {
      const [, , srcPath] = srcMatch;
      if (srcPath.startsWith('shared/')) {
        return `@shared/${srcPath.substring(7)}`;
      }
      if (srcPath.startsWith('features/')) {
        return `@features/${srcPath.substring(9)}`;
      }
      return `@/${srcPath}`;
    }
  }

  return importPath;
}

/**
 * Process a single TypeScript file (basic version)
 */
function processFile(filePath) {
  try {
    const content = readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    let modified = false;

    const transformedLines = lines.map(line => {
      // Match import/export statements
      const importMatch = line.match(/^(\s*(?:import|export).*from\s+['"`])([^'"`]+)(['"`])/);
      if (importMatch) {
        const [, prefix, importPath, suffix] = importMatch;
        const transformed = transformImportPath(importPath);

        if (transformed !== importPath) {
          modified = true;
          return `${prefix}${transformed}${suffix}`;
        }
      }

      // Match dynamic imports
      const dynamicMatch = line.match(/(import\s*\(\s*['"`])([^'"`]+)(['"`]\s*\))/);
      if (dynamicMatch) {
        const [, prefix, importPath, suffix] = dynamicMatch;
        const transformed = transformImportPath(importPath);

        if (transformed !== importPath) {
          modified = true;
          return line.replace(dynamicMatch[0], `${prefix}${transformed}${suffix}`);
        }
      }

      return line;
    });

    if (modified) {
      writeFileSync(filePath, transformedLines.join('\n'));
      return true;
    }

    return false;
  } catch {
    return false;
  }
}

export { transformImportPath, processFile };
