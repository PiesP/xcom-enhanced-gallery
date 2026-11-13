// SPDX-License-Identifier: MIT
// Copyright (c) 2026 PiesP

import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';
import { createHash } from 'node:crypto';
import type { LiveFilenameTarget } from './live-filename-target.ts';
import { isLiveFilenameOriginal } from './live-filename-target.ts';
import { MEDIA_COHORTS } from './userscript-document.ts';

type TraceSession = {
  send(method: string, params?: Record<string, unknown>): Promise<unknown>;
  on(event: 'Debugger.paused', listener: (event: unknown) => void): unknown;
  off(event: 'Debugger.paused', listener: (event: unknown) => void): unknown;
  detach(): Promise<void>;
};

/** Guard the interval between enabling Debugger and installing source-bound breakpoints. */
export function createPreArmPauseGuard(session: TraceSession) {
  let listening = false;
  let disabled = false;
  let detached = false;
  let pauseCount = 0;
  let pending: Promise<void> | null = null;
  const errors: string[] = [];
  const note = (value: string) => {
    if (errors.length < 4) {
      errors.push(value);
    }
  };
  const quiesce = async () => {
    try {
      await withTimeout(
        session.send('Debugger.setSkipAllPauses', { skip: true }),
        4000,
        'pre-arm skip pauses'
      );
    } catch (error) {
      note(error instanceof Error ? error.name : 'skip-error');
    }
    try {
      await withTimeout(session.send('Debugger.resume'), 4000, 'pre-arm resume');
    } catch (error) {
      note(error instanceof Error ? error.name : 'resume-error');
    }
    try {
      await withTimeout(session.send('Debugger.disable'), 4000, 'pre-arm disable');
      disabled = true;
    } catch (error) {
      note(error instanceof Error ? error.name : 'disable-error');
      try {
        await withTimeout(session.detach(), 4000, 'pre-arm detach');
        detached = true;
      } catch (detachError) {
        note(detachError instanceof Error ? detachError.name : 'detach-error');
      }
    }
  };
  const onPaused = () => {
    pauseCount = Math.min(pauseCount + 1, 5);
    note('unexpected-pre-arm-pause');
    if (!pending && !disabled && !detached) {
      pending = quiesce();
    }
  };
  const drain = async () => {
    if (pending) {
      await withTimeout(pending, 20_000, 'pre-arm pause drain');
    }
  };
  const removeIfQuiescent = () => {
    if (listening && (disabled || detached)) {
      session.off('Debugger.paused', onPaused);
      listening = false;
    }
  };
  return {
    start() {
      assert(!listening);
      session.on('Debugger.paused', onPaused);
      listening = true;
    },
    assertClean() {
      assert.equal(errors.length, 0, `Pre-arm debugger pause: ${errors.join('; ')}`);
    },
    async handoff() {
      assert(listening);
      await drain();
      if (errors.length === 0 || disabled || detached) {
        session.off('Debugger.paused', onPaused);
        listening = false;
      }
      assert.equal(errors.length, 0, `Pre-arm debugger pause: ${errors.join('; ')}`);
    },
    async stop() {
      await drain();
      if (listening && !disabled && !detached && !pending) {
        try {
          await withTimeout(session.send('Debugger.disable'), 4000, 'pre-arm cleanup disable');
          disabled = true;
        } catch (error) {
          note(error instanceof Error ? error.name : 'disable-error');
          try {
            await withTimeout(session.detach(), 4000, 'pre-arm cleanup detach');
            detached = true;
          } catch (detachError) {
            note(detachError instanceof Error ? detachError.name : 'detach-error');
          }
        }
      }
      removeIfQuiescent();
      return { pauseCount, disabled, detached, errors: [...errors] };
    },
    snapshot: () => ({ pauseCount, disabled, detached, errors: [...errors] }),
  };
}

