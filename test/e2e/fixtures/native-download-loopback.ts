// SPDX-License-Identifier: MIT
// Copyright (c) 2026 PiesP

import { execFileSync } from 'node:child_process';
import { createHash, createPrivateKey, X509Certificate } from 'node:crypto';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { createServer } from 'node:https';
import type { AddressInfo, Socket } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { TLSSocket } from 'node:tls';

const HOST = 'pbs.twimg.com';
const ORIGINAL_PATH = '/media/GkE1234ABCDEF.jpg?format=jpg&name=orig';
const MAX_REQUESTS = 8;
const MAX_IMAGE_BYTES = 1_024;
const MAX_SERVED_BYTES = 8_192;
const MAX_CONNECTIONS = 12;

export const NATIVE_ORIGINAL_URL = `https://${HOST}${ORIGINAL_PATH}`;

export interface NativeDownloadSnapshot {
  readonly requests: number;
  readonly unexpected: number;
  readonly servedBytes: number;
  readonly servedGets: number;
  readonly previewRequests: number;
  readonly overflow: boolean;
  readonly serverError: boolean;
}

export async function startNativeDownloadLoopback(image: Buffer): Promise<{
  readonly port: number;
  readonly spkiSha256: string;
  snapshot(): NativeDownloadSnapshot;
  close(): Promise<void>;
}> {
  if (image.length === 0 || image.length > MAX_IMAGE_BYTES) {
    throw new Error('Native fixture image exceeds its byte limit');
  }
  const certificateDir = mkdtempSync(join(tmpdir(), 'xeg-native-download-'));
  const keyPath = join(certificateDir, 'key.pem');
  const certPath = join(certificateDir, 'cert.pem');
  let server: ReturnType<typeof createServer> | undefined;
  try {
    execFileSync(
      '/usr/bin/openssl',
      [
        'req',
        '-x509',
        '-newkey',
        'rsa:2048',
        '-sha256',
        '-nodes',
        '-days',
        '1',
        '-subj',
        `/CN=${HOST}`,
        '-addext',
        `subjectAltName=DNS:${HOST}`,
        '-addext',
        'basicConstraints=critical,CA:FALSE',
        '-keyout',
        keyPath,
        '-out',
        certPath,
      ],
      { timeout: 10_000, maxBuffer: 16_384, stdio: 'pipe' }
    );
    if (!existsSync(keyPath) || !existsSync(certPath)) {
      throw new Error('Native fixture certificate was not created');
    }
    const key = readFileSync(keyPath);
    const cert = readFileSync(certPath);
    const x509 = new X509Certificate(cert);
    if (
      x509.checkHost(HOST, { subject: 'never' }) !== HOST ||
      x509.ca ||
      !x509.checkPrivateKey(createPrivateKey(key))
    ) {
      throw new Error('Native fixture certificate is invalid');
    }
    const spkiSha256 = createHash('sha256')
      .update(x509.publicKey.export({ type: 'spki', format: 'der' }))
      .digest('base64');

    let requests = 0;
    let unexpected = 0;
    let reservedBytes = 0;
    let servedBytes = 0;
    let servedGets = 0;
    let previewRequests = 0;
    let overflow = false;
    let serverError = false;
    let connections = 0;
    const sockets = new Set<Socket>();
    const responses = new Set<ServerResponse>();
    const handle = (request: IncomingMessage, response: ServerResponse): void => {
      requests += 1;
      if (requests > MAX_REQUESTS) {
        overflow = true;
        response.destroy();
        return;
      }
      if (
        (request.method !== 'GET' && request.method !== 'HEAD') ||
        request.headers.host !== HOST ||
        (request.socket as TLSSocket).servername !== HOST ||
        request.url !== ORIGINAL_PATH
      ) {
        unexpected += 1;
        response.writeHead(404, { 'Content-Length': '0', 'Cache-Control': 'no-store' });
        response.end();
        return;
      }
      const range = request.headers.range;
      const match = typeof range === 'string' ? /^bytes=(\d+)-(\d*)$/u.exec(range) : null;
      if (
        range !== undefined &&
        (!match ||
          Number(match[1]) >= image.length ||
          (match[2] !== '' && Number(match[2]) < Number(match[1])))
      ) {
        unexpected += 1;
        response.writeHead(416, { 'Content-Length': '0', 'Cache-Control': 'no-store' });
        response.end();
        return;
      }
      const start = match ? Number(match[1]) : 0;
      const end =
        match && match[2] !== '' ? Math.min(Number(match[2]), image.length - 1) : image.length - 1;
      const body = image.subarray(start, end + 1);
      if (reservedBytes + body.length > MAX_SERVED_BYTES) {
        overflow = true;
        response.destroy();
        return;
      }
      reservedBytes += body.length;
      if (request.headers['sec-fetch-dest'] === 'image') {
        previewRequests += 1;
      }
      responses.add(response);
      response.once('close', () => responses.delete(response));
      response.once('finish', () => {
        if (request.method === 'GET') {
          servedGets += 1;
          servedBytes += body.length;
        }
      });
      response.writeHead(match ? 206 : 200, {
        'Content-Type': 'image/png',
        'Content-Length': String(body.length),
        'Cache-Control': 'no-store',
        'Accept-Ranges': 'bytes',
        ...(match ? { 'Content-Range': `bytes ${start}-${end}/${image.length}` } : {}),
      });
      response.end(request.method === 'HEAD' ? undefined : body);
    };
    server = createServer({ key, cert, maxHeaderSize: 4_096 }, handle);
    server.maxConnections = 4;
    server.headersTimeout = 5_000;
    server.requestTimeout = 5_000;
    server.keepAliveTimeout = 1_000;
    server.timeout = 20_000;
    server.on('error', () => {
      serverError = true;
    });
    server.on('connection', (socket) => {
      connections += 1;
      if (connections > MAX_CONNECTIONS) {
        overflow = true;
        socket.destroy();
        return;
      }
      sockets.add(socket);
      socket.once('close', () => sockets.delete(socket));
      socket.setTimeout(20_000, () => socket.destroy());
    });
    await new Promise<void>((resolveListen, rejectListen) => {
      server!.once('error', rejectListen);
      server!.listen(0, '127.0.0.1', () => {
        server!.off('error', rejectListen);
        resolveListen();
      });
    });
    const address = server.address() as AddressInfo | null;
    if (!address || address.address !== '127.0.0.1' || address.port <= 0) {
      throw new Error('Native fixture did not bind to loopback');
    }
    const ownedServer = server;
    return {
      port: address.port,
      spkiSha256,
      snapshot: () => ({
        requests,
        unexpected,
        servedBytes,
        servedGets,
        previewRequests,
        overflow,
        serverError,
      }),
      async close() {
        for (const response of responses) {
          response.destroy();
        }
        ownedServer.closeAllConnections();
        for (const socket of sockets) {
          socket.destroy();
        }
        try {
          await new Promise<void>((resolveClose, rejectClose) =>
            ownedServer.close((error) => (error ? rejectClose(error) : resolveClose()))
          );
        } finally {
          rmSync(certificateDir, { recursive: true, force: true });
        }
      },
    };
  } catch (error) {
    server?.closeAllConnections();
    try {
      server?.close();
    } catch {
      /* The listener may not have started. */
    }
    rmSync(certificateDir, { recursive: true, force: true });
    throw error;
  }
}
