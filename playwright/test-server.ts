/**
 * @fileoverview Local Test Server for Playwright E2E Tests
 * @description Serves static HTML with localStorage access enabled
 *
 * Purpose:
 * - Resolve localStorage SecurityError in data: URLs
 * - Provide proper origin for storage API tests
 * - Minimal HTTP server for E2E testing
 *
 * Usage:
 * - Called from playwright/global-setup.ts
 * - Starts server before tests, stops after
 * - Port: 3456 (configurable via TEST_SERVER_PORT)
 */

import http from 'node:http';
import { URL } from 'node:url';

export interface TestServerOptions {
  port?: number;
  host?: string;
}

export class TestServer {
  private server: http.Server | null = null;
  private port: number;
  private host: string;

  constructor(options: TestServerOptions = {}) {
    this.port = options.port ?? 3456;
    this.host = options.host ?? 'localhost';
  }

  /**
   * Start the test server
   */
  async start(): Promise<string> {
    if (this.server) {
      throw new Error('Server already running');
    }

    return new Promise((resolve, reject) => {
      this.server = http.createServer((req, res) => {
        const url = new URL(req.url ?? '/', `http://${this.host}`);

        // CORS headers for cross-origin testing
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        // Handle preflight
        if (req.method === 'OPTIONS') {
          res.writeHead(204);
          res.end();
          return;
        }

        // Serve test page
        if (url.pathname === '/' || url.pathname === '/test.html') {
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(this.getTestPageHTML());
          return;
        }

        // Health check
        if (url.pathname === '/health') {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ status: 'ok' }));
          return;
        }

        // 404
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
      });

      this.server.listen(this.port, this.host, () => {
        const url = `http://${this.host}:${this.port}`;
        resolve(url);
      });

      this.server.on('error', error => {
        reject(error);
      });
    });
  }

  /**
   * Stop the test server
   */
  async stop(): Promise<void> {
    if (!this.server) {
      return;
    }

    return new Promise((resolve, reject) => {
      this.server!.close(error => {
        if (error) {
          reject(error);
        } else {
          this.server = null;
          resolve();
        }
      });
    });
  }

  /**
   * Get server URL
   */
  getURL(): string {
    return `http://${this.host}:${this.port}`;
  }

  /**
   * Generate test page HTML
   */
  private getTestPageHTML(): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>XEG E2E Test Page</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    }
    #test-container {
      width: 100vw;
      height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f5f5f5;
    }
    #status {
      text-align: center;
      color: #666;
    }
  </style>
</head>
<body>
  <div id="test-container">
    <div id="status">
      <h1>XEG E2E Test Environment</h1>
      <p>localStorage: <span id="storage-status">checking...</span></p>
      <p>Test harness: <span id="harness-status">waiting...</span></p>
    </div>
  </div>

  <script>
    // Check localStorage access
    try {
      localStorage.setItem('xeg-test', 'ok');
      localStorage.removeItem('xeg-test');
      document.getElementById('storage-status').textContent = '✅ Available';
      document.getElementById('storage-status').style.color = 'green';
    } catch (error) {
      document.getElementById('storage-status').textContent = '❌ Blocked';
      document.getElementById('storage-status').style.color = 'red';
      console.error('localStorage access denied:', error);
    }

    // Wait for harness injection
    const checkHarness = () => {
      if (window.__XEG_HARNESS__) {
        document.getElementById('harness-status').textContent = '✅ Loaded';
        document.getElementById('harness-status').style.color = 'green';
      } else {
        setTimeout(checkHarness, 100);
      }
    };
    checkHarness();
  </script>
</body>
</html>`;
  }
}

/**
 * Singleton instance for global-setup
 */
let serverInstance: TestServer | null = null;

export async function startTestServer(options?: TestServerOptions): Promise<string> {
  if (serverInstance) {
    return serverInstance.getURL();
  }

  serverInstance = new TestServer(options);
  const url = await serverInstance.start();
  return url;
}

export async function stopTestServer(): Promise<void> {
  if (serverInstance) {
    await serverInstance.stop();
    serverInstance = null;
  }
}

export function getTestServerURL(): string {
  if (!serverInstance) {
    throw new Error('Test server not started');
  }
  return serverInstance.getURL();
}
