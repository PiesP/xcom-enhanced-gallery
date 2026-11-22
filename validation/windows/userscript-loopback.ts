// SPDX-License-Identifier: MIT
// Copyright (c) 2026 PiesP

import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { createHash, createPrivateKey, X509Certificate } from 'node:crypto';
import { createServer } from 'node:https';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { promisify } from 'node:util';
import { startHttpsLoopback } from './https-loopback-lifecycle.ts';

const execFileAsync = promisify(execFile);
const HOST = 'pbs.twimg.com';
const MAX_REQUESTS = 64;
const LARGE_PHOTO_MAX_REQUESTS = 512;
const MAX_IMAGE_BYTES = 64 * 1024;
const MAX_SERVED_BYTES = 2 * 1024 * 1024;
const MAX_API_SERVED_BYTES = 3 * 1024 * 1024;
const API_TWEET_ID = '1234567890123456789';
export const UPGRADE_DIRECT_TWEET_ID = '9111111111111111111';
export const DECLARED_DEFAULT_TWEET_IDS = [
  { id: API_TWEET_ID, kind: 'primary' },
  { id: '7555555555555555555', kind: 'control' },
  { id: '8555555555555555555', kind: 'control' },
  { id: '8666666666666666661', kind: 'unavailable' },
  { id: '8666666666666666662', kind: 'unavailable' },
  { id: '8666666666666666663', kind: 'unavailable' },
  { id: '8666666666666666664', kind: 'unavailable' },
  { id: '9555555555555555555', kind: 'control' },
  { id: '9876543210987654321', kind: 'public' },
] as const;
const DEFAULT_TWEET_ID_KINDS = new Map<string, string>(
  DECLARED_DEFAULT_TWEET_IDS.map(({ id, kind }) => [id, kind])
);
const API_ALLOWED_RECEIVER = 'https://pbs.twimg.com/xeg-metadata-allowed.json';
const API_BLOCKED_RECEIVER = 'https://x.com/xeg-metadata-blocked.json';
const MEDIA_REDIRECT_RECEIVER = '/media/xeg-owned-redirect-final.jpg';
type ApiMode = 'healthy' | 'capacity' | 'redirect-allowed' | 'redirect-blocked';