type Location = { scriptId: string; lineNumber: number; columnNumber?: number };
type Breakpoint = { breakpointId: string; actualLocation: Location; kind: 'filename' | 'gm' };
type Pause = {
  reason: string | null;
  hitBreakpoints: string[];
  scriptId: string | null;
  lineNumber: number | null;
  kind: 'filename' | 'gm' | null;
};
export type FrameTraceSnapshot = {
  breakpoints: Breakpoint[];
  pauses: Pause[];
  pauseCount: number;
  captureJobs: number;
  media: FrameMedia | null;
  gmCall: FrameGmCall | null;
  evaluatedObservations: Array<{
    kind: 'filename' | 'gm';
    status: 'captured' | 'over-limit' | 'unserializable';
    value?: unknown;
    serializedBytes?: number;
  }>;
  errors: string[];
  debuggerDisabled: boolean;
  debuggerDetached: boolean;
};
export type InstalledUserscriptFrameTrace = {
  arm(): Promise<void>;
  waitForMedia(): Promise<FrameMedia>;
  waitForGmCall(): Promise<FrameGmCall>;
  snapshot(): FrameTraceSnapshot;
  stop(): Promise<{
    removed: boolean;
    debuggerDisabled: boolean;
    debuggerDetached: boolean;
    errors: string[];
  }>;
};
export type FrameMedia = {
  generatedFilename: string;
  id: string | null;
  type: string | null;
  url: string | null;
  originalUrl: string | null;
  downloadSource: { url: string | null; quality: string | null; provenance: string | null } | null;
  filename: string | null;
  tweetUsername: string | null;
  tweetId: string | null;
  quotedUsername: string | null;
  quotedTweetId: string | null;
  sourceLocation: string | null;
  attachmentOrdinal: number | null;
  attachmentSourceKey: string | null;
  gm: {
    legacyDownloadType: string | null;
    modernDownloadType: string | null;
    handler: string | null;
    version: string | null;
    scriptName: string | null;
    scriptVersion: string | null;
    grants: string[] | null;
    mode: string | null;
  };
  frameGlobal: {
    scriptName: string | null;
    handler: string | null;
    legacyDownloadType: string | null;
    modernDownloadType: string | null;
  };
};
export type FrameGmCall = {
  apiName: string;
  args: { url: string; name: string; saveAs: false; timeout: number };
  downloadFunctionType: string;
  returnType: string;
  abortType: string;
  thenType: string;
  callerCapability: {
    status: 'captured' | 'unknown';
    modernType: string | null;
    legacyType: string | null;
  };
};

export type FrameTraceTarget = LiveFilenameTarget | { kind: 'held-fixture'; originalUrl: string };

// These expressions read only the current lexical call frame. No page global receives evidence.
export const LIVE_FILENAME_FRAME_EXPRESSION = `(() => {
  const text = (value, max) => typeof value === 'string' ? value.slice(0, max) : null;
  const info = typeof GM_info === 'object' && GM_info !== null ? GM_info : null;
  return {
    generatedFilename: text(filename, 256),
    id: text(media?.id, 128), type: text(media?.type, 40),
    url: text(media?.url, 256), originalUrl: text(media?.originalUrl, 256),
    downloadSource: media?.downloadSource ? {
      url: text(media.downloadSource.url, 256),
      quality: text(media.downloadSource.quality, 48),
      provenance: text(media.downloadSource.provenance, 48)
    } : null,
    filename: text(media?.filename, 256),
    tweetUsername: text(media?.tweetUsername, 32), tweetId: text(media?.tweetId, 32),
    quotedUsername: text(media?.quotedUsername, 32), quotedTweetId: text(media?.quotedTweetId, 32),
    sourceLocation: text(media?.sourceLocation, 32),
    attachmentOrdinal: Number.isSafeInteger(media?.attachmentOrdinal)
      ? media.attachmentOrdinal : null,
    attachmentSourceKey: text(media?.attachmentSourceKey, 80),
    gm: {
      legacyDownloadType: typeof GM_download,
      modernDownloadType: typeof GM === 'object' && GM !== null
        ? typeof GM.download : 'undefined',
      handler: text(info?.scriptHandler, 80), version: text(info?.version, 40),
      scriptName: text(info?.script?.name, 80), scriptVersion: text(info?.script?.version, 40),
      grants: Array.isArray(info?.script?.grant)
        ? info.script.grant.slice(0, 24).filter(item => typeof item === 'string').map(item => item.slice(0, 80))
        : null,
      mode: text(info?.downloadMode, 40)
    },
    frameGlobal: {
      scriptName: text(globalThis.GM_info?.script?.name, 80),
      handler: text(globalThis.GM_info?.scriptHandler, 80),
      legacyDownloadType: typeof globalThis.GM_download,
      modernDownloadType: typeof globalThis.GM?.download
    }
  };
})()`;

const GM_FRAME_BODY = `(() => ({
  apiName: API_NAME,
  args: { url: typeof url === 'string' ? url.slice(0, 256) : null,
    name: typeof filename === 'string' ? filename.slice(0, 256) : null,
    saveAs: false,
    timeout: typeof GM_DOWNLOAD_TIMEOUT_MS === 'number' ? GM_DOWNLOAD_TIMEOUT_MS : null },
  downloadFunctionType: DOWNLOAD_FUNCTION_TYPE,
  returnType: typeof handle, abortType: typeof handle?.abort, thenType: typeof handle?.then
}))()`;
export const LIVE_SHARED_GM_FRAME_EXPRESSION = GM_FRAME_BODY.replace(
  'API_NAME',
  "typeof apiName === 'string' ? apiName.slice(0, 32) : null"
).replace('DOWNLOAD_FUNCTION_TYPE', 'typeof gmDownload');
export const LIVE_OLD_GM_FRAME_EXPRESSION = GM_FRAME_BODY.replace(
  'API_NAME',
  "'GM.download'"
).replace('DOWNLOAD_FUNCTION_TYPE', 'typeof gmDownloadModern');
export const LIVE_GM_CALLER_FRAME_EXPRESSION = `(() => ({
  modernType: typeof gmDownloadModern,
  legacyType: typeof gmDownloadLegacy
}))()`;

