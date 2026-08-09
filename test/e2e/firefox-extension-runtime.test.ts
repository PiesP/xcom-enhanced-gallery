// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createServer, type Server } from 'node:https';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, test } from 'node:test';
import { By, until } from 'selenium-webdriver';
import * as firefox from 'selenium-webdriver/firefox.js';
import { FIREFOX_EXTENSION_DIR, MOCK_GALLERY_HTML, MOCK_IMAGE } from './fixtures/artifacts.ts';

const TEST_TIMEOUT_MS = 120_000;
const WAIT_TIMEOUT_MS = 20_000;

let driver: firefox.Driver | undefined;
let server: Server | undefined;
let certificateDirectory: string | undefined;
let extensionDirectory: string | undefined;

after(async () => {
  let cleanupError: unknown;
  try {
    if (driver) await driver.quit();
  } catch (error) {
    cleanupError = error;
  }
  try {
    if (server) {
      await new Promise<void>((resolve, reject) =>
        server?.close((error) => (error ? reject(error) : resolve()))
      );
    }
  } catch (error) {
    cleanupError ??= error;
  }
  try {
    if (certificateDirectory) rmSync(certificateDirectory, { recursive: true, force: true });
    if (extensionDirectory) rmSync(extensionDirectory, { recursive: true, force: true });
  } catch (error) {
    cleanupError ??= error;
  }
  if (cleanupError) throw cleanupError;
});

function createRuntimeTestExtension(): string {
  extensionDirectory = mkdtempSync(join(tmpdir(), 'xeg-firefox-extension-'));
  cpSync(FIREFOX_EXTENSION_DIR, extensionDirectory, { recursive: true });
  const manifestPath = join(extensionDirectory, 'manifest.json');
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as {
    content_scripts?: Array<{ js?: string[] }>;
  };
  const contentScript = manifest.content_scripts?.[0];
  if (!contentScript?.js) throw new Error('Firefox manifest has no content script entry');
  contentScript.js.push('runtime-smoke.js');
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  writeFileSync(
    join(extensionDirectory, 'runtime-smoke.js'),
    `browser.runtime.sendMessage({ type: 'NOT_A_REAL_MESSAGE', payload: {} }).then((response) => {
  document.documentElement.setAttribute('data-xeg-firefox-background', JSON.stringify(response));
});\n`
  );
  return extensionDirectory;
}

function createCertificate(): { cert: Buffer; key: Buffer } {
  certificateDirectory = mkdtempSync(join(tmpdir(), 'xeg-firefox-cert-'));
  const certPath = join(certificateDirectory, 'cert.pem');
  const keyPath = join(certificateDirectory, 'key.pem');
  execFileSync(
    'openssl',
    [
      'req',
      '-x509',
      '-newkey',
      'rsa:2048',
      '-nodes',
      '-keyout',
      keyPath,
      '-out',
      certPath,
      '-days',
      '1',
      '-subj',
      '/CN=x.com',
      '-addext',
      'subjectAltName=DNS:x.com,DNS:pbs.twimg.com',
    ],
    { stdio: 'ignore' }
  );
  return { cert: readFileSync(certPath), key: readFileSync(keyPath) };
}

async function startFixtureServer(): Promise<number> {
  const credentials = createCertificate();
  server = createServer(credentials, (request, response) => {
    if (request.headers.host?.startsWith('pbs.twimg.com')) {
      response.writeHead(200, { 'content-type': 'image/png' });
      response.end(MOCK_IMAGE);
      return;
    }
    const address = server?.address();
    if (!address || typeof address === 'string') {
      response.writeHead(500);
      response.end();
      return;
    }
    const mediaOrigin = `https://pbs.twimg.com:${address.port}`;
    response.writeHead(200, {
      'content-type': 'text/html; charset=utf-8',
      'content-security-policy': `default-src 'self'; img-src 'self' ${mediaOrigin} data:; style-src 'unsafe-inline'`,
    });
    response.end(MOCK_GALLERY_HTML.replaceAll('https://pbs.twimg.com', mediaOrigin));
  });
  await new Promise<void>((resolve, reject) => {
    server?.once('error', reject);
    server?.listen(0, '127.0.0.1', resolve);
  });
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Fixture server has no TCP port');
  return address.port;
}

test(
  'installs the Firefox extension and exercises content and background runtimes',
  { timeout: TEST_TIMEOUT_MS },
  async () => {
    const port = await startFixtureServer();
    const options = new firefox.Options()
      .addArguments('-headless')
      .setPreference('network.dns.localDomains', 'x.com,pbs.twimg.com');
    options.setAcceptInsecureCerts(true);

    const firefoxDriver = firefox.Driver.createSession(options);
    driver = firefoxDriver;
    const addonId = await firefoxDriver.installAddon(createRuntimeTestExtension(), true);
    assert.equal(addonId, 'xcom-enhanced-gallery@piesp.dev');

    await firefoxDriver.get(`https://x.com:${port}/testuser/status/1234567890123456789`);
    await firefoxDriver.wait(
      async () =>
        (await firefoxDriver.executeScript(
          "return document.documentElement.getAttribute('data-xeg-gallery-ready')"
        )) === 'true',
      WAIT_TIMEOUT_MS,
      'Firefox content script did not initialize the gallery'
    );

    const firstPhoto = await firefoxDriver.findElement(By.css('[data-testid="tweetPhoto"] img'));
    await firstPhoto.click();
    const gallery = await firefoxDriver.wait(
      until.elementLocated(By.css('[data-xeg-gallery-container]')),
      WAIT_TIMEOUT_MS
    );
    assert.equal(await gallery.isDisplayed(), true);

    const backgroundResponse = await firefoxDriver.wait(
      async () => {
        const value = await firefoxDriver.executeScript<string | null>(
          "return document.documentElement.getAttribute('data-xeg-firefox-background')"
        );
        return value ? (JSON.parse(value) as { error?: string; success?: boolean }) : false;
      },
      WAIT_TIMEOUT_MS,
      'Firefox background runtime did not answer the content-script probe'
    );
    assert.deepEqual(backgroundResponse, { success: false, error: 'Unknown message type' });
  }
);
