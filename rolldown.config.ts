/**
 * Rolldown Configuration (백업용)
 * 간결한 네이티브 Rolldown 설정
 */

import { resolve } from 'path';
import { defineConfig } from 'rolldown';

const isProduction = process.env.NODE_ENV === 'production';

export default defineConfig({
  input: resolve(__dirname, 'src/main.ts'),

  output: {
    dir: 'dist',
    format: 'iife',
    entryFileNames: 'xcom-enhanced-gallery.user.js',
    sourcemap: !isProduction,
  },

  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@app': resolve(__dirname, 'src/app'),
      '@features': resolve(__dirname, 'src/features'),
      '@shared': resolve(__dirname, 'src/shared'),
      '@core': resolve(__dirname, 'src/core'),
      '@infrastructure': resolve(__dirname, 'src/infrastructure'),
      '@utils': resolve(__dirname, 'src/utils'),
      '@assets': resolve(__dirname, 'src/assets'),
    },
  },

  external: ['chrome', 'browser'],

  treeshake: true,

  experimental: {
    strictExecutionOrder: true,
  },
});
