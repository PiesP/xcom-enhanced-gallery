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
} from './fixtures/installed-quoted-video-api.ts';
import { generateFixtureCertificate } from './userscript-loopback.ts';
import { startHttpsLoopback } from './https-loopback-lifecycle.ts';

const MAX_REQUESTS = 128;
const MAX_BODY_BYTES = 256 * 1024;
const MAX_SERVED_BYTES = 16 * 1024 * 1024;
const CRC_CLIPS = [
  {
    bytes: 2_857_140,
    sha256: '352daf37b350f50a069c3911b32248c5adb7684ade30b525f6c25685c3b80f5e',
    width: 640,
    height: 360,
  },
  {
    bytes: 98_399,
    sha256: '36dd064afeefde15ecceea49109fffee6b17cdf0962de6eb21e0255fdd0cb8f8',
    width: 320,
    height: 180,
  },
  {
    bytes: 5_184,
    sha256: 'de4c15ff513d41c964eadb5d45ce08030b2a94eea501e9f86edfd8a301e1411e',
    width: 160,
    height: 90,
  },
  {
    bytes: 31_813,
    sha256: 'c93c7e6c6102e36089ee5aa79d9fa9758be8b7f62ac1043247ebb22399770004',
    width: 320,
    height: 180,
  },
] as const;
const CRC_TWEET_IDS = ['1234567890123456789', '4666000000000000534'] as const;
const CRC_GRAPHQL_PATH = '/i/api/graphql/zAz9764BcLZOJ0JU2wrd1A/TweetResultByRestId';
const IMAGE_PATHS = ['GkE1234ABCDEF', 'GkE5678GHIJKL.jpg', 'GkE9012MNOPQR.jpg'];

