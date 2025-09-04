import { describe, it, expect } from 'vitest';

import {
  isTestEnvironment,
  isBrowserEnvironment,
  isDevelopmentEnvironment,
  isProductionEnvironment,
  isUserScriptEnvironment,
} from '@shared/utils/environment';

describe('environment utils', () => {
  it('detects test environment (process env)', () => {
    // use globalThis to avoid linter issues with `process` not being defined
    // access process via bracket notation to avoid TS-only syntax in test files
    // @ts-ignore allow attaching env in test
    /** @type {{ env?: any }} */
    const env = globalThis['process'] || {};
    // @ts-ignore - test-only mutation of global process.env
    const orig = env.env ? env.env.NODE_ENV : undefined;
    // @ts-ignore - test-only mutation of global process.env
    if (!env.env) env.env = {};
    // @ts-ignore - test-only mutation of global process.env
    env.env.NODE_ENV = 'test';
    try {
      expect(isTestEnvironment()).toBe(true);
    } finally {
      // @ts-ignore - restore test-only mutation
      env.env.NODE_ENV = orig;
    }
  });

  it('detects development/production correctly', () => {
    // manipulate globalThis.process.env safely
    // @ts-ignore allow attaching env in test
    /** @type {{ env?: any }} */
    const env = globalThis['process'] || {};
    // @ts-ignore - test-only mutation of global process.env
    const orig = env.env ? env.env.NODE_ENV : undefined;
    // @ts-ignore - test-only mutation of global process.env
    if (!env.env) env.env = {};
    // @ts-ignore - test-only mutation of global process.env
    env.env.NODE_ENV = 'development';
    expect(isDevelopmentEnvironment()).toBe(true);
    // @ts-ignore - test-only mutation of global process.env
    env.env.NODE_ENV = 'production';
    expect(isProductionEnvironment()).toBe(true);
    // @ts-ignore - restore test-only mutation
    env.env.NODE_ENV = orig;
  });

  it('isBrowserEnvironment reflects presence of window/document', () => {
    const expected =
      typeof globalThis.window !== 'undefined' && typeof globalThis.document !== 'undefined';
    expect(isBrowserEnvironment()).toBe(Boolean(expected));
  });

  it('isUserScriptEnvironment returns false by default', () => {
    // GM_ functions are not defined in test env
    expect(isUserScriptEnvironment()).toBe(false);
  });
});
