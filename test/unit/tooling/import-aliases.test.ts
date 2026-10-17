import { resolve } from 'node:path';
import { resolveConfig } from 'vite';
import { describe, expect, it } from 'vite-plus/test';
import vitestConfig from '../../../vitest.config.ts';

const root = resolve(import.meta.dirname, '../../..');

describe('TypeScript-owned browser aliases', () => {
  it.each([
    ['@bootstrap/gallery-init', 'src/bootstrap/gallery-init.ts'],
    ['@constants/app-config', 'src/constants/app-config.ts'],
    ['@extension/extension-message-types', 'src/extension/extension-message-types.ts'],
    ['@features/gallery/gallery-app', 'src/features/gallery/gallery-app.ts'],
    ['@main', 'src/main.ts'],
    ['@platform/index', 'src/platform/index.ts'],
    ['@shared/logging/logger', 'src/shared/logging/logger.ts'],
  ])('resolves %s through the actual Vite resolver', async (specifier, path) => {
    const config = await resolveConfig(
      { root, configFile: false, resolve: { tsconfigPaths: true } },
      'serve'
    );
    const result = await config.createResolver()(
      specifier,
      resolve(root, 'src/extension/content.ts')
    );
    expect(result).toBe(resolve(root, path));
  });

  it('uses the same resolver in the actual Vitest configuration', async () => {
    expect(vitestConfig.resolve?.tsconfigPaths).toBe(true);
    expect(vitestConfig.resolve?.alias).toBeUndefined();
    // This import executes under Vitest, independently of the explicit resolver calls above.
    const platform = await import('@platform/index');
    expect(platform.getStorageAdapter).toBeTypeOf('function');
  });
});
