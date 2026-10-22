// SPDX-License-Identifier: MIT
// Copyright (c) 2026 PiesP

import assert from 'node:assert/strict';
import { createServer, request } from 'node:http';
import { test } from 'node:test';
import { createExtensionNativeFixtureHandler } from './extension-native-loopback.ts';

test('original availability faults retain the allowlist and restore the exact healthy bytes', async () => {
  const fixture = createExtensionNativeFixtureHandler();
  const original = Buffer.from('bounded-original');
  fixture.setPayloads(
    [original, original, original],
    Object.fromEntries(
      ['quote-one', 'quote-two', 'linked-four', 'quote-three', 'nested-c'].map((name) => [
        name,
        Buffer.from('bounded-video'),
      ])
    )
  );
  const url = 'https://pbs.twimg.com/media/GkE1234ABCDEF?format=jpg&name=orig';
  const server = createServer(fixture.handle);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  assert(address && typeof address !== 'string');
  const port = address.port;
  const read = (path = new URL(url).pathname + new URL(url).search) =>
    new Promise<{ status: number | undefined; bytes: Buffer }>((resolve, reject) => {
      const outgoing = request(
        { hostname: '127.0.0.1', port, path, headers: { Host: 'pbs.twimg.com' } },
        (incoming) => {
          const parts: Buffer[] = [];
          incoming.on('data', (part: Buffer) => parts.push(part));
          incoming.once('error', reject);
          incoming.once('end', () =>
            resolve({ status: incoming.statusCode, bytes: Buffer.concat(parts) })
          );
        }
      );
      outgoing.once('error', reject);
      outgoing.end();
    });
  try {
    assert.deepEqual(await read(), { status: 200, bytes: original });
    for (const status of [403, 404] as const) {
      fixture.armHttpFailure(url, status);
      assert.deepEqual(await read(), { status, bytes: Buffer.alloc(0) });
      assert.throws(() => fixture.armHttpFailure(url, status), /Only one/u);
      fixture.clearHttpFailure();
      assert.deepEqual(await read(), { status: 200, bytes: original });
    }
    for (const invalid of [
      url.replace('https:', 'http:'),
      url.replace('pbs.twimg.com', 'pbs.twimg.com:444'),
      url.replace('pbs.twimg.com', 'user@pbs.twimg.com'),
      `${url}#fragment`,
      url.replace('name=orig', 'name=small'),
      url.replace('GkE1234ABCDEF', 'Undeclared'),
    ]) {
      assert.throws(() => fixture.armHttpFailure(invalid, 403));
    }
    assert.deepEqual(await read('/media/Undeclared?format=jpg&name=orig'), {
      status: 404,
      bytes: Buffer.alloc(0),
    });
    const snapshot = fixture.snapshot();
    assert(snapshot.events.every((event) => typeof event.finishedAtMs === 'number'));
    assert(
      snapshot.events
        .filter(({ status }) => status === 403 || status === 404)
        .every(({ result }) => result === 'http-failure')
    );
    assert.equal(snapshot.unexpectedCount, 1);
    assert.equal(snapshot.overflow, false);
    assert.equal(snapshot.activeCount, 0);
    assert.deepEqual(
      snapshot.events.map(({ status }) => status),
      [200, 403, 200, 404, 200]
    );
  } finally {
    fixture.clearHttpFailure();
    fixture.destroyActive();
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve()))
    );
  }
});
