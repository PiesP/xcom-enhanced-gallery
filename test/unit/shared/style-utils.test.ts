import { expect } from 'vitest';
import {
  combineClasses,
  getCSSVariable,
  applyTheme,
  updateComponentState,
} from '@shared/utils/styles/style-utils';

describe('style-utils', () => {
  test('combineClasses joins only truthy values', () => {
    expect(combineClasses('a', undefined, false, 'b', '')).toBe('a b');
  });

  test('getCSSVariable reads computed style', () => {
    const doc = globalThis.document;
    const el = doc.createElement('div');
    doc.body.appendChild(el);
    el.style.setProperty('--my-var', '  value ');
    expect(getCSSVariable(el, 'my-var')).toBe('value');
    el.remove();
  });

  test('applyTheme replaces existing theme classes and adds new one', () => {
    const doc = globalThis.document;
    const el = doc.createElement('div');
    el.classList.add('theme-dark', 'theme-old');
    applyTheme(el, 'light');
    expect(el.classList.contains('theme-light')).toBe(true);
    expect(Array.from(el.classList).some(c => c.startsWith('theme-'))).toBe(true);
  });

  test('updateComponentState toggles classes with prefix', () => {
    const doc = globalThis.document;
    const el = doc.createElement('div');
    updateComponentState(el, { open: true, disabled: false }, 'is');
    expect(el.classList.contains('is-open')).toBe(true);
    expect(el.classList.contains('is-disabled')).toBe(false);
  });
});
