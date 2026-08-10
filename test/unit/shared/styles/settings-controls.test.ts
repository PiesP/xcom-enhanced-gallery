// SPDX-License-Identifier: MIT
// Copyright (c) 2026 PiesP

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = resolve(import.meta.dirname, '../../../..');
const settingsCss = readFileSync(
  resolve(root, 'src/shared/components/ui/Settings/SettingsControls.module.css'),
  'utf8'
);
const tooltipCss = readFileSync(
  resolve(root, 'src/shared/components/ui/Tooltip/Tooltip.module.css'),
  'utf8'
);

describe('Settings control styles', () => {
  it('does not animate the select focus indicator', () => {
    const selectRule = settingsCss.match(/\.select\s*\{(?<declarations>[\s\S]*?)\n\}/)?.groups
      ?.declarations;

    expect(selectRule).toBeDefined();
    expect(selectRule).not.toMatch(/transition:[\s\S]*box-shadow/);
  });

  it('uses the named tooltip shadow token without a raw color fallback', () => {
    expect(tooltipCss).toContain('box-shadow: var(--xeg-shadow-tooltip);');
    expect(tooltipCss).not.toContain('rgba(0, 0, 0, 0.15)');
  });
});
