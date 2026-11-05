// SPDX-License-Identifier: MIT
// Copyright (c) 2026 PiesP

import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { connect, type Socket } from 'node:net';

const MAX_CONNECTIONS = 8;
const MAX_EVENTS = 32;
const ALLOWED_AUTHORITIES = new Set(['x.com:443', 'pbs.twimg.com:443']);

type ProxyEvent = {
  atMs: number;
  authority: string;
  status: 'connected' | 'rejected' | 'upstream-failed';
};

/** A CONNECT target is an exact authority, never a URL or a DNS destination. */
export function allowedFirefoxConnect(authority: unknown, hostHeader: unknown): boolean {
  return (
    typeof authority === 'string' && ALLOWED_AUTHORITIES.has(authority) && hostHeader === authority
  );
}

/** Tunnels only two declared HTTPS origins to a task-owned 127.0.0.1 TLS listener. */
export async function startFirefoxNativeProxy(nativePort: number) {
  assert(Number.isSafeInteger(nativePort) && nativePort > 0 && nativePort <= 65_535);
  const events: ProxyEvent[] = [];
  let omittedEvents = 0;
  let connectedAllowedCount = 0;
  let pbsConnectedCount = 0;
  const sockets = new Set<Socket>();
  const upstreams = new Set<Socket>();
  let activeTunnels = 0;
  const record = (authority: string, status: ProxyEvent['status']) => {
    if (events.length < MAX_EVENTS) {
      events.push({ atMs: performance.now(), authority, status });
    } else {
      omittedEvents += 1;
    }
  };
  const server = createServer({ maxHeaderSize: 4_096 }, (_request, response) => {
    response.writeHead(403, { Connection: 'close', 'Content-Length': '0' });
    response.end();
  });
  server.maxConnections = MAX_CONNECTIONS;
  server.headersTimeout = 5_000;
  server.requestTimeout = 5_000;
  server.keepAliveTimeout = 1_000;
  server.timeout = 20_000;
  server.on('connection', (socket) => {
    sockets.add(socket);
    socket.setTimeout(20_000, () => socket.destroy());
    socket.once('close', () => sockets.delete(socket));
  });
  server.on('clientError', (_error, socket) => {
    if (socket.writable) {
      socket.end('HTTP/1.1 400 Bad Request\r\nConnection: close\r\nContent-Length: 0\r\n\r\n');
    } else {
      socket.destroy();
    }
  });
  server.on('connect', (request, client, head) => {
    const authority = typeof request.url === 'string' ? request.url : '';
    if (
      !allowedFirefoxConnect(authority, request.headers.host) ||
      activeTunnels >= MAX_CONNECTIONS
    ) {
      record(authority.slice(0, 100), 'rejected');
      client.end('HTTP/1.1 403 Forbidden\r\nConnection: close\r\nContent-Length: 0\r\n\r\n');
      return;
    }
    activeTunnels += 1;
    const upstream = connect({ host: '127.0.0.1', port: nativePort });
    upstreams.add(upstream);
    upstream.setTimeout(20_000, () => upstream.destroy());
    let established = false;
    let settled = false;
    let responding = false;
    const finish = () => {
      if (settled) {
        return;
      }
      settled = true;
      activeTunnels -= 1;
      upstreams.delete(upstream);
      client.destroy();
      upstream.destroy();
    };
    const badGateway = () => {
      if (settled || responding) {
        return;
      }
      responding = true;
      if (client.writable) {
        client.end(
          'HTTP/1.1 502 Bad Gateway\r\nConnection: close\r\nContent-Length: 0\r\n\r\n',
          finish
        );
      } else {
        finish();
      }
    };
    client.once('close', finish);
    upstream.once('close', () => {
      if (established) {
        finish();
      } else {
        badGateway();
      }
    });
    client.once('error', finish);
    upstream.once('error', () => {
      if (settled) {
        return;
      }
      record(authority, 'upstream-failed');
      if (!established && client.writable) {
        badGateway();
      } else {
        finish();
      }
    });
    upstream.once('connect', () => {
      if (settled || client.destroyed) {
        finish();
        return;
      }
      established = true;
      connectedAllowedCount += 1;
      if (authority === 'pbs.twimg.com:443') {
        pbsConnectedCount += 1;
      }
      record(authority, 'connected');
      client.write('HTTP/1.1 200 Connection Established\r\n\r\n');
      if (head.length) {
        upstream.write(head);
      }
      client.pipe(upstream);
      upstream.pipe(client);
    });
  });
  await new Promise<void>((resolveListen, rejectListen) => {
    server.once('error', rejectListen);
    server.listen(0, '127.0.0.1', () => {
      server.off('error', rejectListen);
      resolveListen();
    });
  });
  const address = server.address();
  assert(address && typeof address !== 'string' && address.address === '127.0.0.1');
  let closed = false;
  return {
    port: address.port,
    mark: () => events.length,
    since: (mark: number) => events.slice(mark),
    snapshot: () => ({
      events: [...events],
      omittedEvents,
      connectedAllowedCount,
      pbsConnectedCount,
      activeTunnels,
      openSockets: sockets.size,
    }),
    async close() {
      if (closed) {
        return;
      }
      closed = true;
      for (const socket of [...sockets, ...upstreams]) socket.destroy();
      await new Promise<void>((resolveClose, rejectClose) =>
        server.close((error) => (error ? rejectClose(error) : resolveClose()))
      );
    },
  };
}
