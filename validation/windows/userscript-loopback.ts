// SPDX-License-Identifier: MIT
// Copyright (c) 2026 PiesP

import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { createHash, createPrivateKey, X509Certificate } from 'node:crypto';
import { createServer } from 'node:https';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const HOST = 'pbs.twimg.com';
const MAX_REQUESTS = 64;
const MAX_IMAGE_BYTES = 64 * 1024;
const MAX_SERVED_BYTES = 2 * 1024 * 1024;

type FixtureEvent = {
  phase: string;
  cohort: string;
  index: number;
  purpose: string;
  method: string;
  result: string;
  bytes: number;
  sha256: string | null;
};

type CertificateRunner = (
  file: string,
  args: readonly string[],
  options: { timeout: number; windowsHide: boolean; maxBuffer: number; encoding: 'utf8' }
) => Promise<{ stdout: string }>;

function isStringRecord(value: unknown): value is Record<string, string> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    Object.values(value).every((entry) => typeof entry === 'string')
  );
}

/** Validate the public certificate and private key without exposing child output on failure. */
export function validateFixtureCertificate(
  value: unknown,
  includeVideo = false,
  includeFixturePage = false
) {
  try {
    assert(!includeFixturePage || includeVideo, 'Fixture page certificate requires video scope');
    assert(typeof value === 'object' && value !== null && !Array.isArray(value));
    assert.deepEqual(Object.keys(value).sort(), ['certDerBase64', 'jwk']);
    assert('certDerBase64' in value && typeof value.certDerBase64 === 'string');
    assert('jwk' in value && isStringRecord(value.jwk));
    assert(
      typeof value.certDerBase64 === 'string' &&
        /^[A-Za-z0-9+/]+={0,2}$/u.test(value.certDerBase64) &&
        value.certDerBase64.length < 8_192
    );
    assert.deepEqual(Object.keys(value.jwk).sort(), [
      'd',
      'dp',
      'dq',
      'e',
      'kty',
      'n',
      'p',
      'q',
      'qi',
    ]);
    assert.equal(value.jwk.kty, 'RSA');
    for (const field of ['d', 'dp', 'dq', 'e', 'n', 'p', 'q', 'qi']) {
      assert(
        typeof value.jwk[field] === 'string' &&
          /^[A-Za-z0-9_-]+$/u.test(value.jwk[field]) &&
          value.jwk[field].length < 1_024
      );
    }
    const der = Buffer.from(value.certDerBase64, 'base64');
    assert.equal(der.toString('base64'), value.certDerBase64);
    const certificate = new X509Certificate(der);
    const privateKey = createPrivateKey({ key: value.jwk, format: 'jwk' });
    assert.equal(privateKey.asymmetricKeyType, 'rsa');
    assert.equal(privateKey.asymmetricKeyDetails?.modulusLength, 2048);
    assert.equal(certificate.subject, `CN=${HOST}`);
    assert.equal(certificate.issuer, certificate.subject);
    const names = [
      HOST,
      ...(includeVideo ? ['video.twimg.com'] : []),
      ...(includeFixturePage ? ['x.com'] : []),
    ];
    assert.equal(certificate.subjectAltName, names.map((name) => `DNS:${name}`).join(', '));
    assert.equal(certificate.checkHost(HOST, { subject: 'never' }), HOST);
    if (includeVideo) {
      assert.equal(
        certificate.checkHost('video.twimg.com', { subject: 'never' }),
        'video.twimg.com'
      );
    }
    if (includeFixturePage) {
      assert.equal(certificate.checkHost('x.com', { subject: 'never' }), 'x.com');
    }
    assert.equal(certificate.ca, false);
    assert(certificate.checkPrivateKey(privateKey));
    assert(certificate.verify(certificate.publicKey));
    const now = Date.now();
    const from = Date.parse(certificate.validFrom);
    const to = Date.parse(certificate.validTo);
    assert(
      Number.isFinite(from) &&
        Number.isFinite(to) &&
        from <= now &&
        to > now &&
        to - from <= 40 * 60_000
    );
    const spki = certificate.publicKey.export({ type: 'spki', format: 'der' });
    return {
      certPem: certificate.toString(),
      keyPem: privateKey.export({ type: 'pkcs8', format: 'pem' }),
      spkiSha256: createHash('sha256').update(spki).digest('base64'),
    };
  } catch {
    throw new Error('fixture-certificate-invalid');
  }
}

