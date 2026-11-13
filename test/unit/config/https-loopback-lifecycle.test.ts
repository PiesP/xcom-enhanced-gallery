// SPDX-License-Identifier: MIT
// Copyright (c) 2026 PiesP
// @vitest-environment node

import { once } from 'node:events';
import { Agent, createServer, get } from 'node:http';
import type { ServerResponse } from 'node:http';
import { connect } from 'node:net';
import type { Socket } from 'node:net';
import { setImmediate } from 'node:timers/promises';
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

  it.each([false, true])('closes a held response with observation=%s', async (observeTransport) => {
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
    const defaultClientErrorListeners = server.listenerCount('clientError');
    const listener = await startHttpsLoopback(
      server,
      'caller-loopback-unavailable',
      observeTransport
    );
    expect(server.address()).toMatchObject({ address: '127.0.0.1', port: listener.port });
    expect(server.maxConnections).toBe(8);
    expect(server.headersTimeout).toBe(5_000);
    expect(server.requestTimeout).toBe(5_000);
    expect(server.keepAliveTimeout).toBe(1_000);
    expect(server.timeout).toBe(20_000);
    expect(server.listenerCount('clientError')).toBe(defaultClientErrorListeners);
    expect(server.keepAliveTimeoutBuffer).toBe(1_000);
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
    await setImmediate();
    if (observeTransport) {
      expect(listener.transportSnapshot()?.counts).toMatchObject({
        accepted: 1,
        active: 0,
        peakActive: 1,
        httpRequests: 1,
        closed: 1,
      });
      expect(listener.transportSnapshot()?.events.map(({ kind }) => kind)).toEqual(
        expect.arrayContaining(['tcp-accepted', 'first-http-request', 'cleanup-complete'])
      );
    } else {
      expect(listener.transportSnapshot()).toBeNull();
    }
  });

  it('observes pre-HTTP connection admission drops without relaxing the cap', async () => {
    const server = createServer();
    const listener = await startHttpsLoopback(server, 'caller-loopback-unavailable', true);
    const clients: Socket[] = [];
    try {
      for (let index = 0; index < 8; index++) {
        const accepted = once(server, 'connection');
        const socket = connect(listener.port, '127.0.0.1');
        clients.push(socket);
        await accepted;
      }
      const dropped = once(server, 'drop');
      const ninth = connect(listener.port, '127.0.0.1');
      clients.push(ninth);
      await dropped;
      const transport = listener.transportSnapshot();
      expect(server.maxConnections).toBe(8);
      expect(transport?.counts).toMatchObject({
        accepted: 8,
        peakActive: 8,
        drop: 1,
        httpRequests: 0,
      });
      expect(transport?.events.at(-1)?.kind).toBe('drop');
      for (let index = 0; index < 600; index++) {
        server.emit('drop', { localPort: listener.port, remotePort: 1 });
      }
      expect(listener.transportSnapshot()?.events).toHaveLength(512);
      expect(listener.transportSnapshot()?.counts.eventOverflow).toBeGreaterThan(0);
    } finally {
      clients.forEach((socket) => socket.destroy());
      await listener.close(() => {});
    }
    await setImmediate();
    expect(listener.transportSnapshot()?.counts.active).toBe(0);
  });

  it('retains the default malformed-HTTP response and socket termination', async () => {
    const server = createServer();
    const defaultListeners = server.listenerCount('clientError');
    const listener = await startHttpsLoopback(server, 'caller-loopback-unavailable', true);
    const client = connect(listener.port, '127.0.0.1');
    let response = '';
    client.on('data', (bytes) => {
      response += bytes.toString('utf8');
    });
    try {
      const closed = once(client, 'close');
      client.write('G@T / HTTP/1.1\r\nHost: fixture\r\n\r\n');
      await closed;
      expect(response).toContain('400 Bad Request');
      expect(server.listenerCount('clientError')).toBe(defaultListeners);
    } finally {
      client.destroy();
      await listener.close(() => {});
    }
  });

  it('releases an idle keep-alive while preserving a held response and connection cap', async () => {
    let idleSocket!: Socket;
    let heldResponse!: ServerResponse;
    let signalHeld!: () => void;
    const held = new Promise<void>((resolve) => {
      signalHeld = resolve;
    });
    const server = createServer((request, response) => {
      if (request.url === '/held') {
        heldResponse = response;
        response.write('held');
        signalHeld();
      } else {
        idleSocket = request.socket;
        response.end('ok');
      }
    });
    const listener = await startHttpsLoopback(server, 'caller-loopback-unavailable', true);
    // Keep the test client from proactively closing the advertised one-second
    // keep-alive before this test exercises the fixture owner's idle reap.
    const idleAgent = new Agent({ keepAlive: true, agentKeepAliveTimeoutBuffer: 0 });
    const heldAgent = new Agent({ keepAlive: true, agentKeepAliveTimeoutBuffer: 0 });
    const fetch = (path: string, agent: Agent) =>
      new Promise<void>((resolve, reject) => {
        const request = get({ host: '127.0.0.1', port: listener.port, path, agent }, (response) => {
          response.resume();
          response.once('end', resolve);
          response.once('error', reject);
        });
        request.once('error', reject);
      });
    try {
      await fetch('/idle', idleAgent);
      const heldFinished = fetch('/held', heldAgent);
      await held;
      const idleClosed = once(idleSocket, 'close');
      listener.releaseIdleConnections();
      await idleClosed;
      expect(heldResponse.destroyed).toBe(false);
      expect(heldResponse.socket?.destroyed).toBe(false);
      expect(server.maxConnections).toBe(8);
      await fetch('/next', idleAgent);
      heldResponse.end('done');
      await heldFinished;
      expect(listener.transportSnapshot()?.counts).toMatchObject({ accepted: 3, drop: 0 });
    } finally {
      idleAgent.destroy();
      heldAgent.destroy();
      await listener.close(() => heldResponse?.destroy());
    }
  });
});
