import type { KnipConfig } from 'knip';

const config: KnipConfig = {
  entry: ['src/main.ts'],
  project: ['src/**/*.ts', 'src/**/*.tsx'],
  paths: {
    '@constants/*': ['src/constants/*'],
    '@features/*': ['src/features/*'],
    '@shared/*': ['src/shared/*'],
  },
  tags: ['-@internal'],
  ignoreDependencies: [],
};

export default config;
