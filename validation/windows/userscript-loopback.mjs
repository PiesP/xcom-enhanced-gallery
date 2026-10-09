// SPDX-License-Identifier: MIT
// Copyright (c) 2026 PiesP

import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { createHash, createPrivateKey, X509Certificate } from 'node:crypto';
import { createServer } from 'node:https';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const HOST = 'pbs.twimg.com';
const MAX_REQUESTS = 64;
const MAX_IMAGE_BYTES = 64 * 1024;
const MAX_SERVED_BYTES = 2 * 1024 * 1024;

/** Validate the public certificate and private key without exposing child output on failure. */
export function validateFixtureCertificate(value) {
  try {
    assert.deepEqual(Object.keys(value).sort(), ['certDerBase64', 'jwk']);
    assert(typeof value.certDerBase64 === 'string' &&
      /^[A-Za-z0-9+/]+={0,2}$/u.test(value.certDerBase64) &&
      value.certDerBase64.length < 8_192);
    assert.deepEqual(Object.keys(value.jwk).sort(),
      ['d', 'dp', 'dq', 'e', 'kty', 'n', 'p', 'q', 'qi']);
    assert.equal(value.jwk.kty, 'RSA');
    for (const field of ['d', 'dp', 'dq', 'e', 'n', 'p', 'q', 'qi']) {
      assert(typeof value.jwk[field] === 'string' &&
        /^[A-Za-z0-9_-]+$/u.test(value.jwk[field]) && value.jwk[field].length < 1_024);
    }
    const der = Buffer.from(value.certDerBase64, 'base64');
    assert.equal(der.toString('base64'), value.certDerBase64);
    const certificate = new X509Certificate(der);
    const privateKey = createPrivateKey({ key: value.jwk, format: 'jwk' });
    assert.equal(privateKey.asymmetricKeyType, 'rsa');
    assert.equal(privateKey.asymmetricKeyDetails?.modulusLength, 2048);
    assert.equal(certificate.subject, `CN=${HOST}`);
    assert.equal(certificate.issuer, certificate.subject);
    assert.equal(certificate.subjectAltName, `DNS:${HOST}`);
    assert.equal(certificate.checkHost(HOST, { subject: 'never' }), HOST);
    assert.equal(certificate.ca, false);
    assert(certificate.checkPrivateKey(privateKey));
    assert(certificate.verify(certificate.publicKey));
    const now = Date.now();
    const from = Date.parse(certificate.validFrom);
    const to = Date.parse(certificate.validTo);
    assert(Number.isFinite(from) && Number.isFinite(to) &&
      from <= now && to > now && to - from <= 40 * 60_000);
    const spki = certificate.publicKey.export({ type: 'spki', format: 'der' });
    return { certPem: certificate.toString(),
      keyPem: privateKey.export({ type: 'pkcs8', format: 'pem' }),
      spkiSha256: createHash('sha256').update(spki).digest('base64') };
  } catch {
    throw new Error('fixture-certificate-invalid');
  }
}

export async function generateFixtureCertificate(helperPath, run = execFileAsync) {
  let stdout;
  try {
    ({ stdout } = await run('powershell.exe',
      ['-NoProfile', '-NonInteractive', '-File', helperPath],
      { timeout: 12_000, windowsHide: true, maxBuffer: 16_384, encoding: 'utf8' }));
  } catch {
    throw new Error('fixture-certificate-unavailable');
  }
  try {
    return validateFixtureCertificate(JSON.parse(stdout));
  } catch {
    throw new Error('fixture-certificate-invalid');
  }
}

