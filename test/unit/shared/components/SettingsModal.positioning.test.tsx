/**
 * @fileoverview SettingsModal positioning regression tests
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const cssPath = resolve(
  __dirname,
  '../../../../src/shared/components/ui/SettingsModal/SettingsModal.module.css'
);

describe('SettingsModal positioning', () => {
  it('center position should vertically center the modal', () => {
    const css = readFileSync(cssPath, 'utf-8');
    const centerMatch = css.match(/\.center\s*\{[^}]*\}/);
    expect(centerMatch).not.toBeNull();
    const centerBlock = centerMatch?.[0] ?? '';

    expect(centerBlock).toMatch(/top:\s*50%/);
    expect(centerBlock).toMatch(/transform:\s*translate\(-50%,\s*-50%\)/);
  });
});