type NativeRoute = {
  bytes: Buffer;
  host: string;
  path: string;
  contentType?: string;
  cacheControl?: string;
};
type NativeEvent = {
  host: string;
  path: string;
  requestTarget?: string;
  method: string;
  purpose: string;
  status: number;
  range: { start: number; end: number } | null;
  bytes: number;
  sha256: string | null;
  result: string;
  cacheControl?: string;
  requestCacheControl?: string | null;
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
  afterRequestPath?: string;
  afterRequestSeen: boolean;
  pendingPrefixes: Map<ServerResponse, { bytes: Buffer; event: NativeEvent }>;
  pendingAdjacent: Map<ServerResponse, Buffer>;
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
  const crcApi = new Map<string, NativeRoute>();
  let holdPath: string | null = null;
  let heldResponse: ServerResponse | null = null;
  let heldTail: Buffer | null = null;
  let videoHold: VideoHold | null = null;
  let redirectOnce: { source: string; destination: string } | null = null;
  let httpFailure: { key: string; status: 403 | 404 } | null = null;
  const queueVideoPrefix = (
    response: ServerResponse,
    prefix: { bytes: Buffer; event: NativeEvent }
  ): void => {
    if (prefix.bytes.length > 0) {
      response.write(prefix.bytes);
    }
    prefix.event.prefixBytesQueued = prefix.bytes.length;
    prefix.event.firstByteQueuedAtMs = prefix.bytes.length > 0 ? performance.now() : null;
  };
  const reject = (request: IncomingMessage, response: ServerResponse, status = 404) => {
    unexpectedCount += 1;
    const target = (request.url ?? '').slice(0, 300);
    const event: NativeEvent = {
      host: (request.headers.host ?? '').replace(/:443$/u, '').slice(0, 100),
      path: target.split('?')[0] ?? '',
      requestTarget: target,
      method: request.method ?? '',
      purpose: 'rejected',
      status,
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
      event.result = 'rejected';
      event.finishedAtMs = performance.now();
    });
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
    const normalizedHost = host?.replace(/:443$/u, '');
    if (
      allowed.size > 0 &&
      normalizedHost === 'x.com' &&
      request.url === '/favicon.ico' &&
      ['GET', 'HEAD'].includes(request.method ?? '') &&
      (!sni || sni === 'x.com')
    ) {
      const event: NativeEvent = {
        host: 'x.com',
        path: '/favicon.ico',
        method: request.method ?? '',
        purpose: 'favicon',
        status: 204,
        range: null,
        bytes: 0,
        sha256: null,
        result: 'started',
        atMs: performance.now(),
      };
      events.push(event);
      active.add(response);
      response.once('close', () => active.delete(response));
      response.once('finish', () => {
        event.result = 'served';
        event.finishedAtMs = performance.now();
      });
      response.writeHead(204, { 'Content-Length': '0', 'Cache-Control': 'no-store' });
      response.end();
      return;
    }
    let route = allowed.get(`${normalizedHost}${request.url ?? ''}`);
    if (!route && normalizedHost === 'x.com' && crcApi.size > 0) {
      const url = new URL(request.url ?? '/', 'https://x.com');
      if (url.pathname === CRC_GRAPHQL_PATH) {
        let tweetId: string | undefined;
        try {
          const variables: unknown = JSON.parse(url.searchParams.get('variables') ?? 'null');
          if (
            variables &&
            typeof variables === 'object' &&
            'tweetId' in variables &&
            typeof variables.tweetId === 'string'
          ) {
            tweetId = variables.tweetId;
          }
        } catch {
          // A malformed or unrelated query remains outside the owned route set.
        }
        if (tweetId) {
          route = crcApi.get(tweetId);
        }
      }
    }
    if (!['GET', 'HEAD'].includes(request.method ?? '') || !route || (sni && sni !== route.host)) {
      reject(request, response);
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
        reject(request, response, 416);
        return;
      }
      start = Number(match[1]);
      end = match[2] ? Number(match[2]) : end;
      if (start >= bytes.length || end < start) {
        reject(request, response, 416);
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
      cacheControl: route.cacheControl ?? 'no-store',
      requestCacheControl:
        typeof request.headers['cache-control'] === 'string'
          ? request.headers['cache-control']
          : null,
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
      videoHold?.pendingPrefixes.delete(response);
      videoHold?.pendingAdjacent.delete(response);
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
      'Cache-Control': route.cacheControl ?? 'no-store',
      'Access-Control-Allow-Origin': 'https://x.com',
      'Access-Control-Allow-Credentials': 'true',
      ...(range === undefined ? {} : { 'Content-Range': `bytes ${start}-${end}/${bytes.length}` }),
    });
    event.headersQueuedAtMs = performance.now();
    if (request.method === 'GET' && videoHold?.afterRequestPath === route.path) {
      videoHold.afterRequestSeen = true;
      for (const [held, prefix] of videoHold.pendingPrefixes) {
        if (!held.destroyed) {
          queueVideoPrefix(held, prefix);
        }
      }
      videoHold.pendingPrefixes.clear();
      if (videoHold.remaining > 0) {
        videoHold.pendingAdjacent.set(response, body);
        response.flushHeaders();
        event.result = 'adjacent-held';
        return;
      }
    }
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
      const prefix = { bytes: body.subarray(0, prefixBytes), event };
      if (videoHold.afterRequestPath && !videoHold.afterRequestSeen) {
        videoHold.pendingPrefixes.set(response, prefix);
        response.flushHeaders();
      } else {
        queueVideoPrefix(response, prefix);
      }
      for (const [adjacent, bytes] of videoHold.pendingAdjacent) {
        if (!adjacent.destroyed) {
          adjacent.end(bytes);
        }
      }
      videoHold.pendingAdjacent.clear();
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
    setZipCrcProfile({
      smallHtml,
      smallApi,
      largeHtml,
      largeApi,
      images,
      displayImages,
      clips,
    }: {
      smallHtml: string;
      smallApi: unknown;
      largeHtml: string;
      largeApi: unknown;
      images: readonly Buffer[];
      displayImages: readonly Buffer[];
      clips: readonly Buffer[];
    }) {
      assert.equal(allowed.size, 0, 'Native fixture payloads already installed');
      assert.equal(crcApi.size, 0, 'CRC API fixture already installed');
      assert(
        clips.length === 0 || clips.length === CRC_CLIPS.length,
        'CRC fixture requires zero or all four exact clips'
      );
      if (clips.length > 0) {
        for (const [index, expected] of CRC_CLIPS.entries()) {
          const clip = clips[index];
          assert(Buffer.isBuffer(clip), `CRC clip ${index} is absent`);
          assert.equal(clip.length, expected.bytes);
          assert.equal(createHash('sha256').update(clip).digest('hex'), expected.sha256);
          if (index > 0) {
            assert(clip.length <= MAX_BODY_BYTES);
          }
        }
      }
      assert.equal(images.length, 3);
      assert.equal(displayImages.length, 3);
      const bounded = (bytes: Buffer) => {
        assert(Buffer.isBuffer(bytes) && bytes.length > 0 && bytes.length <= MAX_BODY_BYTES);
        return bytes;
      };
      const add = (
        host: string,
        url: string,
        bytes: Buffer,
        contentType: string,
        cacheControl?: string
      ) => {
        assert(!allowed.has(`${host}${url}`), 'Duplicate CRC fixture route');
        allowed.set(`${host}${url}`, {
          host,
          path: new URL(url, `https://${host}`).pathname,
          bytes,
          contentType,
          ...(cacheControl ? { cacheControl } : {}),
        });
      };
      const smallId = CRC_TWEET_IDS[0];
      const largeId = CRC_TWEET_IDS[1];
      add(
        'x.com',
        `/testuser/status/${smallId}`,
        bounded(Buffer.from(smallHtml)),
        'text/html; charset=utf-8'
      );
      if (clips.length > 0) {
        add(
          'x.com',
          `/crc_fixture/status/${largeId}`,
          bounded(Buffer.from(largeHtml)),
          'text/html; charset=utf-8'
        );
      }
      crcApi.set(smallId, {
        host: 'x.com',
        path: CRC_GRAPHQL_PATH,
        bytes: bounded(Buffer.from(JSON.stringify(smallApi))),
        contentType: 'application/json',
      });
      if (clips.length > 0) {
        crcApi.set(largeId, {
          host: 'x.com',
          path: CRC_GRAPHQL_PATH,
          bytes: bounded(Buffer.from(JSON.stringify(largeApi))),
          contentType: 'application/json',
        });
      }
      const markers = ['GkE1234ABCDEF.jpg', 'GkE5678GHIJKL.jpg', 'GkE9012MNOPQR.jpg'];
      for (const [index, marker] of markers.entries()) {
        const original = bounded(images[index]!);
        const display = bounded(displayImages[index]!);
        for (const name of ['large', 'small']) {
          add(
            'pbs.twimg.com',
            `/media/${marker}?format=jpg&name=${name}`,
            display,
            'image/jpeg',
            'public, max-age=3600'
          );
        }
        add(
          'pbs.twimg.com',
          `/media/${marker}?format=jpg&name=orig`,
          original,
          'image/jpeg',
          'public, max-age=3600'
        );
        add(
          'pbs.twimg.com',
          `/media/${marker.replace(/\.jpg$/u, '')}?format=jpg&name=orig`,
          original,
          'image/jpeg',
          'public, max-age=3600'
        );
      }
      if (clips.length > 0) {
        for (const [index, expected] of CRC_CLIPS.entries()) {
          add(
            'pbs.twimg.com',
            `/ext_tw_video_thumb/${largeId}/pu/img/crc-${index}.jpg`,
            bounded(displayImages[0]!),
            'image/jpeg',
            'public, max-age=3600'
          );
          add(
            'video.twimg.com',
            `/ext_tw_video/${largeId}/pu/vid/${expected.width}x${expected.height}/crc-${index}.mp4`,
            clips[index]!,
            'video/mp4',
            'public, max-age=3600'
          );
        }
      }
    },
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
      // The Firefox filename fixture preserves its explicit JPEG source path.
      allowed.set('pbs.twimg.com/media/GkE1234ABCDEF.jpg?format=jpg&name=orig', {
        bytes: images[0]!,
        host: 'pbs.twimg.com',
        path: '/media/GkE1234ABCDEF.jpg',
      });
      for (const [path, bytes] of allowedVideos(videoPayloads)) {
        allowed.set(`video.twimg.com${path}`, { bytes, host: 'video.twimg.com', path });
      }
    },
    setExperienceImages(images: Buffer[]) {
      assert.equal(allowed.size > 0, true, 'Install native fixture payloads first');
      const paths = [
        'XegExperienceTall.jpg',
        'XegExperiencePanorama.jpg',
        'XegExperienceSmall.jpg',
      ];
      assert.equal(images.length, paths.length);
      for (const [index, path] of paths.entries()) {
        const bytes = images[index];
        assert(Buffer.isBuffer(bytes) && bytes.length > 0 && bytes.length <= MAX_BODY_BYTES);
        const key = `pbs.twimg.com/media/${path}?format=jpg&name=orig`;
        assert(!allowed.has(key), 'Experience original already installed');
        allowed.set(key, { bytes, host: 'pbs.twimg.com', path: `/media/${path}` });
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
    setRepeatedHintImages(images: readonly Buffer[]) {
      const paths = ['RepeatedHintOne', 'RepeatedHintTwo', 'RepeatedHintThree', 'RepeatedHintFour'];
      const formats = ['jpg', 'png', 'png', 'jpg'];
      assert.equal(images.length, paths.length);
      for (const [index, path] of paths.entries()) {
        const bytes = images[index];
        const format = formats[index];
        assert(Buffer.isBuffer(bytes) && bytes.length > 0 && bytes.length <= MAX_BODY_BYTES);
        const key = `pbs.twimg.com/media/${path}?format=${format}&name=orig`;
        assert(!allowed.has(key), 'Repeated-hint source already installed');
        allowed.set(key, {
          bytes,
          host: 'pbs.twimg.com',
          path: `/media/${path}`,
          contentType: format === 'jpg' ? 'image/jpeg' : 'image/png',
        });
      }
    },
    setRecoveryPayloads({
      tweetId,
      validMp4,
      badMp4,
      adjacentMp4,
    }: {
      tweetId: string;
      validMp4: Buffer;
      badMp4: Buffer;
      adjacentMp4?: Buffer;
    }) {
      assert(allowed.size > 0, 'Install native fixture payloads first');
      assert(typeof tweetId === 'string' && /^[1-9][0-9]{0,19}$/u.test(tweetId));
      for (const bytes of [validMp4, badMp4, adjacentMp4].filter((value) => value !== undefined)) {
        assert(Buffer.isBuffer(bytes) && bytes.length > 0 && bytes.length <= MAX_BODY_BYTES);
      }
      const prefix = `/ext_tw_video/${tweetId}/pu/vid/320x180/`;
      const routes: Array<[string, Buffer]> = Array.from({ length: 8 }, (_, index) => [
        `${prefix}video-${index}-best.mp4`,
        index === 0 ? badMp4 : index === 1 ? (adjacentMp4 ?? validMp4) : validMp4,
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
        afterRequestSeen: false,
        pendingPrefixes: new Map(),
        pendingAdjacent: new Map(),
      };
    },
    armFirstVideoHold(path: string, prefixEnd: number, options?: { afterRequestPath: string }) {
      assert.equal(videoHold, null, 'Only one bounded video source may be held');
      const route = allowed.get(`video.twimg.com${path}`);
      assert(route && route.host === 'video.twimg.com', 'Only a declared video may be held');
      assert(
        Number.isSafeInteger(prefixEnd) && prefixEnd > 0 && prefixEnd < route.bytes.length,
        'The first video hold must leave declared samples outstanding'
      );
      if (options) {
        const ownerOf = (videoPath: string) =>
          /^\/ext_tw_video\/([1-9][0-9]{0,19})\/pu\/vid\/320x180\/video-[0-7]-best\.mp4$/u.exec(
            videoPath
          )?.[1];
        const owner = ownerOf(path);
        assert(
          owner && ownerOf(options.afterRequestPath) === owner,
          'The release request must share the held video owner'
        );
        assert.notEqual(options.afterRequestPath, path, 'The release request must be adjacent');
        assert(
          allowed.has(`video.twimg.com${options.afterRequestPath}`),
          'The release video must be declared'
        );
      }
      videoHold = {
        path: `video.twimg.com${path}`,
        prefixEnd,
        remaining: 1,
        responses: new Map<ServerResponse, Buffer>(),
        ...(options ? { afterRequestPath: options.afterRequestPath } : {}),
        afterRequestSeen: false,
        pendingPrefixes: new Map(),
        pendingAdjacent: new Map(),
      };
    },
    videoHeld: () => videoHold !== null && videoHold.responses.size > 0,
    completeVideoHold() {
      assert(videoHold && videoHold.responses.size > 0, 'A live held video response is required');
      const pending = videoHold;
      videoHold = null;
      for (const [response, tail] of pending.responses) {
        if (!response.destroyed) {
          const prefix = pending.pendingPrefixes.get(response);
          if (prefix) {
            queueVideoPrefix(response, prefix);
          }
          response.end(tail);
        }
      }
      pending.responses.clear();
      pending.pendingPrefixes.clear();
      for (const [response, bytes] of pending.pendingAdjacent) {
        if (!response.destroyed) {
          response.end(bytes);
        }
      }
      pending.pendingAdjacent.clear();
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
      pending.pendingPrefixes.clear();
      for (const response of pending.pendingAdjacent.keys()) {
        response.destroy();
      }
      pending.pendingAdjacent.clear();
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

export async function startExtensionNativeFixtureLoopback(
  helperPath: string,
  observeTransport = false
) {
  const certificate = await generateFixtureCertificate(helperPath, undefined, true, true);
  const fixture = createExtensionNativeFixtureHandler();
  const server = createServer(
    { key: certificate.keyPem, cert: certificate.certPem, maxHeaderSize: 4_096 },
    fixture.handle
  );
  const lifecycle = await startHttpsLoopback(
    server,
    'extension-native-loopback-unavailable',
    observeTransport
  );
  return {
    ...fixture,
    port: lifecycle.port,
    spkiSha256: certificate.spkiSha256,
    releaseIdleConnections: () => lifecycle.releaseIdleConnections(),
    snapshot: () => ({
      ...fixture.snapshot(),
      serverError: lifecycle.serverError(),
      transport: lifecycle.transportSnapshot(),
    }),
    close: () => lifecycle.close(fixture.destroyActive),
  };
}
