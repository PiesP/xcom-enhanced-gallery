// SPDX-License-Identifier: MIT
// Copyright (c) 2026 PiesP

import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createServer } from 'node:https';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { TLSSocket } from 'node:tls';
import {
  NESTED_OWNER,
  QUOTED_CASES,
  RAPID_CLICK_B,
} from '../../test/e2e/fixtures/installed-quoted-video-api.ts';
import { generateFixtureCertificate } from './userscript-loopback.ts';
import { startHttpsLoopback } from './https-loopback-lifecycle.ts';

const MAX_REQUESTS = 128;
const MAX_BODY_BYTES = 256 * 1024;
const MAX_SERVED_BYTES = 16 * 1024 * 1024;
const IMAGE_PATHS = ['GkE1234ABCDEF', 'GkE5678GHIJKL.jpg', 'GkE9012MNOPQR.jpg'];

type NativeRoute = { bytes: Buffer; host: string; path: string; contentType?: string };
type NativeEvent = {
  host: string;
  path: string;
  method: string;
  purpose: string;
  status: number;
  range: { start: number; end: number } | null;
  bytes: number;
  sha256: string | null;
  result: string;
  atMs: number;
  closedAtMs?: number;
  finishedAtMs?: number;
  headersQueuedAtMs?: number;
  bodyQueuedAtMs?: number;
  prefixBytesQueued?: number;
  firstByteQueuedAtMs?: number | null;
  redirectTo?: string;
};
type VideoHold = {
  path: string;
  prefixEnd: number;
  remaining: number;
  responses: Map<ServerResponse, Buffer>;
};

function allowedVideos(payloads: Record<string, Buffer>) {
  const videos = new Map<string, Buffer>();
  const add = (id: string, name: string, payloadName = name) => {
    const bytes = payloads[payloadName];
    assert(Buffer.isBuffer(bytes) && bytes.length > 0 && bytes.length <= MAX_BODY_BYTES);
    const path = `/ext_tw_video/${id}/pu/vid/320x180/${name}.mp4`;
    if (videos.has(path)) {
      assert(videos.get(path)?.equals(bytes));
    }
    videos.set(path, bytes);
  };
  for (const item of QUOTED_CASES) {
    add(item.owner, item.media);
    if (['unmarked', 'nested-from-outer'].includes(item.name)) {
      add(item.outer, `outer-${item.name}`, 'nested-c');
    }
  }
  add(NESTED_OWNER, 'nested-c');
  add(RAPID_CLICK_B, 'quote-two');
  return videos;
}

