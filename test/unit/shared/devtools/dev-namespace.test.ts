import type { DevNamespace } from '@shared/devtools/dev-namespace';

interface DevNamespaceHost {
  __XEG__?: DevNamespace;
}

describe('dev-namespace', () => {
  beforeEach(() => {
    vi.resetModules();
    // Reset the global namespace
    delete (globalThis as unknown as DevNamespaceHost).__XEG__;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should expose DEV flag from import.meta.env', async () => {
    const { _env } = await import('@shared/devtools/dev-namespace');

    // Use Object.getOwnPropertyNames to ensure we are checking the object's own properties
    // This kills the ObjectLiteral mutant ({}) because it won't have the 'DEV' property
    const ownProps = Object.getOwnPropertyNames(_env);
    expect(ownProps).toContain('DEV');

    const descriptor = Object.getOwnPropertyDescriptor(_env, 'DEV');
    expect(descriptor, 'DEV property descriptor should exist').toBeDefined();
    expect(descriptor?.get, 'DEV property should be a getter').toBeDefined();
  });

  it('should have valid DEV property value', async () => {
    const { _env } = await import('@shared/devtools/dev-namespace');
    expect(_env.DEV).toBeDefined();
    expect(typeof _env.DEV).toBe('boolean');
    expect(Object.keys(_env)).toContain('DEV');
  });

  it('should expose namespace when DEV is true', async () => {
    const mod = await import('@shared/devtools/dev-namespace');
    vi.spyOn(mod._env, 'DEV', 'get').mockReturnValue(true);

    mod.mutateDevNamespace(ns => {
      ns.test = 'value';
    });

    const ns = mod.getDevNamespace();
    expect(ns).toBeDefined();
    expect(ns?.test).toBe('value');
    expect((globalThis as unknown as DevNamespaceHost).__XEG__).toBeDefined();
  });

  it('should not expose namespace when DEV is false', async () => {
    const mod = await import('@shared/devtools/dev-namespace');
    vi.spyOn(mod._env, 'DEV', 'get').mockReturnValue(false);

    mod.mutateDevNamespace(ns => {
      ns.test = 'should not happen';
    });

    const ns = mod.getDevNamespace();
    expect(ns).toBeUndefined();
    expect((globalThis as unknown as DevNamespaceHost).__XEG__).toBeUndefined();
  });

  it('should return undefined even if namespace exists when DEV is false', async () => {
    const mod = await import('@shared/devtools/dev-namespace');
    vi.spyOn(mod._env, 'DEV', 'get').mockReturnValue(false);

    // Simulate a leaked or pre-existing namespace
    const leaked = { leaked: true };
    (globalThis as unknown as DevNamespaceHost).__XEG__ = leaked;

    const ns = mod.getDevNamespace();
    expect(ns).toBeUndefined();

    // Verify we didn't delete it, just hid it
    expect((globalThis as unknown as DevNamespaceHost).__XEG__).toBe(leaked);
  });

  it('should reuse existing namespace', async () => {
    const mod = await import('@shared/devtools/dev-namespace');
    vi.spyOn(mod._env, 'DEV', 'get').mockReturnValue(true);

    const existing = { existing: true };
    (globalThis as unknown as DevNamespaceHost).__XEG__ = existing;

    mod.mutateDevNamespace(ns => {
      ns.new = true;
    });

    expect(mod.getDevNamespace()).toBe(existing);
    expect((globalThis as unknown as DevNamespaceHost).__XEG__?.new).toBe(true);
  });
});
