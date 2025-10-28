import { defineConfig, devices } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const testDir = path.resolve(__dirname, 'playwright');

// 환경 변수로 테스트 디렉터리 선택 가능
const testSubDir = process.env.PLAYWRIGHT_TEST_DIR || 'smoke';
const testMatch = new RegExp(`${testSubDir.replace(/\//g, '/')}/.*\\.spec\\.ts$`);

export default defineConfig({
  testDir,
  testMatch,
  timeout: 60_000,
  expect: {
    timeout: 5_000,
  },
  fullyParallel: true, // 병렬 실행 활성화 (12 코어 활용)
  workers: process.env.CI ? 4 : 10, // 로컬: 10 워커, CI: 4 워커
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: [['list']],
  use: {
    baseURL: 'about:blank',
    viewport: { width: 1280, height: 720 },
    trace: 'on-first-retry',
    video: process.env.CI ? 'retain-on-failure' : 'retry-with-video',
    screenshot: 'only-on-failure',
    actionTimeout: 10_000,
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
      },
    },
  ],
  globalSetup: path.resolve(__dirname, 'playwright', 'global-setup.ts'),
});
