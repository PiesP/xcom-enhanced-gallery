import { describe, it, expect } from 'vitest';
import { getSolid } from '@shared/external/vendors';
import {
  toRequiredAccessor,
  toOptionalAccessor,
} from '@shared/components/ui/Toolbar/accessor-utils';

describe('Toolbar accessor utilities', () => {
  it('returns reactive accessors for direct values', () => {
    const { createSignal } = getSolid();
    const [value, setValue] = createSignal(false);

    const accessor = toRequiredAccessor(() => value(), true);

    expect(accessor()).toBe(false);

    setValue(true);

    expect(accessor()).toBe(true);
  });

  it('unwraps nested accessors and updates reactively', () => {
    const { createSignal } = getSolid();
    const [theme, setTheme] = createSignal<'auto' | 'dark'>('auto');

    const accessor = toOptionalAccessor(() => () => theme());

    expect(accessor()).toBe('auto');

    setTheme('dark');

    expect(accessor()).toBe('dark');
  });
});
