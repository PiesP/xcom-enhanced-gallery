// SPDX-License-Identifier: MIT
// Copyright (c) 2026 PiesP
// @vitest-environment node

import { once } from 'node:events';
import { createServer, get } from 'node:http';
import type { ServerResponse } from 'node:http';
import { describe, expect, it } from 'vite-plus/test';
import { startHttpsLoopback } from '../../../validation/windows/https-loopback-lifecycle.ts';

describe('owned loopback listener lifecycle', () => {
  it('rejects startup failure with the caller error and closes its listener', async () => {
    const server = createServer();
    await new Promise<void>((resolveListen) => server.listen(0, '127.0.0.1', resolveListen));
    await expect(startHttpsLoopback(server, 'caller-loopback-unavailable')).rejects.toThrow(
      'caller-loopback-unavailable'
    );
    expect(server.listening).toBe(false);
    expect(server.address()).toBeNull();
  });

  it('closes a held response before connections and the listener', async () => {
    const active = new Set<ServerResponse>();
    let responseStarted!: (response: ServerResponse) => void;
    const started = new Promise<ServerResponse>((resolveResponse) => {
      responseStarted = resolveResponse;
    });
    const server = createServer((_request, response) => {
      active.add(response);
      response.once('close', () => active.delete(response));
      response.writeHead(200);
      response.write('held');
      responseStarted(response);
    });
    const listener = await startHttpsLoopback(server, 'caller-loopback-unavailable');
    expect(server.address()).toMatchObject({ address: '127.0.0.1', port: listener.port });
    expect(server.maxConnections).toBe(8);
    expect(server.headersTimeout).toBe(5_000);
    expect(server.requestTimeout).toBe(5_000);
    expect(server.keepAliveTimeout).toBe(1_000);
    expect(server.timeout).toBe(20_000);
    const request = get(`http://127.0.0.1:${listener.port}/held`);
    request.on('error', () => {});
    const heldResponse = await started;
    const responseClosed = once(heldResponse, 'close');
    expect(active.size).toBe(1);
    await listener.close(() => {
      for (const response of active) {
        response.destroy();
      }
    });
    await responseClosed;
    expect(active.size).toBe(0);
    expect(server.listening).toBe(false);
    expect(server.address()).toBeNull();
  });
});
