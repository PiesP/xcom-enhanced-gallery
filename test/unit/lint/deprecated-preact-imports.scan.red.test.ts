/**
 * @fileoverview Phase 9.8 - Scan for deprecated @testing-library/preact imports
 * @description RED test to detect @testing-library/preact usage after Solid.js migration
 * @severity HIGH
 */

import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../../..');

describe('[Phase 9.8] Deprecated @testing-library/preact imports', () => {
  it('should not have @testing-library/preact imports in test files', () => {
    const testDirs = [
      path.join(projectRoot, 'test/unit'),
      path.join(projectRoot, 'test/features'),
      path.join(projectRoot, 'test/components'),
      path.join(projectRoot, 'test/behavioral'),
      path.join(projectRoot, 'test/styles'),
      path.join(projectRoot, 'test/refactoring'),
    ];

    const violations: Array<{ file: string; line: number; content: string }> = [];

    function scanDirectory(dir: string): void {
      if (!fs.existsSync(dir)) return;

      const entries = fs.readdirSync(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          scanDirectory(fullPath);
        } else if (entry.isFile() && /\.(ts|tsx|js|jsx)$/.test(entry.name)) {
          const content = fs.readFileSync(fullPath, 'utf-8');
          const lines = content.split('\n');

          lines.forEach((line, index) => {
            if (
              /from\s+['"]@testing-library\/preact['"]/.test(line) ||
              /import\s+['"]@testing-library\/preact['"]/.test(line)
            ) {
              violations.push({
                file: path.relative(projectRoot, fullPath),
                line: index + 1,
                content: line.trim(),
              });
            }
          });
        }
      }
    }

    testDirs.forEach(dir => scanDirectory(dir));

    if (violations.length > 0) {
      const violationList = violations
        .map(v => `  - ${v.file}:${v.line}\n    ${v.content}`)
        .join('\n');

      expect.fail(
        `Found ${violations.length} file(s) using @testing-library/preact:\n\n` +
          `${violationList}\n\n` +
          `❌ Replace with @solidjs/testing-library\n` +
          `Migration: render, screen, fireEvent, waitFor → @solidjs/testing-library\n` +
          `renderHook, act → @solidjs/testing-library (Solid.js version)`
      );
    }

    expect(violations).toHaveLength(0);
  });

  it('should not have vendor-testing-library.ts if unused', () => {
    const vendorTestingLibPath = path.join(projectRoot, 'test/utils/vendor-testing-library.ts');

    if (!fs.existsSync(vendorTestingLibPath)) {
      // Already removed - test passes
      return;
    }

    // Check if vendor-testing-library is imported anywhere
    const testDirs = [path.join(projectRoot, 'test'), path.join(projectRoot, 'src')];

    let importCount = 0;

    function scanForImports(dir: string): void {
      if (!fs.existsSync(dir)) return;

      const entries = fs.readdirSync(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory() && entry.name !== 'node_modules') {
          scanForImports(fullPath);
        } else if (entry.isFile() && /\.(ts|tsx|js|jsx)$/.test(entry.name)) {
          // Skip the vendor-testing-library.ts file itself
          if (fullPath === vendorTestingLibPath) continue;

          const content = fs.readFileSync(fullPath, 'utf-8');

          if (/from\s+['"].*vendor-testing-library['"]/.test(content)) {
            importCount++;
          }
        }
      }
    }

    testDirs.forEach(dir => scanForImports(dir));

    if (importCount === 0) {
      expect.fail(
        `vendor-testing-library.ts exists but is not imported anywhere.\n` +
          `❌ Remove test/utils/vendor-testing-library.ts\n` +
          `This file is a Preact wrapper and is no longer needed after Solid.js migration.`
      );
    }

    // If it's still imported, fail with different message
    expect(importCount).toBeGreaterThan(0);
  });
});