type FixtureEvent = {
  phase: string;
  cohort: string;
  index: number;
  purpose: string;
  method: string;
  result: string;
  bytes: number;
  sha256: string | null;
  sourceUrl?: string;
  status?: number;
  requestedId?: string;
  host?: 'x.com';
  operation?: 'TweetResultByRestId';
  atMs?: number;
  finishedAtMs?: number;
};
type RejectedIdShape = {
  type: string;
  length: number | null;
  digitsOnly: boolean;
  sha256Prefix: string | null;
  count: number;
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
      ...(includeFixturePage ? ['x.com', 'mobile.x.com'] : []),
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
      assert.equal(certificate.checkHost('mobile.x.com', { subject: 'never' }), 'mobile.x.com');
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
  const normalMarkers = cohorts.normal;
  assert(normalMarkers?.length === 3, 'Three normal media markers are required');
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
  const largePhotos = new Map<string, { index: number; bytes: Buffer; status?: 404 }>();
  const largeApi = new Map<string, Buffer>();
  let largeDomApiId: string | null = null;
  let largeServedBytes = 0;
  let largeApiServedBytes = 0;
  let phase = 'normal';
  let heldArmed = false;
  let heldPending: { response: ServerResponse; event: FixtureEvent; body: Buffer } | null = null;
  let requestCount = 0;
  let unexpectedCount = 0;
  let overflow = false;
  let servedBytes = 0;
  let apiServedBytes = 0;
  let apiMode: ApiMode | null = null;
  let upgradeDenialEnabled = false;
  let mediaRedirectArmed = false;
  let mediaRedirectPending = false;
  const rejectedReasons: Record<string, number> = {};
  const defaultApiCompletedByKind: Record<string, number> = {};
  const rejectedIdShapes: RejectedIdShape[] = [];
  let rejectedIdShapeOverflow = 0;
  const events: FixtureEvent[] = [];
  const active = new Set<ServerResponse>();
  let domProbeActive = 0;
  let domProbePeak = 0;
  const reject = (response: ServerResponse, reason: string) => {
    unexpectedCount += 1;
    rejectedReasons[reason] = (rejectedReasons[reason] ?? 0) + 1;
    response.writeHead(404, { 'Content-Length': '0', 'Cache-Control': 'no-store' });
    response.end();
  };
  const apiBody = (mode: ApiMode) => {
    const result = {
      __typename: 'Tweet',
      rest_id: API_TWEET_ID,
      core: {
        user_results: { result: { legacy: { screen_name: 'testuser', name: 'Test User' } } },
      },
      legacy: {
        id_str: API_TWEET_ID,
        full_text: 'Three installed userscript fixtures.',
        extended_entities: {
          media: normalMarkers.map((marker, index) => ({
            type: 'photo',
            id_str: `46660${index}`,
            media_url_https: `https://pbs.twimg.com/media/${marker}.jpg?format=jpg&name=small`,
            original_info: { width: 320, height: 180 },
          })),
        },
      },
    };
    return Buffer.from(
      JSON.stringify({
        data: { tweetResult: { result } },
        ...(mode === 'capacity' ? { padding: 'x'.repeat(2 * 1024 * 1024) } : {}),
      })
    );
  };
  const handle = (request: IncomingMessage, response: ServerResponse) => {
    requestCount += 1;
    if (requestCount > (largePhotos.size ? LARGE_PHOTO_MAX_REQUESTS : MAX_REQUESTS)) {
      overflow = true;
      response.destroy();
      return;
    }
    const host = request.headers.host?.replace(/:443$/u, '');
    const path = request.url ?? '';
    const largePhoto = host === HOST ? largePhotos.get(path) : undefined;
    if (largePhoto) {
      if (
        !['GET', 'HEAD'].includes(request.method ?? '') ||
        request.headers['sec-fetch-dest'] === 'image'
      ) {
        reject(response, 'large-photo-purpose');
        return;
      }
      const body =
        request.method === 'HEAD' || largePhoto.status === 404 ? Buffer.alloc(0) : largePhoto.bytes;
      if (largeServedBytes + body.length > 1024 * 1024) {
        overflow = true;
        response.destroy();
        return;
      }
      largeServedBytes += body.length;
      if (request.method === 'HEAD' && path.startsWith('/media/XegDom')) {
        domProbeActive += 1;
        domProbePeak = Math.max(domProbePeak, domProbeActive);
        response.once('close', () => {
          domProbeActive -= 1;
        });
      }
      const event: FixtureEvent = {
        phase: 'large-photo',
        cohort: 'large-photo',
        index: largePhoto.index,
        purpose: request.method === 'HEAD' ? 'original-probe' : 'transfer',
        method: request.method ?? '',
        result: 'started',
        bytes: 0,
        sha256: null,
        ...(path.startsWith('/media/XegDom')
          ? { sourceUrl: path, status: largePhoto.status ?? 200 }
          : {}),
      };
      events.push(event);
      active.add(response);
      response.once('close', () => {
        if (!response.writableFinished) {
          event.result = 'aborted';
        }
        active.delete(response);
      });
      response.once('finish', () => {
        event.result = largePhoto.status === 404 ? 'http-404' : 'served';
        event.bytes = body.length;
        event.sha256 = body.length ? createHash('sha256').update(body).digest('hex') : null;
      });
      response.writeHead(largePhoto.status ?? 200, {
        ...(largePhoto.status === 404 ? {} : { 'Content-Type': 'image/jpeg' }),
        'Content-Length': String(largePhoto.status === 404 ? 0 : largePhoto.bytes.length),
        'Cache-Control': 'no-store',
        'Access-Control-Allow-Origin': 'https://x.com',
        'Access-Control-Allow-Credentials': 'true',
      });
      response.end(body);
      return;
    }
    const apiAllowedOrigin =
      request.headers.origin === 'https://mobile.x.com' ? 'https://mobile.x.com' : 'https://x.com';
    const isAllowedReceiver = host === HOST && path === '/xeg-metadata-allowed.json';
    const isBlockedReceiver = host === 'x.com' && path === '/xeg-metadata-blocked.json';
    if (isAllowedReceiver || isBlockedReceiver) {
      const mode = apiMode;
      if (
        request.method !== 'GET' ||
        mode === null ||
        (isAllowedReceiver && mode !== 'redirect-allowed') ||
        (isBlockedReceiver && mode !== 'redirect-blocked')
      ) {
        reject(response, 'receiver-mode-or-method');
        return;
      }
      const body = apiBody(mode);
      if (apiServedBytes + body.length > MAX_API_SERVED_BYTES) {
        overflow = true;
        response.destroy();
        return;
      }
      apiServedBytes += body.length;
      const event: FixtureEvent = {
        phase: mode,
        cohort: 'api',
        index: 1,
        purpose: isAllowedReceiver ? 'allowed-final' : 'blocked-final',
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
      response.once('finish', () => {
        event.result = 'served';
        event.bytes = body.length;
        event.sha256 = createHash('sha256').update(body).digest('hex');
      });
      response.writeHead(200, {
        'Content-Type': 'application/json',
        'Content-Length': String(body.length),
        'Cache-Control': 'no-store',
        'Access-Control-Allow-Origin': apiAllowedOrigin,
        'Access-Control-Allow-Credentials': 'true',
      });
      response.end(body);
      return;
    }
    if (host === 'x.com' && path.startsWith('/i/api/graphql/')) {
      let tweetId: unknown;
      try {
        const url = new URL(path, 'https://x.com');
        tweetId = JSON.parse(url.searchParams.get('variables') ?? '{}').tweetId;
        if (!/^\/i\/api\/graphql\/[^/]+\/TweetResultByRestId$/u.test(url.pathname)) {
          reject(response, 'graphql-path');
          return;
        }
      } catch {
        reject(response, 'graphql-variables');
        return;
      }
      const largeId = typeof tweetId === 'string' ? tweetId : null;
      const largeBody = largeId ? largeApi.get(largeId) : undefined;
      if (largeId !== null && largeId === largeDomApiId && request.method === 'GET') {
        const body = Buffer.from('{}');
        const event: FixtureEvent = {
          phase: 'large-dom-photo',
          cohort: 'large-dom-api',
          index: 0,
          purpose: 'metadata',
          method: 'GET',
          result: 'started',
          bytes: 0,
          sha256: null,
          requestedId: largeId,
          host: 'x.com',
          operation: 'TweetResultByRestId',
          status: 403,
          atMs: performance.now(),
        };
        events.push(event);
        active.add(response);
        response.once('close', () => {
          if (!response.writableFinished) {
            event.result = 'aborted';
          }
          active.delete(response);
        });
        response.once('finish', () => {
          event.result = 'http-403';
          event.bytes = body.length;
          event.sha256 = createHash('sha256').update(body).digest('hex');
          event.finishedAtMs = performance.now();
        });
        response.writeHead(403, {
          'Content-Type': 'application/json',
          'Content-Length': String(body.length),
          'Cache-Control': 'no-store',
          'Access-Control-Allow-Origin': apiAllowedOrigin,
          'Access-Control-Allow-Credentials': 'true',
        });
        response.end(body);
        return;
      }
      if (largeBody) {
        assert(largeId !== null, 'Installed photo API owner is missing');
        if (request.method !== 'GET') {
          reject(response, 'large-api-method');
          return;
        }
        if (largeApiServedBytes + largeBody.length > 4 * 1024 * 1024) {
          overflow = true;
          response.destroy();
          return;
        }
        largeApiServedBytes += largeBody.length;
        const event: FixtureEvent = {
          phase: 'large-photo',
          cohort: 'large-api',
          index: largeId?.endsWith('1') ? 0 : 1,
          purpose: 'metadata',
          method: 'GET',
          result: 'started',
          bytes: 0,
          sha256: null,
          requestedId: largeId,
          host: 'x.com',
          operation: 'TweetResultByRestId',
          status: 200,
          atMs: performance.now(),
        };
        events.push(event);
        active.add(response);
        response.once('close', () => {
          if (!response.writableFinished) {
            event.result = 'aborted';
          }
          active.delete(response);
        });
        response.once('finish', () => {
          event.result = 'served';
          event.bytes = largeBody.length;
          event.sha256 = createHash('sha256').update(largeBody).digest('hex');
          event.finishedAtMs = performance.now();
        });
        response.writeHead(200, {
          'Content-Type': 'application/json',
          'Content-Length': String(largeBody.length),
          'Cache-Control': 'no-store',
          'Access-Control-Allow-Origin': apiAllowedOrigin,
          'Access-Control-Allow-Credentials': 'true',
        });
        response.end(largeBody);
        return;
      }
      const defaultKind =
        typeof tweetId === 'string'
          ? (DEFAULT_TWEET_ID_KINDS.get(tweetId) ??
            (upgradeDenialEnabled && tweetId === UPGRADE_DIRECT_TWEET_ID
              ? 'upgrade-direct'
              : undefined))
          : undefined;
      if (
        request.method !== 'GET' ||
        !defaultKind ||
        (apiMode !== null && tweetId !== API_TWEET_ID)
      ) {
        if (request.method === 'GET' && !defaultKind) {
          const printable =
            typeof tweetId === 'string' || typeof tweetId === 'number' ? String(tweetId) : null;
          const sha256Prefix = printable
            ? createHash('sha256').update(printable).digest('hex').slice(0, 12)
            : null;
          const existing = rejectedIdShapes.find(
            (shape) => shape.type === typeof tweetId && shape.sha256Prefix === sha256Prefix
          );
          if (existing) {
            existing.count += 1;
          } else if (rejectedIdShapes.length < 8) {
            rejectedIdShapes.push({
              type: typeof tweetId,
              length: printable?.length ?? null,
              digitsOnly: printable !== null && /^\d+$/u.test(printable),
              sha256Prefix,
              count: 1,
            });
          } else {
            rejectedIdShapeOverflow += 1;
          }
        }
        reject(
          response,
          request.method !== 'GET'
            ? 'graphql-method'
            : !defaultKind
              ? 'graphql-undeclared-id'
              : 'graphql-active-mode-id'
        );
        return;
      }
      const mode = apiMode;
      const redirect = mode === 'redirect-allowed' || mode === 'redirect-blocked';
      const body = mode === null ? Buffer.from('{}') : redirect ? Buffer.alloc(0) : apiBody(mode);
      if (apiServedBytes + body.length > MAX_API_SERVED_BYTES) {
        overflow = true;
        response.destroy();
        return;
      }
      apiServedBytes += body.length;
      const event: FixtureEvent = {
        phase: mode ?? 'default',
        cohort: 'api',
        index: 0,
        purpose: 'metadata',
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
      response.once('finish', () => {
        event.result = mode === null ? 'http-403' : redirect ? 'redirect' : 'served';
        event.bytes = body.length;
        event.sha256 =
          mode === null || redirect ? null : createHash('sha256').update(body).digest('hex');
        if (mode === null) {
          defaultApiCompletedByKind[defaultKind] =
            (defaultApiCompletedByKind[defaultKind] ?? 0) + 1;
        }
      });
      response.writeHead(mode === null ? 403 : redirect ? 302 : 200, {
        'Content-Type': 'application/json',
        'Content-Length': String(body.length),
        'Cache-Control': 'no-store',
        'Access-Control-Allow-Origin': apiAllowedOrigin,
        'Access-Control-Allow-Credentials': 'true',
        ...(redirect && {
          Location: mode === 'redirect-allowed' ? API_ALLOWED_RECEIVER : API_BLOCKED_RECEIVER,
        }),
      });
      response.end(body);
      return;
    }
    if (host === HOST && path === MEDIA_REDIRECT_RECEIVER) {
      if (request.method !== 'GET' || !mediaRedirectPending || !images) {
        reject(response, 'media-redirect-unarmed');
        return;
      }
      mediaRedirectPending = false;
      const body = images[0];
      assert(body);
      if (servedBytes + body.length > MAX_SERVED_BYTES) {
        overflow = true;
        response.destroy();
        return;
      }
      servedBytes += body.length;
      const event: FixtureEvent = {
        phase,
        cohort: 'native-redirect-final',
        index: 0,
        purpose: 'transfer',
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
      response.once('finish', () => {
        event.result = 'served';
        event.bytes = body.length;
        event.sha256 = createHash('sha256').update(body).digest('hex');
      });
      response.writeHead(200, {
        'Content-Type': 'image/jpeg',
        'Content-Length': String(body.length),
        'Cache-Control': 'no-store',
      });
      response.end(body);
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
      reject(response, 'media-route-or-phase');
      return;
    }
    const bytes = images[media.index];
    if (!Buffer.isBuffer(bytes) || bytes.length === 0 || bytes.length > MAX_IMAGE_BYTES) {
      reject(response, 'media-bytes');
      return;
    }
    const purpose = request.headers['sec-fetch-dest'] === 'image' ? 'preview' : 'transfer';
    if (media.cohort !== 'avatar' && media.purpose !== purpose) {
      reject(response, 'media-purpose');
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
      if (heldPending?.response === response) {
        heldPending = null;
      }
    });
    if (
      mediaRedirectArmed &&
      phase === 'normal' &&
      media.cohort === 'normal' &&
      media.index === 0 &&
      purpose === 'transfer'
    ) {
      mediaRedirectArmed = false;
      mediaRedirectPending = true;
      response.once('finish', () => {
        event.result = 'redirect';
      });
      response.writeHead(302, {
        Location: `https://${HOST}${MEDIA_REDIRECT_RECEIVER}`,
        'Content-Length': '0',
        'Cache-Control': 'no-store',
      });
      response.end();
      return;
    }
    if (
      heldArmed &&
      phase === 'held' &&
      media.cohort === 'held' &&
      media.index === 0 &&
      purpose === 'transfer'
    ) {
      if (heldPending) {
        event.result = 'held-duplicate';
        reject(response, 'held-duplicate');
        return;
      }
      heldPending = { response, event, body: bytes };
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
    setLargePhotos(
      originals: ReadonlyMap<string, Buffer>,
      apiResponses: ReadonlyMap<string, Buffer>
    ) {
      assert(images && largePhotos.size === 0 && largeApi.size === 0, 'Install base images first');
      assert.equal(originals.size, 40);
      assert.equal(apiResponses.size, 2);
      for (const [source, bytes] of originals) {
        const url = new URL(source);
        assert.equal(url.protocol, 'https:');
        assert.equal(url.hostname, HOST);
        assert.match(url.pathname, /^\/media\/XegLarge[AB]\d{2}\.jpg$/u);
        assert.equal(url.search, '?format=jpg&name=orig');
        assert(Buffer.isBuffer(bytes) && bytes.length > 0 && bytes.length <= MAX_IMAGE_BYTES);
        assert(!largePhotos.has(`${url.pathname}${url.search}`));
        largePhotos.set(`${url.pathname}${url.search}`, { index: largePhotos.size, bytes });
      }
      for (const [id, body] of apiResponses) {
        assert.match(id, /^[1-9]\d{1,39}$/u);
        assert(Buffer.isBuffer(body) && body.length > 0 && body.length <= 512 * 1024);
        largeApi.set(id, body);
      }
    },
    setLargeDomPhotos(originals: ReadonlyMap<string, Buffer>, ownerId: string) {
      assert(images && largePhotos.size === 40 && largeApi.size === 2);
      assert.equal(originals.size, 20);
      assert.match(ownerId, /^[1-9]\d{1,39}$/u);
      assert(!largeApi.has(ownerId) && largeDomApiId === null);
      assert.equal(active.size, 0, 'Photo fixture transport must be idle before DOM phase');
      const additions = new Map<string, { index: number; bytes: Buffer; status?: 404 }>();
      for (const [source, bytes] of originals) {
        const url = new URL(source);
        assert.equal(url.protocol, 'https:');
        assert.equal(url.hostname, HOST);
        assert.match(url.pathname, /^\/media\/XegDom\d{2}$/u);
        assert.equal(url.search, '?format=jpg&name=orig');
        assert(Buffer.isBuffer(bytes) && bytes.length > 0 && bytes.length <= MAX_IMAGE_BYTES);
        const jpeg = `${url.pathname}${url.search}`;
        const webp = `${url.pathname}?format=webp&name=orig`;
        assert(!largePhotos.has(jpeg) && !largePhotos.has(webp));
        assert(!additions.has(jpeg) && !additions.has(webp));
        additions.set(webp, { index: additions.size, bytes: Buffer.alloc(0), status: 404 });
        additions.set(jpeg, { index: additions.size, bytes });
      }
      largePhotos.clear();
      largeApi.clear();
      for (const [path, entry] of additions) {
        largePhotos.set(path, entry);
      }
      largeDomApiId = ownerId;
    },
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
      assert.equal(mediaRedirectPending, false, 'Fixture retains a pending native redirect');
      phase = next;
      heldArmed = false;
    },
    armMediaRedirect() {
      assert.equal(phase, 'normal');
      assert.equal(active.size, 0);
      assert.equal(mediaRedirectArmed, false);
      assert.equal(mediaRedirectPending, false);
      mediaRedirectArmed = true;
    },
    setApiMode(next: ApiMode | null) {
      assert.equal(active.size, 0, 'Fixture has an active transport before API mode change');
      assert(!upgradeDenialEnabled, 'Upgrade API denial overlaps explicit API mode');
      apiMode = next;
    },
    setUpgradeDenial(next: boolean) {
      if (next) {
        assert.equal(apiMode, null, 'Upgrade API denial overlaps explicit API mode');
        assert.equal(active.size, 0, 'Fixture has an active transport before upgrade mode');
      }
      upgradeDenialEnabled = next;
    },
    armHeld() {
      assert.equal(phase, 'held');
      assert.equal(active.size, 0, 'Cannot arm a held response with active transport');
      assert.equal(heldPending, null, 'Previous held response remains pending');
      heldArmed = true;
    },
    releaseHeldHeaders() {
      assert.equal(phase, 'held');
      assert(heldArmed && heldPending, 'No armed held transfer to release');
      const { response, event, body } = heldPending;
      assert(active.has(response) && !response.destroyed && !response.headersSent);
      assert(body.length > 1 && servedBytes + 1 <= MAX_SERVED_BYTES);
      response.writeHead(200, {
        'Content-Type': 'image/jpeg',
        'Content-Length': String(body.length),
        'Cache-Control': 'no-store',
        'Access-Control-Allow-Origin': '*',
      });
      response.write(body.subarray(0, 1));
      servedBytes += 1;
      event.result = 'headers-released';
      event.bytes = 1;
      return { ...event };
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
      rejectedReasons: { ...rejectedReasons },
      defaultApiCompletedByKind: { ...defaultApiCompletedByKind },
      rejectedIdShapes: rejectedIdShapes.map((shape) => ({ ...shape })),
      rejectedIdShapeOverflow,
      upgradeDenialEnabled,
      overflow,
      servedBytes,
      largeServedBytes,
      largeApiServedBytes,
      apiServedBytes,
      activeCount: active.size,
      domProbePeak,
      mediaRedirectArmed,
      mediaRedirectPending,
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
  const certificate = await generateFixtureCertificate(helperPath, run, true, true);
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
  const lifecycle = await startHttpsLoopback(server, 'fixture-loopback-unavailable');
  return {
    ...fixture,
    port: lifecycle.port,
    spkiSha256: certificate.spkiSha256,
    snapshot: () => ({ ...fixture.snapshot(), serverError: lifecycle.serverError() }),
    close: () => lifecycle.close(fixture.destroyActive),
  };
}
