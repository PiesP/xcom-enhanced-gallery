// SPDX-License-Identifier: MIT
// Copyright (c) 2026 PiesP

import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { createInterface } from 'node:readline';

type Point = { x: number; y: number };
type BrowserImage = 'chrome.exe' | 'msedge.exe' | 'firefox.exe';

type Viewport = {
  width: number;
  height: number;
  dpr: number;
  screenWidth: number;
  screenHeight: number;
};

type Ready = {
  status: string;
  processId: number;
  imagePath: string;
  windowTitle: string;
  hwnd: number;
  document: { left: number; top: number; width: number; height: number };
};

/** Task-owned desktop bridge for a single foreground installed browser window. */
export async function prepareNativeScrollbarPointer(
  evaluate: (expression: string) => Promise<unknown>,
  root: string,
  image: BrowserImage
): Promise<{
  mapping: Record<string, unknown>;
  drag: (from: Point, to: Point, afterDown: () => Promise<void>) => Promise<void>;
  close: () => Promise<void>;
}> {
  assert.equal(
    process.platform,
    'win32',
    'Native scrollbar input requires the prepared Windows VM'
  );
  const marker = `XEG native scrollbar ${randomUUID()}`;
  const priorTitle = (await evaluate(`(() => {
    const prior = document.title;
    document.title = ${JSON.stringify(marker)};
    return prior;
  })()`)) as string;
  let restored = false;
  const restoreTitle = async (): Promise<void> => {
    if (restored) {
      return;
    }
    restored = true;
    await evaluate(`(() => {
      if (document.title === ${JSON.stringify(marker)}) document.title = ${JSON.stringify(priorTitle)};
      return true;
    })()`);
  };
  const child = spawn(
    'powershell.exe',
    [
      '-NoProfile',
      '-NonInteractive',
      '-ExecutionPolicy',
      'Bypass',
      '-File',
      join(root, 'validation/windows/native-scrollbar-pointer.ps1'),
      '-TitleMarker',
      marker,
      '-BrowserImage',
      image,
    ],
    { stdio: ['pipe', 'pipe', 'pipe'], windowsHide: true }
  );
  const lines = createInterface({ input: child.stdout })[Symbol.asyncIterator]();
  let diagnostic = '';
  child.on('error', (error) => {
    diagnostic = (diagnostic + String(error)).slice(-2_000);
  });
  child.stdin.on('error', (error) => {
    diagnostic = (diagnostic + String(error)).slice(-2_000);
  });
  child.stderr.setEncoding('utf8');
  child.stderr.on('data', (chunk: string) => {
    diagnostic = (diagnostic + chunk).slice(-2_000);
  });
  const response = async (timeoutMs = 6_000): Promise<Record<string, unknown>> => {
    let timer: NodeJS.Timeout | undefined;
    const deadline = new Promise<never>((_, reject) => {
      timer = setTimeout(
        () => reject(new Error('Owned native pointer bridge timed out')),
        timeoutMs
      );
      timer.unref();
    });
    const line = await Promise.race([lines.next(), deadline]).finally(() => clearTimeout(timer));
    if (line.done) {
      throw new Error(`Owned native pointer bridge exited: ${diagnostic}`);
    }
    const value: unknown = JSON.parse(line.value);
    assert(value && typeof value === 'object' && !Array.isArray(value));
    return value as Record<string, unknown>;
  };
  const command = async (value: Record<string, unknown>): Promise<void> => {
    assert(child.stdin.writable, `Owned native pointer bridge is unavailable: ${diagnostic}`);
    child.stdin.write(`${JSON.stringify(value)}\n`);
    const result = await response();
    assert.equal(result.status, 'ok', `Owned native pointer bridge rejected input: ${diagnostic}`);
  };
  let closed = false;
  const close = async (): Promise<void> => {
    if (closed) {
      return;
    }
    closed = true;
    try {
      if (child.stdin.writable) {
        child.stdin.write('{"command":"up"}\n{"command":"close"}\n');
        child.stdin.end();
      }
      if (child.exitCode === null) {
        let timer: NodeJS.Timeout | undefined;
        const deadline = new Promise<void>((resolve) => {
          timer = setTimeout(() => {
            child.kill();
            resolve();
          }, 3_000);
          timer.unref();
        });
        await Promise.race([
          new Promise<void>((resolve) => child.once('exit', () => resolve())),
          deadline,
        ]).finally(() => clearTimeout(timer));
      }
    } finally {
      await restoreTitle();
    }
  };
  try {
    const ready = (await response()) as Ready;
    assert.equal(ready.status, 'ready');
    assert.equal(ready.windowTitle.includes(marker), true);
    assert.equal(ready.imagePath.toLowerCase().endsWith(`\\${image}`), true);
    assert(Number.isInteger(ready.processId) && ready.processId > 0);
    const viewport = (await evaluate(`(() => ({
      width: innerWidth, height: innerHeight, dpr: devicePixelRatio,
      screenWidth: screen.width, screenHeight: screen.height,
    }))()`)) as Viewport;
    const { document: bounds } = ready;
    const dimensions: Array<[number, number]> = [
      [bounds.width, viewport.width * viewport.dpr],
      [bounds.height, viewport.height * viewport.dpr],
    ];
    for (const [actual, expected] of dimensions) {
      assert(
        Math.abs(actual - expected) <= Math.max(4, viewport.dpr * 2),
        'UIA document and CSS viewport do not match'
      );
    }
    assert(
      bounds.left >= 0 &&
        bounds.top >= 0 &&
        bounds.left + bounds.width <= viewport.screenWidth * viewport.dpr + 2 &&
        bounds.top + bounds.height <= viewport.screenHeight * viewport.dpr + 2,
      'UIA browser document is outside the prepared desktop'
    );
    const point = ({ x, y }: Point): Point => {
      assert(x >= 0 && x < viewport.width && y >= 0 && y < viewport.height);
      return {
        x: Math.round(bounds.left + x * viewport.dpr),
        y: Math.round(bounds.top + y * viewport.dpr),
      };
    };
    return {
      mapping: {
        kind: 'DPI-aware UI Automation document + OS SendInput',
        browserImage: image,
        processId: ready.processId,
        hwnd: ready.hwnd,
        documentPhysical: bounds,
        viewportCss: viewport,
      },
      drag: async (from, to, afterDown) => {
        const start = point(from);
        const end = point(to);
        await command({ command: 'move', ...start });
        await command({ command: 'down' });
        try {
          await afterDown();
          for (let step = 1; step <= 10; step += 1) {
            await command({
              command: 'move',
              x: Math.round(start.x + ((end.x - start.x) * step) / 10),
              y: Math.round(start.y + ((end.y - start.y) * step) / 10),
            });
            await delay(35);
          }
        } finally {
          await command({ command: 'up' });
        }
      },
      close,
    };
  } catch (error) {
    await close();
    throw error;
  }
}
