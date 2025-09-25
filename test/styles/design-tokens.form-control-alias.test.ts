/**
 * @fileoverview Form control component token alias verification
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { cwd } from 'node:process';

const componentTokensPath = resolve(cwd(), 'src/shared/styles/design-tokens.component.css');

const componentTokensCss = readFileSync(componentTokensPath, 'utf-8');

const aliasPairs: Array<[string, string]> = [
  ['--xeg-comp-form-control-bg', '--xeg-form-control-bg'],
  ['--xeg-comp-form-control-bg-hover', '--xeg-form-control-bg-hover'],
  ['--xeg-comp-form-control-bg-active', '--xeg-form-control-bg-active'],
  ['--xeg-comp-form-control-border', '--xeg-form-control-border'],
  ['--xeg-comp-form-control-border-hover', '--xeg-form-control-border-hover'],
  ['--xeg-comp-form-control-border-active', '--xeg-form-control-border-active'],
  ['--xeg-comp-form-control-color', '--xeg-form-control-color'],
  ['--xeg-comp-form-control-color-hover', '--xeg-form-control-color-hover'],
  ['--xeg-comp-form-control-radius', '--xeg-form-control-radius'],
  ['--xeg-comp-form-control-shadow', '--xeg-form-control-shadow'],
  ['--xeg-comp-form-control-shadow-hover', '--xeg-form-control-shadow-hover'],
  ['--xeg-comp-form-control-shadow-active', '--xeg-form-control-shadow-active'],
  ['--xeg-comp-form-control-disabled-opacity', '--xeg-form-control-disabled-opacity'],
  ['--xeg-comp-form-control-focus-outline', '--xeg-form-control-focus-outline'],
  ['--xeg-comp-form-control-focus-offset', '--xeg-form-control-focus-offset'],
  ['--xeg-comp-form-control-padding-block', '--xeg-form-control-padding-block'],
  ['--xeg-comp-form-control-padding-inline', '--xeg-form-control-padding-inline'],
  ['--xeg-comp-form-control-gap', '--xeg-form-control-gap'],
  ['--xeg-comp-form-control-font-size', '--xeg-form-control-font-size'],
  ['--xeg-comp-form-control-font-weight', '--xeg-form-control-font-weight'],
  ['--xeg-comp-form-control-toggle-size', '--xeg-form-control-toggle-size'],
  ['--xeg-comp-form-control-accent', '--xeg-form-control-accent'],
  ['--xeg-comp-form-control-check-color', '--xeg-form-control-check-color'],
  ['--xeg-comp-form-control-check-weight', '--xeg-form-control-check-weight'],
  ['--xeg-comp-form-control-checked-bg', '--xeg-form-control-checked-bg'],
  ['--xeg-comp-form-control-checked-border', '--xeg-form-control-checked-border'],
];

describe('design-tokens.component.css form control alias coverage', () => {
  it('maps component aliases to semantic form control tokens', () => {
    aliasPairs.forEach(([componentToken, semanticToken]) => {
      const expected = `${componentToken}: var(${semanticToken})`;
      expect(
        componentTokensCss.includes(expected),
        `${componentToken} should alias ${semanticToken}`
      ).toBe(true);
    });
  });
});
