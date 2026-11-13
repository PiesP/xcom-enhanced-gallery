// SPDX-License-Identifier: MIT
// Copyright (c) 2026 PiesP

import assert from 'node:assert/strict';
import type { IncomingMessage, Server } from 'node:http';
import type { Socket } from 'node:net';
import type { TLSSocket } from 'node:tls';

type TransportEvent = {
  kind: string;
  atMs: number;
  connectionId?: number | null;
  localPort?: number | undefined;
  remotePort?: number | undefined;
  method?: string | undefined;
  host?: string | undefined;
  path?: string | undefined;
  range?: string | null;
  errorCode?: string | null;
  serverName?: string | null;
  hadError?: boolean;
};

/** Start and close the task-owned listener without changing its fixture routes. */
export async function startHttpsLoopback(
  server: Server,
  unavailableError: string,
  observeTransport = false
) {
  server.maxConnections = 8;
  server.headersTimeout = 5_000;
  server.requestTimeout = 5_000;
  server.keepAliveTimeout = 1_000;
  server.timeout = 20_000;
  const events: TransportEvent[] = [];
  const sockets = new Map<Socket, number>();
  const identities = new Map<string, number>();
  const firstRequests = new Set<number>();
  const counts = {
    accepted: 0,
    active: 0,
    peakActive: 0,
    drop: 0,
    secure: 0,
    tlsClientError: 0,
    httpRequests: 0,
    timeout: 0,
    closed: 0,
    eventOverflow: 0,
  };
  const identity = (socket: Socket) => `${socket.localPort}:${socket.remotePort}`;
  const record = (event: Omit<TransportEvent, 'atMs'>) => {
    if (events.length < 512) {
      events.push({ ...event, atMs: performance.now() });
    } else {
      counts.eventOverflow++;
    }
  };
  const connection = (socket: Socket) => ({
    connectionId: identities.get(identity(socket)) ?? null,
    localPort: socket.localPort,
    remotePort: socket.remotePort,
  });
  if (observeTransport) {
    server.on('drop', (data: { localPort: number; remotePort: number }) => {
      counts.drop++;
      record({ kind: 'drop', localPort: data.localPort, remotePort: data.remotePort });
    });
    server.on('secureConnection', (socket: TLSSocket) => {
      counts.secure++;
      const name = Reflect.get(socket, 'servername');
      record({
        kind: 'tls-established',
        ...connection(socket),
        serverName: typeof name === 'string' ? name : null,
      });
    });
    server.on('tlsClientError', (error: Error, socket: TLSSocket) => {
      counts.tlsClientError++;
      const code = Reflect.get(error, 'code');
      record({
        kind: 'tls-client-error',
        ...connection(socket),
        errorCode: typeof code === 'string' ? code.slice(0, 100) : null,
      });
    });
    server.prependListener('request', (request: IncomingMessage) => {
      counts.httpRequests++;
      const details = connection(request.socket);
      const first = details.connectionId !== null && !firstRequests.has(details.connectionId);
      if (details.connectionId !== null) {
        firstRequests.add(details.connectionId);
      }
      record({
        kind: first ? 'first-http-request' : 'http-request',
        ...details,
        method: request.method?.slice(0, 10),
        host: request.headers.host?.slice(0, 100),
        path: request.url?.split('?')[0]?.slice(0, 240),
        range:
          typeof request.headers.range === 'string' ? request.headers.range.slice(0, 100) : null,
      });
    });
    // In particular, do not install clientError: Node must retain its default
    // parser-error response and socket-termination behavior.
  }
  let serverError = false;
  server.on('error', () => {
    serverError = true;
  });
  server.on('connection', (socket) => {
    socket.setTimeout(20_000, () => {
      if (observeTransport) {
        counts.timeout++;
        record({ kind: 'owner-socket-timeout', ...connection(socket) });
      }
      socket.destroy();
    });
    if (!observeTransport) {
      return;
    }
    const id = ++counts.accepted;
    const key = identity(socket);
    const details = {
      connectionId: id,
      localPort: socket.localPort,
      remotePort: socket.remotePort,
    };
    sockets.set(socket, id);
    identities.set(key, id);
    counts.active = sockets.size;
    counts.peakActive = Math.max(counts.peakActive, counts.active);
    record({ kind: 'tcp-accepted', ...details });
    socket.once('close', (hadError) => {
      sockets.delete(socket);
      identities.delete(key);
      firstRequests.delete(id);
      counts.active = sockets.size;
      counts.closed++;
      record({ kind: 'socket-close', ...details, hadError });
    });
  });
  try {
    await new Promise<void>((resolveListen, rejectListen) => {
      server.once('error', rejectListen);
      server.listen(0, '127.0.0.1', () => {
        server.off('error', rejectListen);
        resolveListen();
      });
    });
    const address = server.address();
    assert(
      address &&
        typeof address !== 'string' &&
        address.address === '127.0.0.1' &&
        Number.isSafeInteger(address.port) &&
        address.port > 0
    );
    return {
      port: address.port,
      serverError: () => serverError,
      releaseIdleConnections() {
        if (observeTransport) {
          record({ kind: 'release-idle-connections' });
        }
        // A fixture phase boundary may retire renderer/media keep-alives before
        // the archive's distinct connection pool needs admission. Active HTTP
        // requests/responses remain under their existing owners and limits.
        server.closeIdleConnections();
      },
      transportSnapshot: () =>
        observeTransport
          ? {
              clock: 'guest Node performance.now; epoch = timeOrigin + atMs',
              timeOrigin: performance.timeOrigin,
              settings: {
                maxConnections: server.maxConnections,
                headersTimeout: server.headersTimeout,
                requestTimeout: server.requestTimeout,
                keepAliveTimeout: server.keepAliveTimeout,
                keepAliveTimeoutBuffer: server.keepAliveTimeoutBuffer,
                timeout: server.timeout,
                clientErrorListenerCount: server.listenerCount('clientError'),
              },
              counts: { ...counts },
              events: events.map((event) => ({ ...event })),
              limit: 512,
              responseFinishMeaning: 'bytes handed to OS, not browser receipt or cache completion',
            }
          : null,
      async close(destroyActive: () => void) {
        if (observeTransport) {
          record({ kind: 'cleanup-start' });
        }
        destroyActive();
        server.closeAllConnections();
        await new Promise<void>((resolveClose, rejectClose) =>
          server.close((error) => (error ? rejectClose(error) : resolveClose()))
        );
        if (observeTransport) {
          await Promise.all(
            [...sockets.keys()].map(
              (socket) => new Promise<void>((resolveClose) => socket.once('close', resolveClose))
            )
          );
        }
        if (observeTransport) {
          record({ kind: 'cleanup-complete' });
        }
      },
    };
  } catch {
    server.closeAllConnections();
    try {
      server.close();
    } catch {
      /* The listener never started. */
    }
    throw new Error(unavailableError);
  }
}
