
const ORIGINAL_ENV = { ...process.env };

async function importFreshAppConfig() {
  return import('@/constants/app-config');
}

type ImportMetaEnvOverrides = Partial<Record<string, string | boolean | undefined>>;

function setImportMetaEnv(overrides: ImportMetaEnvOverrides) {
  (globalThis as typeof globalThis & {
    __XEG_IMPORT_META_ENV__?: ImportMetaEnvOverrides;
  }).__XEG_IMPORT_META_ENV__ = { ...overrides };
}

function clearImportMetaEnv() {
  delete (globalThis as typeof globalThis & {
    __XEG_IMPORT_META_ENV__?: ImportMetaEnvOverrides;
  }).__XEG_IMPORT_META_ENV__;
}

function resetNodeEnv(overrides: Record<string, string | undefined> = {}) {
  process.env = { ...ORIGINAL_ENV };
  for (const [key, value] of Object.entries(overrides)) {
    if (typeof value === 'undefined') {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
}

describe('app-config', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
    resetNodeEnv();
    clearImportMetaEnv();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    resetNodeEnv();
    clearImportMetaEnv();
  });

  it('prefers import.meta.env values for version, flags, and mode', async () => {
    setImportMetaEnv({
      VITE_VERSION: '9.9.9',
      VITE_AUTO_START: 'off',
      VITE_ENABLE_DEBUG_TOOLS: 'yes',
      MODE: 'development',
      DEV: true,
    });

    const { createAppConfig } = await importFreshAppConfig();
    const config = createAppConfig();

    expect(config).toEqual(
      expect.objectContaining({
        version: '9.9.9',
        isDevelopment: true,
        autoStart: false,
        debug: true,
      }),
    );
  });

  it('falls back to node env when Vite env is unavailable', async () => {
    setImportMetaEnv({
      MODE: 'production',
      DEV: false,
    });
    resetNodeEnv({
      NODE_ENV: 'production',
      VITE_VERSION: '8.8.8',
      VITE_AUTO_START: 'false',
      VITE_ENABLE_DEBUG_TOOLS: 'false',
    });

    const { createAppConfig } = await importFreshAppConfig();
    const config = createAppConfig();

    expect(config).toEqual(
      expect.objectContaining({
        version: '8.8.8',
        isDevelopment: false,
        autoStart: false,
        debug: false,
      }),
    );
  });

  it('gracefully handles invalid boolean flags and empty versions', async () => {
    setImportMetaEnv({
      VITE_VERSION: '',
      MODE: 'test',
      VITE_AUTO_START: 'banana',
      DEV: false,
    });
    resetNodeEnv({ npm_package_version: '7.7.7' });

    const { createAppConfig } = await importFreshAppConfig();
    const config = createAppConfig();

    expect(config.version).toBe('7.7.7');
    expect(config.autoStart).toBe(true);
    expect(config.isDevelopment).toBe(false);
  });
});
