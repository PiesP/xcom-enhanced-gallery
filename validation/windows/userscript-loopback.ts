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
const MAX_IMAGE_BYTES = 64 * 1024;
const MAX_SERVED_BYTES = 2 * 1024 * 1024;
const MAX_API_SERVED_BYTES = 3 * 1024 * 1024;
const API_TWEET_ID = '1234567890123456789';
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
  let phase = 'normal';
  let heldArmed = false;
  let requestCount = 0;
  let unexpectedCount = 0;
  let overflow = false;
  let servedBytes = 0;
  let apiServedBytes = 0;
  let apiMode: ApiMode | null = null;
  let mediaRedirectArmed = false;
  let mediaRedirectPending = false;
  const rejectedReasons: Record<string, number> = {};
  const defaultApiCompletedByKind: Record<string, number> = {};
  const events: FixtureEvent[] = [];
  const active = new Set<ServerResponse>();
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
    if (requestCount > MAX_REQUESTS) {
      overflow = true;
      response.destroy();
      return;
    }
    const host = request.headers.host?.replace(/:443$/u, '');
    const path = request.url ?? '';
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
        'Access-Control-Allow-Origin': 'https://x.com',
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
        if (!url.pathname.endsWith('/TweetResultByRestId')) {
          reject(response, 'graphql-path');
          return;
        }
      } catch {
        reject(response, 'graphql-variables');
        return;
      }
      const defaultKind =
        typeof tweetId === 'string' ? DEFAULT_TWEET_ID_KINDS.get(tweetId) : undefined;
      if (
        request.method !== 'GET' ||
        !defaultKind ||
        (apiMode !== null && tweetId !== API_TWEET_ID)
      ) {
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
        'Access-Control-Allow-Origin': 'https://x.com',
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
      apiMode = next;
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
      rejectedReasons: { ...rejectedReasons },
      defaultApiCompletedByKind: { ...defaultApiCompletedByKind },
      overflow,
      servedBytes,
      apiServedBytes,
      activeCount: active.size,
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
