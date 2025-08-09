import { describe, it, expect, vi, beforeEach } from 'vitest';

// Ensure no mocks interfere with real module
vi.doUnmock('../../../../src/shared/external/compat-bundled');

// Mock preact/compat to simulate bundlable environment while tracking usage
vi.mock('preact/compat', () => ({
  memo: vi.fn((c: unknown) => c),
  forwardRef: vi.fn((render: unknown) => render),
}));

describe('compat-bundled module', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('exports preactCompat with memo and forwardRef functions', async () => {
    const mod = await import('../../../../src/shared/external/compat-bundled');
    expect(mod.preactCompat).toBeTruthy();
    expect(typeof mod.preactCompat.memo).toBe('function');
    expect(typeof mod.preactCompat.forwardRef).toBe('function');
  });
});
