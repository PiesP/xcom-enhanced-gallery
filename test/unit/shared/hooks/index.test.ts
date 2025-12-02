// Using vitest globals via types
import * as hooks from '@shared/hooks';

describe('shared hooks index barrel', () => {
  it('exports toolbar hooks and types', () => {
    expect(hooks.useToolbarState).toBeDefined();
    expect(hooks.useToolbarSettingsController).toBeDefined();
  });
});