/** Only synthetic fixture paths are served. The handler also works under HTTP unit tests. */
export function createExtensionNativeFixtureHandler() {
  const allowed = new Map<string, NativeRoute>();
  let requestCount = 0;
  let unexpectedCount = 0;
  let servedBytes = 0;
  let reservedBytes = 0;
  let overflow = false;
  const events: NativeEvent[] = [];
  const active = new Set<ServerResponse>();
  let holdPath: string | null = null;
  let heldResponse: ServerResponse | null = null;
  let heldTail: Buffer | null = null;
  let videoHold: VideoHold | null = null;
  let redirectOnce: { source: string; destination: string } | null = null;
  let httpFailure: { key: string; status: 403 | 404 } | null = null;
  const reject = (response: ServerResponse, status = 404) => {
    unexpectedCount += 1;
    response.writeHead(status, { 'Content-Length': '0', 'Cache-Control': 'no-store' });
    response.end();
  };
  const handle = (request: IncomingMessage, response: ServerResponse) => {
    requestCount += 1;
    if (requestCount > MAX_REQUESTS || events.length >= MAX_REQUESTS) {
      overflow = true;
      response.destroy();
      return;
    }
    const host = request.headers.host;
    const sni = request.socket instanceof TLSSocket ? request.socket.servername : undefined;
    const route = allowed.get(`${host?.replace(/:443$/u, '')}${request.url ?? ''}`);
    if (!['GET', 'HEAD'].includes(request.method ?? '') || !route || (sni && sni !== route.host)) {
      reject(response);
      return;
    }
    if (httpFailure?.key === `${route.host}${request.url ?? ''}`) {
      const event: NativeEvent = {
        host: route.host,
        path: route.path,
        method: request.method ?? '',
        purpose: 'transfer',
        status: httpFailure.status,
        range: null,
        bytes: 0,
        sha256: null,
        result: 'started',
        atMs: performance.now(),
      };
      events.push(event);
      active.add(response);
      response.once('close', () => {
        if (!response.writableFinished) {
          event.result = 'aborted';
          event.closedAtMs = performance.now();
        }
        active.delete(response);
      });
      response.once('finish', () => {
        event.result = 'http-failure';
        event.finishedAtMs = performance.now();
      });
      response.writeHead(httpFailure.status, {
        'Content-Length': '0',
        'Cache-Control': 'no-store',
        'Access-Control-Allow-Origin': 'https://x.com',
        'Access-Control-Allow-Credentials': 'true',
      });
      response.end();
      return;
    }
    if (request.method === 'GET' && redirectOnce?.source === `${route.host}${request.url ?? ''}`) {
      const destination = redirectOnce.destination;
      redirectOnce = null;
      const event: NativeEvent = {
        host: route.host,
        path: route.path,
        method: request.method ?? '',
        purpose: 'transfer',
        status: 302,
        range: null,
        bytes: 0,
        sha256: null,
        result: 'started',
        atMs: performance.now(),
        redirectTo: destination,
      };
      events.push(event);
      active.add(response);
      response.once('close', () => {
        if (!response.writableFinished) {
          event.result = 'aborted';
          event.closedAtMs = performance.now();
        }
        active.delete(response);
      });
      response.once('finish', () => {
        event.result = 'redirected';
        event.finishedAtMs = performance.now();
      });
      response.writeHead(302, {
        Location: destination,
        'Content-Length': '0',
        'Cache-Control': 'no-store',
      });
      response.end();
      return;
    }
    const { bytes } = route;
    let start = 0;
    let end = bytes.length - 1;
    const range = request.headers.range;
    if (range !== undefined) {
      const match = typeof range === 'string' ? /^bytes=(\d+)-(\d*)$/u.exec(range) : null;
      if (
        !match ||
        !Number.isSafeInteger(Number(match[1])) ||
        (match[2] && !Number.isSafeInteger(Number(match[2])))
      ) {
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
    const event: NativeEvent = {
      host: route.host,
      path: route.path,
      method: request.method ?? '',
      purpose:
        request.headers['sec-fetch-dest'] === 'document'
          ? 'document'
          : request.headers['sec-fetch-dest'] === 'image'
            ? 'image'
            : 'transfer',
      status,
      range: range === undefined ? null : { start, end },
      bytes: 0,
      sha256: null,
      result: 'started',
      atMs: performance.now(),
    };
    events.push(event);
    active.add(response);
    response.once('close', () => {
      if (!response.writableFinished) {
        event.result = 'aborted';
        event.closedAtMs = performance.now();
      }
      active.delete(response);
      videoHold?.responses.delete(response);
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
      'Content-Type':
        route.contentType ?? (route.host === 'video.twimg.com' ? 'video/mp4' : 'image/jpeg'),
      'Content-Length': String(request.method === 'HEAD' ? end - start + 1 : body.length),
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'no-store',
      'Access-Control-Allow-Origin': 'https://x.com',
      'Access-Control-Allow-Credentials': 'true',
      ...(range === undefined ? {} : { 'Content-Range': `bytes ${start}-${end}/${bytes.length}` }),
    });
    event.headersQueuedAtMs = performance.now();
    if (
      request.method === 'GET' &&
      videoHold?.path === `${route.host}${route.path}` &&
      videoHold.remaining > 0
    ) {
      const prefixBytes = Math.max(0, Math.min(body.length, videoHold.prefixEnd - start));
      assert(
        prefixBytes < body.length || end < videoHold.prefixEnd,
        'A held video range must not expose its delayed samples'
      );
      if (prefixBytes === body.length) {
        response.end(body);
        event.bodyQueuedAtMs = performance.now();
        return;
      }
      videoHold.responses.set(response, body.subarray(prefixBytes));
      videoHold.remaining--;
      if (prefixBytes > 0) {
        response.write(body.subarray(0, prefixBytes));
      }
      event.prefixBytesQueued = prefixBytes;
      event.firstByteQueuedAtMs = prefixBytes > 0 ? performance.now() : null;
      event.result = 'video-held';
      return;
    }
    if (
      request.method === 'GET' &&
      range === undefined &&
      holdPath === `${route.host}${route.path}`
    ) {
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
    setPayloads(images: Buffer[], videoPayloads: Record<string, Buffer>) {
      assert.equal(allowed.size, 0, 'Native fixture payloads already installed');
      assert(Array.isArray(images) && images.length === IMAGE_PATHS.length);
      for (const [index, path] of IMAGE_PATHS.entries()) {
        const bytes = images[index];
        assert(Buffer.isBuffer(bytes) && bytes.length > 0 && bytes.length <= MAX_BODY_BYTES);
        allowed.set(`pbs.twimg.com/media/${path}?format=jpg&name=orig`, {
          bytes,
          host: 'pbs.twimg.com',
          path: `/media/${path}`,
        });
      }
      for (const [path, bytes] of allowedVideos(videoPayloads)) {
        allowed.set(`video.twimg.com${path}`, { bytes, host: 'video.twimg.com', path });
      }
    },
    setCompactImage(bytes: Buffer) {
      assert(allowed.size > 0, 'Install native fixture payloads first');
      assert(Buffer.isBuffer(bytes) && bytes.length > 0 && bytes.length <= MAX_BODY_BYTES);
      const key = 'pbs.twimg.com/media/CompactQuoteSelected?format=webp&name=orig';
      assert(!allowed.has(key), 'Compact original already installed');
      allowed.set(key, {
        bytes,
        host: 'pbs.twimg.com',
        path: '/media/CompactQuoteSelected',
        contentType: 'image/webp',
      });
    },
    setRecoveryPayloads({
      tweetId,
      validMp4,
      badMp4,
    }: {
      tweetId: string;
      validMp4: Buffer;
      badMp4: Buffer;
    }) {
      assert(allowed.size > 0, 'Install native fixture payloads first');
      assert(typeof tweetId === 'string' && /^[1-9][0-9]{0,19}$/u.test(tweetId));
      for (const bytes of [validMp4, badMp4]) {
        assert(Buffer.isBuffer(bytes) && bytes.length > 0 && bytes.length <= MAX_BODY_BYTES);
      }
      const prefix = `/ext_tw_video/${tweetId}/pu/vid/320x180/`;
      const routes: Array<[string, Buffer]> = Array.from({ length: 8 }, (_, index) => [
        `${prefix}video-${index}-best.mp4`,
        index === 0 ? badMp4 : validMp4,
      ]);
      routes.push([`${prefix}video-0-lower.mp4`, validMp4]);
      for (const [path] of routes) {
        assert(!allowed.has(`video.twimg.com${path}`), 'Recovery payloads already installed');
      }
      for (const [path, bytes] of routes) {
        allowed.set(`video.twimg.com${path}`, { bytes, host: 'video.twimg.com', path });
      }
    },
    setRecoveryDocument({ tweetId, html }: { tweetId: string; html: string }) {
      assert(typeof tweetId === 'string' && /^[1-9][0-9]{0,19}$/u.test(tweetId));
      assert(typeof html === 'string');
      const bytes = Buffer.from(html);
      assert(bytes.length > 0 && bytes.length <= MAX_BODY_BYTES);
      const path = `/intentrecovery/status/${tweetId}`;
      assert(!allowed.has(`x.com${path}`), 'Recovery document already installed');
      allowed.set(`x.com${path}`, {
        bytes,
        host: 'x.com',
        path,
        contentType: 'text/html; charset=utf-8',
      });
    },
    armVideoHold(path: string, prefixEnd: number) {
      assert.equal(videoHold, null, 'Only one bounded video source may be held');
      const route = allowed.get(`video.twimg.com${path}`);
      assert(route && route.host === 'video.twimg.com', 'Only a declared video may be held');
      assert(
        Number.isSafeInteger(prefixEnd) && prefixEnd > 0 && prefixEnd < route.bytes.length,
        'The video prefix must leave declared samples outstanding'
      );
      videoHold = {
        path: `video.twimg.com${path}`,
        prefixEnd,
        remaining: Number.POSITIVE_INFINITY,
        responses: new Map<ServerResponse, Buffer>(),
      };
    },
    armFirstVideoHold(path: string, prefixEnd: number) {
      assert.equal(videoHold, null, 'Only one bounded video source may be held');
      const route = allowed.get(`video.twimg.com${path}`);
      assert(route && route.host === 'video.twimg.com', 'Only a declared video may be held');
      assert(
        Number.isSafeInteger(prefixEnd) && prefixEnd > 0 && prefixEnd < route.bytes.length,
        'The first video hold must leave declared samples outstanding'
      );
      videoHold = {
        path: `video.twimg.com${path}`,
        prefixEnd,
        remaining: 1,
        responses: new Map<ServerResponse, Buffer>(),
      };
    },
    videoHeld: () => videoHold !== null && videoHold.responses.size > 0,
    completeVideoHold() {
      assert(videoHold && videoHold.responses.size > 0, 'A live held video response is required');
      const pending = videoHold;
      videoHold = null;
      for (const [response, tail] of pending.responses) {
        if (!response.destroyed) {
          response.end(tail);
        }
      }
      pending.responses.clear();
    },
    abortVideoHold() {
      if (!videoHold) {
        return;
      }
      const pending = videoHold;
      videoHold = null;
      for (const response of pending.responses.keys()) {
        response.destroy();
      }
      pending.responses.clear();
    },
    mark: () => events.length,
    armHttpFailure(source: string, status: 403 | 404) {
      assert.equal(httpFailure, null, 'Only one original-availability fault may be armed');
      const url = new URL(source);
      const key = `${url.hostname}${url.pathname}${url.search}`;
      assert.equal(url.protocol, 'https:');
      assert.equal(url.host, url.hostname);
      assert.equal(url.username + url.password + url.hash, '');
      assert(allowed.has(key), 'Only an existing synthetic original may fail');
      assert([403, 404].includes(status));
      httpFailure = { key, status };
    },
    clearHttpFailure() {
      httpFailure = null;
    },
    armRedirect(source: string, destination: string) {
      assert.equal(redirectOnce, null, 'Only one native redirect may be armed');
      const from = new URL(source);
      const to = new URL(destination);
      assert.equal(from.protocol, 'https:');
      assert.equal(to.protocol, 'https:');
      assert(allowed.has(`${from.hostname}${from.pathname}${from.search}`));
      assert(allowed.has(`${to.hostname}${to.pathname}${to.search}`));
      redirectOnce = { source: `${from.hostname}${from.pathname}${from.search}`, destination };
    },
    clearRedirect() {
      redirectOnce = null;
    },
    armHold(host: string, path: string) {
      assert.equal(holdPath, null);
      assert.equal(heldResponse, null);
      assert(allowed.has(`${host}${path}?format=jpg&name=orig`));
      holdPath = `${host}${path}`;
    },
    held: () => heldResponse !== null && !heldResponse.destroyed,
    completeHold() {
      assert(
        heldResponse && !heldResponse.destroyed && heldTail !== null,
        'A live held response is required'
      );
      heldResponse.end(heldTail);
      heldResponse = null;
      heldTail = null;
    },
    releaseHold() {
      holdPath = null;
      if (heldResponse && !heldResponse.destroyed) {
        heldResponse.destroy();
      }
      heldResponse = null;
      heldTail = null;
    },
    since(mark: number) {
      assert(Number.isSafeInteger(mark) && mark >= 0 && mark <= events.length);
      return events.slice(mark).map((event) => ({ ...event }));
    },
    snapshot: () => ({
      requests: requestCount,
      unexpectedCount,
      servedBytes,
      reservedBytes,
      overflow,
      activeCount: active.size,
      events: events.map((event) => ({ ...event })),
    }),
    activeCount: () => active.size,
    destroyActive() {
      for (const response of active) {
        response.destroy();
      }
    },
  };
}

export async function startExtensionNativeFixtureLoopback(helperPath: string) {
  const certificate = await generateFixtureCertificate(helperPath, undefined, true, true);
  const fixture = createExtensionNativeFixtureHandler();
  const server = createServer(
    { key: certificate.keyPem, cert: certificate.certPem, maxHeaderSize: 4_096 },
    fixture.handle
  );
  const lifecycle = await startHttpsLoopback(server, 'extension-native-loopback-unavailable');
  return {
    ...fixture,
    port: lifecycle.port,
    spkiSha256: certificate.spkiSha256,
    snapshot: () => ({ ...fixture.snapshot(), serverError: lifecycle.serverError() }),
    close: () => lifecycle.close(fixture.destroyActive),
  };
}
