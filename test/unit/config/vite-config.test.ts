import type { UserConfig, UserConfigExport } from 'vite';
import { describe, expect, it, vi, beforeEach } from 'vitest';

const viteConfigUrl = new URL('../../../vite.config.ts', import.meta.url);

const loadConfig = async (flavor: 'preview' | 'main'): Promise<UserConfig> => {
  process.env.XEG_FORCE_VITE_FLAVOR = flavor;
  vi.resetModules();

  const mod = (await import(`${viteConfigUrl.href}?ts=${Date.now()}`)) as {
    default: UserConfigExport;
  };
  const exported = mod.default;

  const resolved =
    typeof exported === 'function'
      ? await exported({ mode: 'production', command: 'build' })
      : await exported;

  delete process.env.XEG_FORCE_VITE_FLAVOR;
  return resolved as UserConfig;
};

describe('vite config migration bridge', () => {
  beforeEach(() => {
    delete process.env.XEG_FORCE_VITE_FLAVOR;
  });

  it('keeps esbuild shim when running under the rolldown preview build', async () => {
    const config = await loadConfig('preview');
    const buildConfig = config.build as Record<string, unknown>;

    expect(config.esbuild).toBeDefined();
    expect(config.oxc).toBeUndefined();
    expect(config.optimizeDeps?.esbuildOptions).toBeUndefined();
    expect(buildConfig.rollupOptions).toBeDefined();
    expect(buildConfig.rolldownOptions).toBeUndefined();
  });

  it('enables oxc + rolldownOptions once the mainline Vite build is detected', async () => {
    const config = await loadConfig('main');
    const buildConfig = config.build as Record<string, unknown>;

    expect(config.oxc).toBeDefined();
    expect(config.esbuild).toBeUndefined();
    expect(buildConfig.rolldownOptions).toBeDefined();
    expect(buildConfig.rollupOptions).toBeUndefined();
  });
});