function record(value: unknown): Record<string, unknown> {
  assert(value && typeof value === 'object' && !Array.isArray(value), 'CDP value is not an object');
  return value as Record<string, unknown>;
}

function boundedFrameValue(value: unknown): Record<string, unknown> {
  const item = record(value);
  assert(Buffer.byteLength(JSON.stringify(item), 'utf8') <= 4096, 'CDP frame value exceeded bound');
  return item;
}

function stringField(value: unknown, max: number): value is string {
  return typeof value === 'string' && value.length > 0 && value.length <= max;
}

function nullableDiagnosticString(value: unknown, max: number): boolean {
  return value === null || (typeof value === 'string' && value.length <= max);
}

function validateMedia(value: unknown, target: FrameTraceTarget): FrameMedia {
  const item = boundedFrameValue(value);
  assert(stringField(item.generatedFilename, 256), 'Frame filename is missing');
  const source =
    (item.downloadSource as { url?: unknown } | null)?.url ?? item.originalUrl ?? item.url;
  const selectedOriginal =
    'kind' in target
      ? target.kind === 'held-fixture' &&
        target.originalUrl ===
          `https://pbs.twimg.com/media/${MEDIA_COHORTS.held[0]}.jpg?format=jpg&name=orig` &&
        source === target.originalUrl
      : isLiveFilenameOriginal(source, target);
  assert(selectedOriginal, 'Frame media is not the selected original');
  const gm = record(item.gm);
  const frameGlobal = record(item.frameGlobal);
  assert(nullableDiagnosticString(gm.scriptName, 80));
  assert(nullableDiagnosticString(gm.handler, 80));
  assert(
    gm.grants === null ||
      (Array.isArray(gm.grants) &&
        gm.grants.length <= 24 &&
        gm.grants.every((grant) => typeof grant === 'string' && grant.length <= 80))
  );
  assert(nullableDiagnosticString(frameGlobal.scriptName, 80));
  return item as FrameMedia;
}

function validateGmCall(value: unknown, media: FrameMedia, target: FrameTraceTarget): FrameGmCall {
  const item = boundedFrameValue(value);
  const args = record(item.args);
  const source = media.downloadSource?.url ?? media.originalUrl ?? media.url;
  assert(item.apiName === 'GM.download' || item.apiName === 'GM_download');
  assert.equal(args.url, source, 'GM frame URL differs from selected original');
  assert.equal(args.name, media.generatedFilename, 'GM frame name differs from product filename');
  assert.equal(args.saveAs, false);
  assert(Number.isSafeInteger(args.timeout) && Number(args.timeout) > 0);
  assert.equal(
    item.downloadFunctionType,
    'function',
    'GM call frame download function unavailable'
  );
  assert(['undefined', 'object', 'function'].includes(String(item.returnType)));
  assert(['undefined', 'function'].includes(String(item.abortType)));
  assert(['undefined', 'function'].includes(String(item.thenType)));
  if ('kind' in target) {
    assert.equal(item.apiName, 'GM.download', 'Held fixture did not use GM.download');
    assert.equal(item.abortType, 'function', 'Held GM.download returned no abort handle');
  }
  return item as FrameGmCall;
}

export function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  return Promise.race([
    promise.finally(() => clearTimeout(timer)),
    new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error(`${label} timed out`)), ms);
    }),
  ]);
}