export async function generateFixtureCertificate(
  helperPath: string,
  run: CertificateRunner = execFileAsync,
  includeVideo = false,
  includeFixturePage = false
) {
  let stdout: string;
  try {
    ({ stdout } = await run(
      'powershell.exe',
      [
        '-NoProfile',
        '-NonInteractive',
        '-File',
        helperPath,
        ...(includeVideo ? ['-IncludeVideo'] : []),
        ...(includeFixturePage ? ['-IncludeFixturePage'] : []),
      ],
      { timeout: 12_000, windowsHide: true, maxBuffer: 16_384, encoding: 'utf8' }
    ));
  } catch {
    throw new Error('fixture-certificate-unavailable');
  }
  try {
    return validateFixtureCertificate(JSON.parse(stdout), includeVideo, includeFixturePage);
  } catch {
    throw new Error('fixture-certificate-invalid');
  }
}

/** The same handler can be protocol-tested with a local HTTP server; production uses HTTPS. */
export function createUserscriptFixtureHandler(
  cohorts: Record<string, string[]>,
  avatarPath: string
) {
  const allowed = new Map<string, { cohort: string; index: number; purpose?: string }>();
  for (const [cohort, markers] of Object.entries(cohorts)) {
    assert(
      ['normal', 'failure', 'partial', 'held'].includes(cohort) &&
        Array.isArray(markers) &&
        markers.length === 3
    );
    for (const [index, marker] of markers.entries()) {
      assert(/^[A-Za-z0-9]{13}$/u.test(marker));
      for (const [name, purpose] of [
        ['large', 'preview'],
        ['orig', 'transfer'],
      ] as const) {
        const path = `/media/${marker}.jpg?format=jpg&name=${name}`;
        assert(!allowed.has(path));
        allowed.set(path, { cohort, index, purpose });
      }
    }
  }
  assert.equal(allowed.size, 24);
  assert.equal(avatarPath, '/profile_images/123456789/public-avatar.jpg');
  allowed.set(avatarPath, { cohort: 'avatar', index: 0 });
  let images: Buffer[] | undefined;
  let phase = 'normal';
  let heldArmed = false;
  let requestCount = 0;
  let unexpectedCount = 0;
  let overflow = false;
  let servedBytes = 0;
  const events: FixtureEvent[] = [];
  const active = new Set<ServerResponse>();
  const reject = (response: ServerResponse) => {
    unexpectedCount += 1;
    response.writeHead(404, { 'Content-Length': '0', 'Cache-Control': 'no-store' });
    response.end();
  };
  const handle = (request: IncomingMessage, response: ServerResponse) => {
    requestCount += 1;
    if (requestCount > MAX_REQUESTS) {
      overflow = true;
      response.destroy();
      return;
    }
    const media = allowed.get(request.url ?? '');
    if (
      request.method !== 'GET' ||
      ![HOST, `${HOST}:443`].includes(request.headers.host ?? '') ||
      !media ||
      !images ||
      (media.cohort !== 'avatar' && media.cohort !== phase)
    ) {
      reject(response);
      return;
    }
    const bytes = images[media.index];
    if (!Buffer.isBuffer(bytes) || bytes.length === 0 || bytes.length > MAX_IMAGE_BYTES) {
      reject(response);
      return;
    }
    const purpose = request.headers['sec-fetch-dest'] === 'image' ? 'preview' : 'transfer';
    if (media.cohort !== 'avatar' && media.purpose !== purpose) {
      reject(response);
      return;
    }
    const event: FixtureEvent = {
      phase,
      cohort: media.cohort,
      index: media.index,
      purpose,
      method: 'GET',
      result: 'started',
      bytes: 0,
      sha256: null,
    };
    events.push(event);
    active.add(response);
    response.once('close', () => {
      if (!response.writableFinished) {
        event.result = 'aborted';
      }
      active.delete(response);
    });
    if (
      heldArmed &&
      phase === 'held' &&
      media.cohort === 'held' &&
      media.index === 0 &&
      purpose === 'transfer'
    ) {
      return;
    }
    const unavailable =
      (phase === 'failure' && media.cohort === 'failure') ||
      (phase === 'partial' && media.cohort === 'partial' && media.index === 1);
    const body = unavailable ? Buffer.alloc(0) : bytes;
    if (servedBytes + body.length > MAX_SERVED_BYTES) {
      overflow = true;
      response.destroy();
      return;
    }
    servedBytes += body.length;
    response.once('finish', () => {
      event.result = unavailable ? 'http-503' : 'served';
      event.bytes = body.length;
      event.sha256 = unavailable ? null : createHash('sha256').update(body).digest('hex');
    });
    response.writeHead(unavailable ? 503 : 200, {
      'Content-Type': unavailable ? 'text/plain' : 'image/jpeg',
      'Content-Length': String(body.length),
      'Cache-Control': 'no-store',
      'Access-Control-Allow-Origin': '*',
    });
    response.end(body);
  };
  return {
    handle,
    setImages(next: Buffer[]) {
      assert(
        !images &&
          Array.isArray(next) &&
          next.length === 3 &&
          next.every(
            (bytes) => Buffer.isBuffer(bytes) && bytes.length > 0 && bytes.length <= MAX_IMAGE_BYTES
          ),
        'Invalid bounded fixture images'
      );
      images = next;
    },
    setPhase(next: string) {
      assert(['normal', 'failure', 'partial', 'held'].includes(next));
      assert.equal(active.size, 0, 'Fixture has an active transport before phase change');
      phase = next;
      heldArmed = false;
    },
    armHeld() {
      assert.equal(phase, 'held');
      assert.equal(active.size, 0, 'Cannot arm a held response with active transport');
      heldArmed = true;
    },
    mark: () => events.length,
    findSince(mark: number, cohort: string, index: number, result: string) {
      assert(Number.isSafeInteger(mark) && mark >= 0 && mark <= events.length);
      return events
        .slice(mark)
        .find(
          (event) =>
            event.cohort === cohort &&
            event.index === index &&
            event.purpose === 'transfer' &&
            event.result === result
        );
    },
    activeCount: () => active.size,
    snapshot: () => ({
      requests: requestCount,
      unexpectedCount,
      overflow,
      servedBytes,
      activeCount: active.size,
      events: events.map((event) => ({ ...event })),
    }),
    destroyActive() {
      for (const response of active) {
        response.destroy();
      }
    },
  };
}

export async function startUserscriptFixtureLoopback(
  helperPath: string,
  cohorts: Record<string, string[]>,
  avatarPath: string,
  run: CertificateRunner = execFileAsync
) {
  const certificate = await generateFixtureCertificate(helperPath, run);
  const fixture = createUserscriptFixtureHandler(cohorts, avatarPath);
  let server: ReturnType<typeof createServer>;
  try {
    server = createServer(
      { key: certificate.keyPem, cert: certificate.certPem, maxHeaderSize: 4_096 },
      fixture.handle
    );
  } catch {
    throw new Error('fixture-loopback-unavailable');
  }
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
      ...fixture,
      port: address.port,
      spkiSha256: certificate.spkiSha256,
      snapshot: () => ({ ...fixture.snapshot(), serverError }),
      async close() {
        fixture.destroyActive();
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
    throw new Error('fixture-loopback-unavailable');
  }
}