/** The same handler can be protocol-tested with a local HTTP server; production uses HTTPS. */
export function createUserscriptFixtureHandler(cohorts, avatarPath) {
  const allowed = new Map();
  for (const [cohort, markers] of Object.entries(cohorts)) {
    assert(['normal', 'failure', 'partial', 'held'].includes(cohort) &&
      Array.isArray(markers) && markers.length === 3);
    for (const [index, marker] of markers.entries()) {
      assert(/^[A-Za-z0-9]{13}$/u.test(marker));
      const path = `/media/${marker}.jpg?format=jpg&name=large`;
      assert(!allowed.has(path));
      allowed.set(path, { cohort, index });
    }
  }
  assert.equal(allowed.size, 12);
  assert.equal(avatarPath, '/profile_images/123456789/public-avatar.jpg');
  allowed.set(avatarPath, { cohort: 'avatar', index: 0 });
  let images;
  let phase = 'normal';
  let heldArmed = false;
  let requestCount = 0;
  let unexpectedCount = 0;
  let overflow = false;
  let servedBytes = 0;
  const events = [];
  const active = new Set();
  const reject = (response) => {
    unexpectedCount += 1;
    response.writeHead(404, { 'Content-Length': '0', 'Cache-Control': 'no-store' });
    response.end();
  };
  const handle = (request, response) => {
    requestCount += 1;
    if (requestCount > MAX_REQUESTS) {
      overflow = true;
      response.destroy();
      return;
    }
    const media = allowed.get(request.url);
    if (request.method !== 'GET' ||
        ![HOST, `${HOST}:443`].includes(request.headers.host) ||
        !media || !images ||
        (media.cohort !== 'avatar' && media.cohort !== phase)) {
      reject(response);
      return;
    }
    const bytes = images[media.index];
    if (!Buffer.isBuffer(bytes) || bytes.length === 0 || bytes.length > MAX_IMAGE_BYTES) {
      reject(response);
      return;
    }
    const purpose = request.headers['sec-fetch-dest'] === 'image' ? 'preview' : 'transfer';
    const event = { phase, cohort: media.cohort, index: media.index,
      purpose, method: 'GET', result: 'started', bytes: 0, sha256: null };
    events.push(event);
    active.add(response);
    response.once('close', () => {
      if (!response.writableFinished) event.result = 'aborted';
      active.delete(response);
    });
    if (heldArmed && phase === 'held' && media.cohort === 'held' && media.index === 0 &&
        purpose === 'transfer') return;
    const unavailable = (phase === 'failure' && media.cohort === 'failure') ||
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
    setImages(next) {
      assert(!images && Array.isArray(next) && next.length === 3 &&
        next.every((bytes) => Buffer.isBuffer(bytes) && bytes.length > 0 &&
          bytes.length <= MAX_IMAGE_BYTES), 'Invalid bounded fixture images');
      images = next;
    },
    setPhase(next) {
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
    findSince(mark, cohort, index, result) {
      assert(Number.isSafeInteger(mark) && mark >= 0 && mark <= events.length);
      return events.slice(mark).find((event) => event.cohort === cohort &&
        event.index === index && event.purpose === 'transfer' && event.result === result);
    },
    activeCount: () => active.size,
    snapshot: () => ({ requests: requestCount, unexpectedCount, overflow, servedBytes,
      activeCount: active.size, events: events.map((event) => ({ ...event })) }),
    destroyActive() { for (const response of active) response.destroy(); },
  };
}

export async function startUserscriptFixtureLoopback(helperPath, cohorts, avatarPath,
  run = execFileAsync) {
  const certificate = await generateFixtureCertificate(helperPath, run);
  const fixture = createUserscriptFixtureHandler(cohorts, avatarPath);
  let server;
  try {
    server = createServer({ key: certificate.keyPem, cert: certificate.certPem,
      maxHeaderSize: 4_096 }, fixture.handle);
  } catch {
    throw new Error('fixture-loopback-unavailable');
  }
  server.maxConnections = 8;
  server.headersTimeout = 5_000;
  server.requestTimeout = 5_000;
  server.keepAliveTimeout = 1_000;
  server.timeout = 20_000;
  let serverError = false;
  server.on('error', () => { serverError = true; });
  server.on('connection', (socket) => socket.setTimeout(20_000, () => socket.destroy()));
  try {
    await new Promise((resolveListen, rejectListen) => {
      server.once('error', rejectListen);
      server.listen(0, '127.0.0.1', () => {
        server.off('error', rejectListen);
        resolveListen();
      });
    });
    const address = server.address();
    assert(address && typeof address !== 'string' && address.address === '127.0.0.1' &&
      Number.isSafeInteger(address.port) && address.port > 0);
    return { ...fixture, port: address.port, spkiSha256: certificate.spkiSha256,
      snapshot: () => ({ ...fixture.snapshot(), serverError }),
      async close() {
        fixture.destroyActive();
        server.closeAllConnections();
        await new Promise((resolveClose, rejectClose) =>
          server.close((error) => error ? rejectClose(error) : resolveClose()));
      } };
  } catch {
    server.closeAllConnections();
    try { server.close(); } catch { /* The listener never started. */ }
    throw new Error('fixture-loopback-unavailable');
  }
}