/** Locate the first executable statement in the unminified installed GM onload callback. */
export function resolveUserscriptApiOnloadLine(source: string): {
  lineNumber: number;
  columnNumber: 0;
} {
  const lines = source.split(/\r?\n/u);
  const sites = lines.flatMap((line, index) =>
    /\bgmDetails\.onload = \(response\) => \{$/u.test(line.trim()) ? [index] : []
  );
  assert.equal(sites.length, 1, 'Installed GM API onload callback is not unique');
  const site = sites[0]!;
  assert.equal(lines[site + 1]?.trim(), 'try {', 'Installed GM callback changed');
  assert.equal(
    lines[site + 2]?.trim(),
    'if (resourceLimitExceeded) return;',
    'Installed GM callback first statement changed'
  );
  return { lineNumber: site + 2, columnNumber: 0 };
}

export type UserscriptApiResponse = {
  url: string;
  finalUrl: string;
  status: number;
  bodyText: string;
};

type ApiTraceSnapshot = {
  breakpoint: { breakpointId: string; scriptId: string; lineNumber: number } | null;
  pauseCount: number;
  captureJobs: number;
  responses: Array<{ requestedId: string; status: number; bytes: number; sha256: string }>;
  errors: string[];
  debuggerDisabled: boolean;
  debuggerDetached: boolean;
};

function exactApiUrl(value: unknown, requestedId: string): value is string {
  if (typeof value !== 'string' || value.length > 4096) {
    return false;
  }
  try {
    const url = new URL(value);
    if (
      url.protocol !== 'https:' ||
      url.host !== 'x.com' ||
      url.username !== '' ||
      url.password !== '' ||
      url.hash !== '' ||
      !/^\/i\/api\/graphql\/[^/]+\/TweetResultByRestId$/u.test(url.pathname)
    ) {
      return false;
    }
    const variables: unknown = JSON.parse(url.searchParams.get('variables') ?? '{}');
    return (
      variables !== null &&
      typeof variables === 'object' &&
      !Array.isArray(variables) &&
      'tweetId' in variables &&
      variables.tweetId === requestedId
    );
  } catch {
    return false;
  }
}

/** The condition excludes every binary GM callback before a CDP pause is dispatched. */
function apiOnloadCondition(requestedId: string): string {
  return `(() => {
    try {
      if (details.method !== 'GET' || details.responseType !== 'json' ||
          typeof details.url !== 'string' || details.url.length > 4096) return false;
      const url = new URL(details.url);
      if (url.protocol !== 'https:' || url.host !== 'x.com' || url.username || url.password || url.hash ||
          !/^\\/i\\/api\\/graphql\\/[^/]+\\/TweetResultByRestId$/.test(url.pathname)) return false;
      const variables = JSON.parse(url.searchParams.get('variables') || '{}');
      return variables && typeof variables === 'object' && !Array.isArray(variables) &&
        variables.tweetId === '${requestedId}';
    } catch { return false; }
  })()`;
}

// Returned body text is ephemeral: callers must not copy it into a persisted receipt.
const API_ONLOAD_FRAME_EXPRESSION = `(() => {
  try {
    if (details.method !== 'GET' || details.responseType !== 'json' ||
        typeof details.url !== 'string' || details.url.length > 4096 ||
        typeof response.finalUrl !== 'string' || response.finalUrl !== details.url ||
        !Number.isInteger(response.status) || response.status < 100 || response.status > 599)
      return { error: 'metadata' };
    const value = response.response;
    let bodyText;
    let bodyBytes;
    let arrayBufferBytes;
    try {
      const byteLength = Object.getOwnPropertyDescriptor(ArrayBuffer.prototype, 'byteLength')?.get;
      if (typeof byteLength === 'function') arrayBufferBytes = Reflect.apply(byteLength, value, []);
    } catch { /* A shape or proxy without ArrayBuffer's internal slot is not a buffer. */ }
    if (arrayBufferBytes !== undefined) {
      bodyBytes = arrayBufferBytes;
      if (bodyBytes > 2000000) return { error: 'oversize' };
      bodyText = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(value);
    } else if (typeof value === 'string') {
      if (value.length > 2000000) return { error: 'oversize' };
      bodyBytes = new TextEncoder().encode(value).byteLength;
      if (bodyBytes > 2000000) return { error: 'oversize' };
      bodyText = value;
    } else return { error: 'body-type' };
    return { url: details.url, finalUrl: response.finalUrl, status: response.status,
      bodyText, bodyBytes };
  } catch { return { error: 'decode' }; }
})()`;

/** Observe only exact-owner installed GM API onload responses in one owned CDP session. */
export function createInstalledUserscriptApiTrace(options: {
  session: TraceSession;
  scriptId: string;
  responseLine: number;
  requestedId: string;
  onResponse: (response: UserscriptApiResponse) => void | Promise<void>;
}) {
  const { session, scriptId, responseLine, requestedId, onResponse } = options;
  assert(/^\d{1,40}$/u.test(requestedId), 'Installed API trace owner is invalid');
  assert(stringField(scriptId, 128) && Number.isSafeInteger(responseLine) && responseLine >= 0);
  let breakpoint: ApiTraceSnapshot['breakpoint'] = null;
  let pauseCount = 0;
  let captureJobs = 0;
  let pending: Promise<void> = Promise.resolve();
  let emergency: Promise<void> | null = null;
  let listening = false;
  let stopping = false;
  let stopped = false;
  let debuggerDisabled = false;
  let debuggerDetached = false;
  const responses: ApiTraceSnapshot['responses'] = [];
  const errors: string[] = [];
  const fail = (code: string) => {
    if (errors.length < 4) {
      errors.push(code);
    }
  };
  const send = (method: string, params?: Record<string, unknown>) =>
    withTimeout(session.send(method, params), 4000, method);
  const quiesce = (resume: boolean) => {
    if (emergency || debuggerDisabled || debuggerDetached) {
      return;
    }
    emergency = (async () => {
      try {
        await send('Debugger.setSkipAllPauses', { skip: true });
      } catch {
        fail('skip-failed');
      }
      if (resume) {
        try {
          await send('Debugger.resume');
        } catch {
          fail('resume-failed');
        }
      }
      try {
        await send('Debugger.disable');
        debuggerDisabled = true;
      } catch {
        fail('disable-failed');
        try {
          await withTimeout(session.detach(), 4000, 'API trace emergency detach');
          debuggerDetached = true;
        } catch {
          fail('detach-failed');
        }
      }
    })();
  };
  const capture = async (raw: unknown) => {
    try {
      assert(errors.length === 0 && !stopped, 'API trace is no longer active');
      const event = record(raw);
      const frames = event.callFrames;
      const frame = Array.isArray(frames) && frames.length ? record(frames[0]) : null;
      const location = frame ? record(frame.location) : null;
      assert(breakpoint && frame && location, 'API pause frame is missing');
      assert(
        Array.isArray(event.hitBreakpoints) &&
          event.hitBreakpoints.length === 1 &&
          event.hitBreakpoints[0] === breakpoint.breakpointId,
        'Unexpected API breakpoint'
      );
      assert(
        location.scriptId === scriptId && location.lineNumber === responseLine,
        'API pause source changed'
      );
      assert(stringField(frame.callFrameId, 128), 'API pause frame ID is missing');
      const evaluated = record(
        await send('Debugger.evaluateOnCallFrame', {
          callFrameId: frame.callFrameId,
          expression: API_ONLOAD_FRAME_EXPRESSION,
          returnByValue: true,
        })
      );
      assert(!evaluated.exceptionDetails, 'API frame evaluation failed');
      const result = record(record(evaluated.result).value);
      assert(!result.error, 'API frame response is invalid');
      assert(exactApiUrl(result.url, requestedId), 'API frame owner or URL changed');
      assert(result.finalUrl === result.url, 'API frame redirect changed source');
      assert(
        Number.isInteger(result.status) &&
          Number(result.status) >= 100 &&
          Number(result.status) <= 599,
        'API frame status is invalid'
      );
      assert(typeof result.bodyText === 'string', 'API frame body is invalid');
      const bytes = Buffer.byteLength(result.bodyText, 'utf8');
      assert(
        bytes <= 2_000_000 && bytes === result.bodyBytes,
        'API frame body exceeds bound or differs from source'
      );
      await withTimeout(
        Promise.resolve(
          onResponse({
            url: result.url,
            finalUrl: result.finalUrl as string,
            status: result.status as number,
            bodyText: result.bodyText,
          })
        ),
        4000,
        'API trace callback'
      );
      responses.push({
        requestedId,
        status: result.status as number,
        bytes,
        sha256: createHash('sha256').update(result.bodyText, 'utf8').digest('hex'),
      });
    } catch {
      fail('capture-failed');
    } finally {
      let resumed = false;
      try {
        await send('Debugger.resume');
        resumed = true;
      } catch {
        fail('resume-failed');
      }
      if (!resumed || errors.length) {
        quiesce(!resumed);
      }
    }
  };
  const onPaused = (event: unknown) => {
    pauseCount = Math.min(pauseCount + 1, 13);
    if (stopping || stopped || errors.length || pauseCount > 12) {
      fail('unexpected-or-excess-pause');
      quiesce(true);
      return;
    }
    try {
      const hit = record(event).hitBreakpoints;
      assert(
        breakpoint && Array.isArray(hit) && hit.length === 1 && hit[0] === breakpoint.breakpointId,
        'Unexpected API pause'
      );
    } catch {
      fail('unexpected-pause');
      quiesce(true);
      return;
    }
    captureJobs++;
    pending = pending.then(() => capture(event));
  };
  return {
    async arm() {
      assert(!listening && !stopped && !stopping);
      session.on('Debugger.paused', onPaused);
      listening = true;
      try {
        const response = record(
          await send('Debugger.setBreakpoint', {
            location: { scriptId, lineNumber: responseLine, columnNumber: 0 },
            condition: apiOnloadCondition(requestedId),
          })
        );
        assert(stringField(response.breakpointId, 128), 'API breakpoint ID is missing');
        const actual = record(response.actualLocation);
        breakpoint = { breakpointId: response.breakpointId, scriptId, lineNumber: responseLine };
        assert(
          actual.scriptId === scriptId && actual.lineNumber === responseLine,
          'API breakpoint source changed'
        );
      } catch {
        fail('arm-failed');
        throw new Error('Installed API trace arm failed');
      }
    },
    snapshot(): ApiTraceSnapshot {
      return {
        breakpoint: breakpoint ? { ...breakpoint } : null,
        pauseCount,
        captureJobs,
        responses: responses.map((item) => ({ ...item })),
        errors: [...errors],
        debuggerDisabled,
        debuggerDetached,
      };
    },
    async stop() {
      if (stopped) {
        return this.snapshot();
      }
      stopping = true;
      try {
        await withTimeout(pending, 20_000, 'API trace pause drain');
      } catch {
        fail('drain-failed');
        quiesce(true);
      }
      if (emergency) {
        await emergency;
      }
      if (!debuggerDisabled && !debuggerDetached && breakpoint) {
        try {
          await send('Debugger.removeBreakpoint', { breakpointId: breakpoint.breakpointId });
        } catch {
          fail('remove-failed');
        }
      }
      if (emergency) {
        await emergency;
      }
      if (!debuggerDisabled && !debuggerDetached) {
        try {
          await send('Debugger.disable');
          debuggerDisabled = true;
        } catch {
          fail('disable-failed');
          try {
            await withTimeout(session.detach(), 4000, 'API trace detach');
            debuggerDetached = true;
          } catch {
            fail('detach-failed');
          }
        }
      }
      if (emergency) {
        await emergency;
      }
      if (listening && (debuggerDisabled || debuggerDetached)) {
        session.off('Debugger.paused', onPaused);
        listening = false;
      }
      stopped = true;
      assert(
        errors.length === 0 && debuggerDisabled && breakpoint !== null,
        `Installed API trace teardown: ${errors.join('; ')}`
      );
      return this.snapshot();
    },
  };
}

export function createInstalledUserscriptFrameTrace(options: {
  session: TraceSession;
  scriptId: string;
  filenameLine: number;
  gmCallLine: number;
  gmCallKind: 'shared' | 'older-modern';
  gmCallerLines?: { modern: number; legacy: number } | null;
  target: FrameTraceTarget;
}): InstalledUserscriptFrameTrace {
  const { session, scriptId, filenameLine, gmCallLine, gmCallKind, gmCallerLines, target } =
    options;
  const breakpoints: Breakpoint[] = [];
  const pauses: Pause[] = [];
  const errors: string[] = [];
  const evaluatedObservations: FrameTraceSnapshot['evaluatedObservations'] = [];
  let media: FrameMedia | null = null;
  let gmCall: FrameGmCall | null = null;
  let pauseCount = 0;
  let captureJobs = 0;
  let pending: Promise<void> = Promise.resolve();
  let emergency: Promise<void> | null = null;
  let listening = false;
  let stopping = false;
  let stopped = false;
  let debuggerDisabled = false;
  let debuggerDetached = false;
  let stopResult: {
    removed: boolean;
    debuggerDisabled: boolean;
    debuggerDetached: boolean;
    errors: string[];
  } | null = null;
  const queuedKinds = new Set<'filename' | 'gm'>();

  const send = (method: string, params?: Record<string, unknown>) =>
    withTimeout(session.send(method, params), 4000, method);
  const fail = (error: unknown) => {
    if (errors.length < 4) {
      errors.push(error instanceof Error ? error.message.slice(0, 160) : 'unknown');
    }
  };
  // Diagnostic only: retain evaluated frame values even when semantic validation rejects them.
  const noteEvaluated = (kind: 'filename' | 'gm', value: unknown) => {
    if (evaluatedObservations.length >= 2) {
      return;
    }
    try {
      const encoded = JSON.stringify({ kind, status: 'captured', value });
      if (typeof encoded !== 'string') {
        evaluatedObservations.push({ kind, status: 'unserializable' });
        return;
      }
      const bytes = Buffer.byteLength(encoded, 'utf8');
      if (bytes > 4096) {
        evaluatedObservations.push({
          kind,
          status: 'over-limit',
          serializedBytes: Math.min(bytes, 1_000_000),
        });
        return;
      }
      evaluatedObservations.push(JSON.parse(encoded));
    } catch {
      evaluatedObservations.push({ kind, status: 'unserializable' });
    }
  };
  let terminal = false;
  const fatal = (error: unknown) => {
    terminal = true;
    fail(error);
  };
  const emergencyDisable = (resumeNeeded: boolean) => {
    if (emergency || debuggerDisabled || debuggerDetached) {
      return;
    }
    emergency = (async () => {
      try {
        await send('Debugger.setSkipAllPauses', { skip: true });
      } catch (error) {
        fail(error);
      }
      if (resumeNeeded) {
        try {
          await send('Debugger.resume');
        } catch (error) {
          fail(error);
        }
      }
      try {
        await send('Debugger.disable');
        debuggerDisabled = true;
      } catch (error) {
        fail(error);
        try {
          await withTimeout(session.detach(), 4000, 'CDP emergency detach');
          debuggerDetached = true;
        } catch (detachError) {
          fail(detachError);
        }
      }
    })();
  };
  const processPause = async (raw: unknown) => {
    try {
      const event = record(raw);
      const hit = event.hitBreakpoints;
      const frames = event.callFrames;
      const top = Array.isArray(frames) ? record(frames[0]) : null;
      const location = top ? record(top.location) : null;
      const frameId = top?.callFrameId;
      const kind =
        Array.isArray(hit) && hit.length === 1
          ? (breakpoints.find((point) => point.breakpointId === hit[0])?.kind ?? null)
          : null;
      if (pauses.length < 4) {
        pauses.push({
          reason: typeof event.reason === 'string' ? event.reason.slice(0, 40) : null,
          hitBreakpoints: Array.isArray(hit)
            ? hit.slice(0, 4).filter((id) => typeof id === 'string')
            : [],
          scriptId: typeof location?.scriptId === 'string' ? location.scriptId : null,
          lineNumber: typeof location?.lineNumber === 'number' ? location.lineNumber : null,
          kind,
        });
      }
      assert(!terminal && !stopping && !stopped, 'Unexpected pause during trace teardown');
      assert(kind, 'Unexpected CDP pause or breakpoint ID');
      const point = breakpoints.find((item) => item.kind === kind);
      assert(point && location && frameId && typeof frameId === 'string');
      assert.equal(location.scriptId, scriptId, 'Paused script differs');
      assert.equal(location.lineNumber, point.actualLocation.lineNumber, 'Paused line differs');
      assert.equal(point.actualLocation.scriptId, scriptId);
      assert(kind !== 'filename' || !media, 'Filename breakpoint hit more than once');
      assert(kind !== 'gm' || !gmCall, 'GM breakpoint hit more than once');
      const expression =
        kind === 'filename'
          ? LIVE_FILENAME_FRAME_EXPRESSION
          : gmCallKind === 'older-modern'
            ? LIVE_OLD_GM_FRAME_EXPRESSION
            : LIVE_SHARED_GM_FRAME_EXPRESSION;
      const evaluated = record(
        await send('Debugger.evaluateOnCallFrame', {
          callFrameId: frameId,
          expression,
          returnByValue: true,
        })
      );
      assert(!evaluated.exceptionDetails, 'CDP call-frame expression threw');
      const result = record(evaluated.result);
      assert(Object.hasOwn(result, 'value'), 'CDP call-frame value missing');
      noteEvaluated(kind, result.value);
      if (kind === 'filename') {
        media = validateMedia(result.value, target);
      } else {
        assert(media, 'GM call preceded selected media');
        const call = validateGmCall(result.value, media, target);
        const callerLine =
          call.apiName === 'GM.download' ? gmCallerLines?.modern : gmCallerLines?.legacy;
        const callers =
          Number.isSafeInteger(callerLine) && Array.isArray(frames)
            ? frames.slice(1, 8).filter((candidate) => {
                if (!candidate || typeof candidate !== 'object') {
                  return false;
                }
                const frame = candidate as Record<string, unknown>;
                if (!frame.location || typeof frame.location !== 'object') {
                  return false;
                }
                const at = frame.location as Record<string, unknown>;
                return at.scriptId === scriptId && at.lineNumber === callerLine;
              })
            : [];
        const caller = callers.length === 1 ? callers[0] : null;
        call.callerCapability = { status: 'unknown', modernType: null, legacyType: null };
        if (caller) {
          try {
            const callerFrame = record(caller);
            assert(stringField(callerFrame.callFrameId, 128));
            const probe = record(
              await send('Debugger.evaluateOnCallFrame', {
                callFrameId: callerFrame.callFrameId,
                expression: LIVE_GM_CALLER_FRAME_EXPRESSION,
                returnByValue: true,
              })
            );
            assert(!probe.exceptionDetails);
            const result = record(record(probe.result).value);
            const modernType = result.modernType;
            const legacyType = result.legacyType;
            if (
              ['function', 'undefined'].includes(String(modernType)) &&
              ['function', 'undefined'].includes(String(legacyType)) &&
              (call.apiName === 'GM.download'
                ? modernType === 'function'
                : legacyType === 'function')
            ) {
              call.callerCapability = {
                status: 'captured',
                modernType: modernType as string,
                legacyType: legacyType as string,
              };
            }
          } catch {
            // An optimized or unavailable caller frame is diagnostic unknown.
          }
        }
        gmCall = call;
      }
    } catch (error) {
      fatal(error);
    } finally {
      let resumed = false;
      try {
        await send('Debugger.resume');
        resumed = true;
      } catch (error) {
        fatal(error);
      }
      if (terminal) {
        emergencyDisable(!resumed);
      }
    }
  };
  const recordUnexpectedPause = (raw: unknown) => {
    if (pauses.length >= 4) {
      return;
    }
    try {
      const event = record(raw);
      const frames = event.callFrames;
      const top = Array.isArray(frames) && frames.length ? record(frames[0]) : null;
      const location =
        top?.location && typeof top.location === 'object' ? record(top.location) : null;
      pauses.push({
        reason: typeof event.reason === 'string' ? event.reason.slice(0, 40) : null,
        hitBreakpoints: Array.isArray(event.hitBreakpoints)
          ? event.hitBreakpoints.slice(0, 4).filter((id) => typeof id === 'string')
          : [],
        scriptId: typeof location?.scriptId === 'string' ? location.scriptId : null,
        lineNumber: typeof location?.lineNumber === 'number' ? location.lineNumber : null,
        kind: null,
      });
    } catch {
      pauses.push({
        reason: null,
        hitBreakpoints: [],
        scriptId: null,
        lineNumber: null,
        kind: null,
      });
    }
  };
  const onPaused = (event: unknown) => {
    pauseCount = Math.min(pauseCount + 1, 5);
    if (terminal || stopping || stopped || pauseCount > 2) {
      recordUnexpectedPause(event);
      fatal(new Error('Unexpected or excess CDP pause'));
      emergencyDisable(true);
      return;
    }
    let kind: 'filename' | 'gm' | null = null;
    try {
      const hit = record(event).hitBreakpoints;
      if (Array.isArray(hit) && hit.length === 1) {
        kind = breakpoints.find((point) => point.breakpointId === hit[0])?.kind ?? null;
      }
    } catch {
      // The bounded receipt records malformed events below.
    }
    if (!kind || queuedKinds.has(kind)) {
      recordUnexpectedPause(event);
      fatal(new Error('Unexpected or duplicate CDP breakpoint'));
      emergencyDisable(true);
      return;
    }
    queuedKinds.add(kind);
    captureJobs++;
    pending = pending.then(() => processPause(event));
  };
  const assertHealthy = () =>
    assert.equal(errors.length, 0, `Installed frame trace: ${errors.join('; ')}`);
  const waitFor = async (kind: 'filename' | 'gm', timeoutMs = 10_000) => {
    const until = Date.now() + timeoutMs;
    while (Date.now() < until) {
      await pending;
      assertHealthy();
      const value = kind === 'filename' ? media : gmCall;
      if (value) {
        return value;
      }
      await new Promise((resolve) => setTimeout(resolve, 25));
    }
    assertHealthy();
    throw new Error(`Timed out waiting for ${kind} call-frame capture`);
  };
  const drainEmergency = async () => {
    if (!emergency) {
      return;
    }
    try {
      await withTimeout(emergency, 20_000, 'CDP emergency cleanup');
    } catch (error) {
      fail(error);
    }
  };
  return {
    async arm() {
      assert(!listening && !stopped);
      session.on('Debugger.paused', onPaused);
      listening = true;
      for (const [kind, lineNumber] of [
        ['filename', filenameLine],
        ['gm', gmCallLine],
      ] as const) {
        const response = record(
          await send('Debugger.setBreakpoint', { location: { scriptId, lineNumber } })
        );
        assert(stringField(response.breakpointId, 128), 'CDP breakpoint ID missing');
        const actualLocation = record(response.actualLocation);
        breakpoints.push({
          breakpointId: response.breakpointId,
          actualLocation: actualLocation as Location,
          kind,
        });
        assert.equal(actualLocation.scriptId, scriptId, 'Breakpoint bound to other script');
        assert.equal(actualLocation.lineNumber, lineNumber, 'Breakpoint resolved to other line');
      }
      assertHealthy();
    },
    waitForMedia: async (): Promise<FrameMedia> => (await waitFor('filename')) as FrameMedia,
    waitForGmCall: async (): Promise<FrameGmCall> => (await waitFor('gm')) as FrameGmCall,
    snapshot: () => ({
      breakpoints: breakpoints.map((item) => ({ ...item })),
      pauses: pauses.map((item) => ({ ...item })),
      pauseCount,
      captureJobs,
      media,
      gmCall,
      evaluatedObservations: evaluatedObservations.map((item) => ({ ...item })),
      errors: [...errors],
      debuggerDisabled,
      debuggerDetached,
    }),
    async stop() {
      if (stopped) {
        return stopResult!;
      }
      stopping = true;
      try {
        await withTimeout(pending, 20_000, 'CDP pause drain');
      } catch (error) {
        fail(error);
        try {
          await send('Debugger.resume');
        } catch (resumeError) {
          fail(resumeError);
        }
      }
      await drainEmergency();
      if (!debuggerDisabled && !debuggerDetached) {
        for (const point of breakpoints) {
          try {
            await send('Debugger.removeBreakpoint', { breakpointId: point.breakpointId });
          } catch (error) {
            fail(error);
          }
        }
      }
      try {
        await withTimeout(pending, 20_000, 'CDP post-removal pause drain');
      } catch (error) {
        fail(error);
      }
      if (!debuggerDisabled && !debuggerDetached) {
        try {
          await send('Debugger.disable');
          debuggerDisabled = true;
        } catch (error) {
          fail(error);
          try {
            await withTimeout(session.detach(), 4000, 'CDP teardown detach');
            debuggerDetached = true;
          } catch (detachError) {
            fail(detachError);
          }
        }
      }
      await drainEmergency();
      if (listening && (debuggerDisabled || debuggerDetached)) {
        session.off('Debugger.paused', onPaused);
        listening = false;
      }
      try {
        await withTimeout(pending, 20_000, 'CDP final pause drain');
      } catch (error) {
        fail(error);
      }
      stopped = true;
      stopResult = {
        removed: breakpoints.length === 2 && errors.length === 0 && debuggerDisabled,
        debuggerDisabled,
        debuggerDetached,
        errors: [...errors],
      };
      assert(
        stopResult.removed && stopResult.debuggerDisabled,
        `Installed frame trace teardown: ${errors.join('; ')}`
      );
      return stopResult;
    },
  };
}
