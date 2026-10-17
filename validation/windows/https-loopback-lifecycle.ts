// SPDX-License-Identifier: MIT
// Copyright (c) 2026 PiesP

import assert from 'node:assert/strict';
import type { Server } from 'node:http';

/** Start and close the task-owned listener without changing its fixture routes. */
export async function startHttpsLoopback(server: Server, unavailableError: string) {
  server.maxConnections = 8;
  server.headersTimeout = 5_000;
  server.requestTimeout = 5_000;
  server.keepAliveTimeout = 1_000;
  server.timeout = 20_000;
  let serverError = false;
  server.on('error', () => {
    serverError = true;
  });
  server.on('connection', (socket) => socket.setTimeout(20_000, () => socket.destroy()));
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
      async close(destroyActive: () => void) {
        destroyActive();
        server.closeAllConnections();
        await new Promise<void>((resolveClose, rejectClose) =>
          server.close((error) => (error ? rejectClose(error) : resolveClose()))
        );
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
