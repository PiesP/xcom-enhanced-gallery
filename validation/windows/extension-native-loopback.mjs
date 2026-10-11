// SPDX-License-Identifier: MIT
// Copyright (c) 2026 PiesP

import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createServer } from 'node:https';
import { generateFixtureCertificate } from './userscript-loopback.mjs';
import { NESTED_OWNER, QUOTED_CASES } from '../../test/e2e/fixtures/installed-quoted-video-api.mjs';

const MAX_REQUESTS = 128;
const MAX_BODY_BYTES = 256 * 1024;
const MAX_SERVED_BYTES = 16 * 1024 * 1024;
const IMAGE_PATHS = ['GkE1234ABCDEF', 'GkE5678GHIJKL.jpg', 'GkE9012MNOPQR.jpg'];

function allowedVideos(payloads) {
  const videos = new Map();
  const add = (id, name, payloadName = name) => {
    const bytes = payloads[payloadName];
    assert(Buffer.isBuffer(bytes) && bytes.length > 0 && bytes.length <= MAX_BODY_BYTES);
    const path = `/ext_tw_video/${id}/pu/vid/320x180/${name}.mp4`;
    if (videos.has(path)) assert(videos.get(path).equals(bytes));
    videos.set(path, bytes);
  };
  for (const item of QUOTED_CASES) {
    add(item.owner, item.media);
    if (['unmarked', 'nested-from-outer'].includes(item.name)) {
      add(item.outer, `outer-${item.name}`, 'nested-c');
    }
  }
  add(NESTED_OWNER, 'nested-c');
  return videos;
}

