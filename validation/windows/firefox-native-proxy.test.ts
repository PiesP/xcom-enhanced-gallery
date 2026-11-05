// SPDX-License-Identifier: MIT
// Copyright (c) 2026 PiesP

import assert from 'node:assert/strict';
import { createServer } from 'node:net';
import { connect } from 'node:net';
import { test } from 'vitest';
import { allowedFirefoxConnect, startFirefoxNativeProxy } from './firefox-native-proxy.ts';

test('Firefox CONNECT proxy admits only exact declared HTTPS authorities', () => {
  for (const authority of ['pbs.twimg.com:443', 'x.com:443']) {
    assert(allowedFirefoxConnect(authority, authority));
  }
  for (const authority of [
    'video.twimg.com:443',
    'pbs.twimg.com:80',
    'pbs.twimg.com:443/',
    '127.0.0.1:443',
    'pbs.twimg.com:443@other',
  ]) {
    assert.equal(allowedFirefoxConnect(authority, authority), false);
  }
  assert.equal(allowedFirefoxConnect('pbs.twimg.com:443', 'x.com:443'), false);
});

test('Firefox CONNECT proxy forwards only to its owned loopback server and rejects plain HTTP', async () => {
  const target = createServer((socket) => {
    socket.on('data', (bytes: Buffer) => {
      assert.equal(bytes.toString(), 'native-original-request');
      socket.end('native-original-response');
    });
  });
  await new Promise<void>((resolve) => target.listen(0, '127.0.0.1', resolve));
  const targetAddress = target.address();
  assert(targetAddress && typeof targetAddress !== 'string');
  const proxy = await startFirefoxNativeProxy(targetAddress.port);
  const raw = (request: string) =>
    new Promise<string>((resolve, reject) => {
      const socket = connect({ host: '127.0.0.1', port: proxy.port });
      const chunks: Buffer[] = [];
      socket.setTimeout(2_000, () => socket.destroy(new Error('Proxy test timed out')));
      socket.on('data', (chunk: Buffer) => chunks.push(chunk));
      socket.once('error', reject);
      socket.once('close', () => resolve(Buffer.concat(chunks).toString()));
      socket.once('connect', () => socket.write(request));
    });
  try {
    assert.match(
      await raw('GET http://pbs.twimg.com/ HTTP/1.1\r\nHost: pbs.twimg.com\r\n\r\n'),
      /^HTTP\/1\.1 403/u
    );
    assert.match(
      await raw('CONNECT video.twimg.com:443 HTTP/1.1\r\nHost: video.twimg.com:443\r\n\r\n'),
      /^HTTP\/1\.1 403/u
    );
    const reply = await new Promise<string>((resolve, reject) => {
      const socket = connect({ host: '127.0.0.1', port: proxy.port });
      const chunks: Buffer[] = [];
      let tunnel = false;
      socket.setTimeout(2_000, () => socket.destroy(new Error('Proxy tunnel timed out')));
      socket.on('data', (chunk: Buffer) => {
        chunks.push(chunk);
        if (!tunnel && Buffer.concat(chunks).includes(Buffer.from('\r\n\r\n'))) {
          tunnel = true;
          socket.write('native-original-request');
        }
      });
      socket.once('error', reject);
      socket.once('close', () => resolve(Buffer.concat(chunks).toString()));
      socket.once('connect', () =>
        socket.write('CONNECT pbs.twimg.com:443 HTTP/1.1\r\nHost: pbs.twimg.com:443\r\n\r\n')
      );
    });
    assert.match(reply, /^HTTP\/1\.1 200 Connection Established\r\n\r\nnative-original-response$/u);
    assert.deepEqual(
      proxy.snapshot().events.map((event) => event.status),
      ['rejected', 'connected']
    );
    assert.equal(proxy.snapshot().pbsConnectedCount, 1);
  } finally {
    await proxy.close();
    await new Promise<void>((resolve, reject) =>
      target.close((error) => (error ? reject(error) : resolve()))
    );
  }
});

test('Firefox CONNECT proxy reports one bad gateway and closes refused owned upstream', async () => {
  const temporary = createServer();
  await new Promise<void>((resolve) => temporary.listen(0, '127.0.0.1', resolve));
  const address = temporary.address();
  assert(address && typeof address !== 'string');
  await new Promise<void>((resolve, reject) =>
    temporary.close((error) => (error ? reject(error) : resolve()))
  );
  const proxy = await startFirefoxNativeProxy(address.port);
  try {
    const reply = await new Promise<string>((resolve, reject) => {
      const socket = connect({ host: '127.0.0.1', port: proxy.port });
      const chunks: Buffer[] = [];
      socket.setTimeout(2_000, () => socket.destroy(new Error('Refused upstream timed out')));
      socket.on('data', (chunk: Buffer) => chunks.push(chunk));
      socket.once('error', reject);
      socket.once('close', () => resolve(Buffer.concat(chunks).toString()));
      socket.once('connect', () =>
        socket.write('CONNECT pbs.twimg.com:443 HTTP/1.1\r\nHost: pbs.twimg.com:443\r\n\r\n')
      );
    });
    assert.match(reply, /^HTTP\/1\.1 502 Bad Gateway/u);
    assert.equal(reply.match(/502 Bad Gateway/gu)?.length, 1);
    assert.equal(proxy.snapshot().activeTunnels, 0);
    assert.equal(proxy.snapshot().pbsConnectedCount, 0);
  } finally {
    await proxy.close();
  }
});
