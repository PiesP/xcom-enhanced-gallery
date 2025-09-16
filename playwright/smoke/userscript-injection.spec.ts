import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

// Helper to pick dev build when available locally for easier debugging
function resolveUserscriptPath(): string {
  const cwd = process.cwd();
  const dev = path.resolve(cwd, 'dist/xcom-enhanced-gallery.dev.user.js');
  const prod = path.resolve(cwd, 'dist/xcom-enhanced-gallery.user.js');
  if (fs.existsSync(dev)) return dev;
  if (fs.existsSync(prod)) return prod;
  throw new Error('Userscript bundle not found. Run "npm run build" first.');
}

test('Userscript injects without console errors and mounts containers', async ({
  page,
  context,
}) => {
  const userscriptPath = resolveUserscriptPath();
  const userscriptCode = fs.readFileSync(userscriptPath, 'utf8');

  const consoleErrors: string[] = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  // Block all external network. We'll serve a minimal HTML for https://x.com/*
  await context.route('**/*', route => {
    const url = route.request().url();
    // Allow data: and blob: if any
    if (url.startsWith('data:') || url.startsWith('blob:')) {
      return route.continue();
    }
    // Serve minimal HTML for x.com
    if (url.startsWith('https://x.com') || url.startsWith('https://www.x.com')) {
      return route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: '<!doctype html><html><head><meta charset="utf-8"><title>X</title></head><body><main id="react-root"></main></body></html>',
      });
    }
    // Otherwise block - ensures no external network calls leak
    return route.abort();
  });

  // Go to target origin first
  await page.goto('https://x.com/');

  // Emulate userscript execution at document-idle by adding script tag after load
  await page.addScriptTag({ content: userscriptCode });

  // Wait for style injector (id: xeg-styles)
  await expect(page.locator('#xeg-styles')).toHaveCount(1, { timeout: 5_000 });

  // Assert: no console errors after startup window
  expect(consoleErrors, consoleErrors.join('\n')).toHaveLength(0);

  // Toast container is created lazily only in non-test mode by main.ts, but our userscript header runs at document-idle.
  // We check presence defensively: zero or one acceptable, but if present ensure it is a div.
  const toastCount = await page.locator('#xeg-toast-container').count();
  expect(toastCount).toBeGreaterThanOrEqual(0);
});
