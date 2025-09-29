/* eslint-env node */
/* global process, console */
import { createServer, loadConfigFromFile, mergeConfig } from 'vite';
import path from 'node:path';

const file = process.argv[2];
if (!file) {
  console.error('Usage: node scripts/inspect-transform.mjs <relative-file-path>');
  process.exit(1);
}

const root = process.cwd();
const configPath = path.resolve(root, 'vitest.config.ts');
const { config } = await loadConfigFromFile({}, configPath);
const server = await createServer(
  mergeConfig(config, {
    configFile: false,
    logLevel: 'silent',
    server: { middlewareMode: true },
  })
);

try {
  const result = await server.transformRequest(`/${file.replace(/\\/g, '/')}`);
  console.log(result?.code ?? 'No transform result');
} finally {
  await server.close();
}