/** Only synthetic fixture paths are served. The handler also works under HTTP unit tests. */
export function createExtensionNativeFixtureHandler() {
  const allowed = new Map();
  let requestCount = 0;
  let unexpectedCount = 0;
  let servedBytes = 0;
  let reservedBytes = 0;
  let overflow = false;
  const events = [];
  const active = new Set();
  let holdPath = null;
  let heldResponse = null;
  let heldTail = null;
  const reject = (response, status = 404) => {
    unexpectedCount += 1;
    response.writeHead(status, { 'Content-Length': '0', 'Cache-Control': 'no-store' });
    response.end();
  };
  const handle = (request, response) => {
    requestCount += 1;
    if (requestCount > MAX_REQUESTS || events.length >= MAX_REQUESTS) {
      overflow = true;
      response.destroy();
      return;
    }
    const host = request.headers.host;
    const sni = request.socket.servername;
    const route = allowed.get(`${host?.replace(/:443$/u, '')}${request.url}`);
    if (!['GET', 'HEAD'].includes(request.method) || !route ||
      (sni && sni !== route.host)) {
      reject(response);
      return;
    }
    const { bytes } = route;
    let start = 0;
    let end = bytes.length - 1;
    const range = request.headers.range;
    if (range !== undefined) {
      const match = typeof range === 'string'
        ? /^bytes=(\d+)-(\d*)$/u.exec(range) : null;
      if (!match || !Number.isSafeInteger(Number(match[1])) ||
          (match[2] && !Number.isSafeInteger(Number(match[2])))) {
        reject(response, 416);
        return;
      }
      start = Number(match[1]);
      end = match[2] ? Number(match[2]) : end;
      if (start >= bytes.length || end < start) {
        reject(response, 416);
        return;
      }
      end = Math.min(end, bytes.length - 1);
    }
    const body = request.method === 'HEAD' ? Buffer.alloc(0) : bytes.subarray(start, end + 1);
    if (reservedBytes + body.length > MAX_SERVED_BYTES) {
      overflow = true;
      response.destroy();
      return;
    }
    reservedBytes += body.length;
    const status = range === undefined ? 200 : 206;
    const event = { host: route.host, path: route.path, method: request.method,
      purpose: request.headers['sec-fetch-dest'] === 'image' ? 'image' : 'transfer',
      status, range: range === undefined ? null : { start, end },
      bytes: 0, sha256: null, result: 'started', atMs: performance.now() };
    events.push(event);
    active.add(response);
    response.once('close', () => {
      if (!response.writableFinished) {
        event.result = 'aborted';
        event.closedAtMs = performance.now();
      }
      active.delete(response);
      if (response === heldResponse) {
        heldResponse = null;
        heldTail = null;
      }
    });
    response.once('finish', () => {
      event.result = 'served';
      event.bytes = body.length;
      servedBytes += body.length;
      event.sha256 = createHash('sha256').update(body).digest('hex');
      event.finishedAtMs = performance.now();
    });
    response.writeHead(status, {
      'Content-Type': route.host === 'video.twimg.com' ? 'video/mp4' : 'image/jpeg',
      'Content-Length': String(request.method === 'HEAD' ? end - start + 1 : body.length),
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'no-store',
      'Access-Control-Allow-Origin': 'https://x.com',
      'Access-Control-Allow-Credentials': 'true',
      ...(range === undefined ? {} : { 'Content-Range': `bytes ${start}-${end}/${bytes.length}` }),
    });
    event.headersQueuedAtMs = performance.now();
    if (request.method === 'GET' && range === undefined &&
        holdPath === `${route.host}${route.path}`) {
      assert.equal(heldResponse, null, 'Only one native fixture response may be held');
      holdPath = null;
      heldResponse = response;
      assert(body.length > 1, 'The held fixture must retain an unfinished response');
      const prefixBytes = Math.min(1_024, body.length - 1);
      heldTail = body.subarray(prefixBytes);
      response.write(body.subarray(0, prefixBytes));
      event.prefixBytesQueued = prefixBytes;
      event.firstByteQueuedAtMs = performance.now();
      event.result = 'held';
      return;
    }
    response.end(body);
    event.bodyQueuedAtMs = performance.now();
  };
  return {
    handle,
    setPayloads(images, videoPayloads) {
      assert.equal(allowed.size, 0, 'Native fixture payloads already installed');
      assert(Array.isArray(images) && images.length === IMAGE_PATHS.length);
      for (const [index, path] of IMAGE_PATHS.entries()) {
        const bytes = images[index];
        assert(Buffer.isBuffer(bytes) && bytes.length > 0 && bytes.length <= MAX_BODY_BYTES);
        allowed.set(`pbs.twimg.com/media/${path}?format=jpg&name=orig`,
          { bytes, host: 'pbs.twimg.com', path: `/media/${path}` });
      }
      for (const [path, bytes] of allowedVideos(videoPayloads)) {
        allowed.set(`video.twimg.com${path}`, { bytes, host: 'video.twimg.com', path });
      }
    },
    setRecoveryPayloads({ tweetId, validMp4, badMp4 }) {
      assert(allowed.size > 0, 'Install native fixture payloads first');
      assert(typeof tweetId === 'string' && /^[1-9][0-9]{0,19}$/u.test(tweetId));
      for (const bytes of [validMp4, badMp4]) {
        assert(Buffer.isBuffer(bytes) && bytes.length > 0 && bytes.length <= MAX_BODY_BYTES);
      }
      const prefix = `/ext_tw_video/${tweetId}/pu/vid/320x180/`;
      const routes = Array.from({ length: 8 }, (_, index) =>
        [`${prefix}video-${index}-best.mp4`, index === 0 ? badMp4 : validMp4]);
      routes.push([`${prefix}video-0-lower.mp4`, validMp4]);
      for (const [path] of routes) {
        assert(!allowed.has(`video.twimg.com${path}`), 'Recovery payloads already installed');
      }
      for (const [path, bytes] of routes) {
        allowed.set(`video.twimg.com${path}`, { bytes, host: 'video.twimg.com', path });
      }
    },
    mark: () => events.length,
    armHold(host, path) {
      assert.equal(holdPath, null);
      assert.equal(heldResponse, null);
      assert(allowed.has(`${host}${path}?format=jpg&name=orig`));
      holdPath = `${host}${path}`;
    },
    held: () => heldResponse !== null && !heldResponse.destroyed,
    completeHold() {
      assert(heldResponse && !heldResponse.destroyed && heldTail !== null,
        'A live held response is required');
      heldResponse.end(heldTail);
      heldResponse = null;
      heldTail = null;
    },
    releaseHold() {
      holdPath = null;
      if (heldResponse && !heldResponse.destroyed) heldResponse.destroy();
      heldResponse = null;
      heldTail = null;
    },
    since(mark) {
      assert(Number.isSafeInteger(mark) && mark >= 0 && mark <= events.length);
      return events.slice(mark).map((event) => ({ ...event }));
    },
    snapshot: () => ({ requests: requestCount, unexpectedCount, servedBytes,
      reservedBytes, overflow,
      activeCount: active.size, events: events.map((event) => ({ ...event })) }),
    activeCount: () => active.size,
    destroyActive() { for (const response of active) response.destroy(); },
  };
}

export async function startExtensionNativeFixtureLoopback(helperPath) {
  const certificate = await generateFixtureCertificate(helperPath, undefined, true);
  const fixture = createExtensionNativeFixtureHandler();
  const server = createServer({ key: certificate.keyPem, cert: certificate.certPem,
    maxHeaderSize: 4_096 }, fixture.handle);
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
    throw new Error('extension-native-loopback-unavailable');
  }
}
