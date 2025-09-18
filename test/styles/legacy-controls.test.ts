import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// GREEN: legacy .controls 클래스가 제거되었음을 보장

describe('P5 GREEN: legacy .controls class removed', () => {
  it('Gallery.module.css no longer contains .controls class', () => {
    // NOTE: Previous implementation climbed three levels (../../..) from test/styles, producing C:\git (one level above repo root)
    // Adjust to two levels to reach actual project root (test/styles -> test -> projectRoot)
    const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
    const cssPath = path.join(root, 'src', 'features', 'gallery', 'styles', 'Gallery.module.css');
    const css = fs.readFileSync(cssPath, 'utf-8');
    expect(css.includes('.controls')).toBe(false);
  });
});
