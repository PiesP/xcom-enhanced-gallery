// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = resolve(import.meta.dirname, '../../../..');
const mainSource = readFileSync(resolve(root, 'src/main.ts'), 'utf8');
const containerSource = readFileSync(
  resolve(root, 'src/shared/components/isolation/GalleryContainer.tsx'),
  'utf8'
);
const adapterCss = readFileSync(
  resolve(root, 'src/shared/styles/design-tokens.quiet-instruments.css'),
  'utf8'
);
const coreCss = readFileSync(
  resolve(root, 'packages/core/src/design/generated/tokens.css'),
  'utf8'
);

describe('Quiet Instruments design adapter', () => {
  it('loads the scoped core tokens before the existing XEG token layers and adapter', () => {
    const layersIndex = mainSource.indexOf("import '@shared/styles/layers.css'");
    const coreIndex = mainSource.indexOf(
      "import '@piesp/browser-core/design/tokens.css'"
    );
    const primitiveIndex = mainSource.indexOf(
      "import '@shared/styles/design-tokens.primitive.css'"
    );
    const componentIndex = mainSource.indexOf(
      "import '@shared/styles/design-tokens.component.css'"
    );
    const adapterIndex = mainSource.indexOf(
      "import '@shared/styles/design-tokens.quiet-instruments.css'"
    );
    const resetIndex = mainSource.indexOf("import '@shared/styles/base/reset.css'");

    expect(layersIndex).toBeGreaterThanOrEqual(0);
    expect(coreIndex).toBeGreaterThan(layersIndex);
    expect(primitiveIndex).toBeGreaterThan(coreIndex);
    expect(adapterIndex).toBeGreaterThan(componentIndex);
    expect(resetIndex).toBeGreaterThan(adapterIndex);
  });

  it('keeps both shared tokens and adapter mappings off the host page', () => {
    expect(coreCss).toContain('.pp-design');
    expect(coreCss).not.toContain(':root');
    expect(coreCss).not.toMatch(/^\s*(?:html|body)(?=[\s,{.#:[>+~])/m);
    expect(adapterCss).toContain('.xeg-theme-scope.pp-design[data-pp-product="xeg"]');
    expect(adapterCss).not.toContain(':root');
    expect(adapterCss).not.toMatch(/^\s*(?:html|body)(?=[\s,{.#:[>+~])/m);
  });

  it.each([
    ['--xeg-color-bg-primary', '--pp-color-canvas'],
    ['--xeg-color-text-primary', '--pp-color-text'],
    ['--xeg-color-border-default', '--pp-color-border'],
    ['--xeg-color-primary', '--pp-color-accent'],
    ['--xeg-color-success', '--pp-color-success'],
    ['--xeg-color-error', '--pp-color-danger'],
    ['--xeg-focus-indicator-color', '--pp-color-focus'],
    ['--xeg-radius-md', '--pp-component-control-radius'],
    ['--xeg-duration-fast', '--pp-component-motion-duration-fast'],
    ['--xeg-icon-size', '--pp-component-icon-size-md'],
    ['--xeg-target-minimum', '--pp-component-target-minimum'],
  ])('maps %s to the shared %s role', (xegToken, sharedToken) => {
    expect(adapterCss).toContain(`${xegToken}: var(${sharedToken})`);
  });

  it('marks the gallery scope as the XEG product while retaining the theme setting', () => {
    expect(containerSource).toContain("'pp-design'");
    expect(containerSource).toContain('data-pp-product="xeg"');
    expect(containerSource).toContain('data-pp-theme={local.theme');
  });
});
