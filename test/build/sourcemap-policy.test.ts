/**
 * @fileoverview Sourcemap policy validation tests (TDD RED)
 * @description Epic: SOURCEMAP_VALIDATOR
 *
 * Requirements:
 * 1. Production userscript must NOT contain sourcemap comments
 * 2. Development userscript MAY contain sourcemap comments
 * 3. Separate .map files are allowed in dist/ but not in release/
 */

import { describe, test, expect } from 'vitest';
import { setupGlobalTestIsolation } from '../shared/global-cleanup-hooks';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const DIST_DIR = path.resolve(process.cwd(), 'dist');
const RELEASE_DIR = path.resolve(process.cwd(), 'release');

// Sourcemap comment patterns (inline + external)
const SOURCEMAP_PATTERNS = [
  /\/\/#\s*sourceMappingURL\s*=.*/gm,
  /\/\*#\s*sourceMappingURL\s*=.*?\*\//gs,
  /\/\/@\s*sourceMappingURL\s*=.*/gm,
];

describe('Sourcemap Policy Validation', () => {
  setupGlobalTestIsolation();
  describe('Production Build (.user.js)', () => {
    test('should NOT contain sourceMappingURL comments', () => {
      const prodFile = path.join(DIST_DIR, 'xcom-enhanced-gallery.user.js');

      expect(fs.existsSync(prodFile), 'Production file should exist').toBe(true);

      const content = fs.readFileSync(prodFile, 'utf8');

      for (const pattern of SOURCEMAP_PATTERNS) {
        const matches = content.match(pattern);
        expect(
          matches,
          `Production build must not contain sourceMappingURL comments: ${pattern}`
        ).toBeNull();
      }
    });

    test('separate .map file is allowed in dist/', () => {
      const mapFile = path.join(DIST_DIR, 'xcom-enhanced-gallery.user.js.map');

      // This is allowed - just asserting it exists for documentation
      expect(
        fs.existsSync(mapFile),
        'Separate .map file should exist in dist/ (allowed)'
      ).toBe(true);
    });
  });

  describe('Development Build (.dev.user.js)', () => {
    test('MAY contain sourceMappingURL comments (policy allows)', () => {
      const devFile = path.join(DIST_DIR, 'xcom-enhanced-gallery.dev.user.js');

      if (!fs.existsSync(devFile)) {
        // Dev build optional, skip test
        return;
      }

      const content = fs.readFileSync(devFile, 'utf8');

      // Development build can have sourcemap comments (no assertion needed)
      // This test just documents the policy
      const hasSourcemapComment = SOURCEMAP_PATTERNS.some(pattern => pattern.test(content));

      // No expectation - dev is allowed to have sourcemap comments
      expect(true).toBe(true); // Documentation test
    });
  });

  describe('Release Directory', () => {
    test('should NOT contain .map files', () => {
      if (!fs.existsSync(RELEASE_DIR)) {
        // Release dir may not exist before npm run build
        return;
      }

      const files = fs.readdirSync(RELEASE_DIR);
      const mapFiles = files.filter(f => f.endsWith('.map'));

      expect(
        mapFiles,
        'release/ directory must not contain .map files'
      ).toEqual([]);
    });
  });

  describe('Userscript Metadata Headers', () => {
    test('production userscript should have valid headers', () => {
      const prodFile = path.join(DIST_DIR, 'xcom-enhanced-gallery.user.js');

      expect(fs.existsSync(prodFile)).toBe(true);

      const content = fs.readFileSync(prodFile, 'utf8');
      const lines = content.split('\n');

      // Should start with userscript header
      expect(lines[0]).toContain('// ==UserScript==');

      // Should have required metadata
      expect(content).toContain('@name');
      expect(content).toContain('@version');
      expect(content).toContain('@description');
    });
  });
});
