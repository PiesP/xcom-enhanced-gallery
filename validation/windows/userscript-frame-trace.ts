// SPDX-License-Identifier: MIT
// Copyright (c) 2026 PiesP

import assert from 'node:assert/strict';
import type { LiveFilenameTarget } from './live-filename-target.ts';
import { isLiveFilenameOriginal } from './live-filename-target.ts';

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
    legacyDownloadType: string;
    modernDownloadType: string;
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
    legacyDownloadType: string;
    modernDownloadType: string;
  };
};
export type FrameGmCall = {
  apiName: string;
  args: { url: string; name: string; saveAs: false; timeout: number };
  returnType: string;
  abortType: string;
  thenType: string;
};

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
      modernDownloadType: typeof GM === 'object' ? typeof GM.download : 'undefined',
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
  returnType: typeof handle, abortType: typeof handle?.abort, thenType: typeof handle?.then
}))()`;
export const LIVE_SHARED_GM_FRAME_EXPRESSION = GM_FRAME_BODY.replace(
  'API_NAME',
  "typeof apiName === 'string' ? apiName.slice(0, 32) : null"
);
export const LIVE_OLD_GM_FRAME_EXPRESSION = GM_FRAME_BODY.replace('API_NAME', "'GM.download'");

function record(value: unknown): Record<string, unknown> {
  assert(value && typeof value === 'object' && !Array.isArray(value), 'CDP value is not an object');
  return value as Record<string, unknown>;
}

function boundedFrameValue(value: unknown): Record<string, unknown> {
  const item = record(value);
  assert(JSON.stringify(item).length <= 4096, 'CDP frame value exceeded bound');
  return item;
}

function stringField(value: unknown, max: number): value is string {
  return typeof value === 'string' && value.length > 0 && value.length <= max;
}

function validateMedia(value: unknown, target: LiveFilenameTarget): FrameMedia {
  const item = boundedFrameValue(value);
  assert(stringField(item.generatedFilename, 256), 'Frame filename is missing');
  const source =
    (item.downloadSource as { url?: unknown } | null)?.url ?? item.originalUrl ?? item.url;
  assert(isLiveFilenameOriginal(source, target), 'Frame media is not the selected original');
  const gm = record(item.gm);
  const frameGlobal = record(item.frameGlobal);
  assert(
    gm.scriptName === 'X.com Enhanced Gallery' &&
      typeof gm.legacyDownloadType === 'string' &&
      typeof gm.modernDownloadType === 'string' &&
      Array.isArray(gm.grants) &&
      gm.grants.length <= 24 &&
      gm.grants.every((grant) => typeof grant === 'string' && grant.length <= 80),
    'Frame GM identity is incomplete'
  );
  assert(
    typeof frameGlobal.legacyDownloadType === 'string' &&
      typeof frameGlobal.modernDownloadType === 'string',
    'Frame global capability types are missing'
  );
  return item as FrameMedia;
}

function validateGmCall(value: unknown, media: FrameMedia): FrameGmCall {
  const item = boundedFrameValue(value);
  const args = record(item.args);
  const source = media.downloadSource?.url ?? media.originalUrl ?? media.url;
  assert(item.apiName === 'GM.download' || item.apiName === 'GM_download');
  assert.equal(args.url, source, 'GM frame URL differs from selected original');
  assert.equal(args.name, media.generatedFilename, 'GM frame name differs from product filename');
  assert.equal(args.saveAs, false);
  assert(Number.isSafeInteger(args.timeout) && Number(args.timeout) > 0);
  assert(['undefined', 'object', 'function'].includes(String(item.returnType)));
  assert(['undefined', 'function'].includes(String(item.abortType)));
  assert(['undefined', 'function'].includes(String(item.thenType)));
  return item as FrameGmCall;
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  return Promise.race([
    promise.finally(() => clearTimeout(timer)),
    new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error(`${label} timed out`)), ms);
    }),
  ]);
}

export function createInstalledUserscriptFrameTrace(options: {
  session: TraceSession;
  scriptId: string;
  filenameLine: number;
  gmCallLine: number;
  gmCallKind: 'shared' | 'older-modern';
  target: LiveFilenameTarget;
}): InstalledUserscriptFrameTrace {
  const { session, scriptId, filenameLine, gmCallLine, gmCallKind, target } = options;
  const breakpoints: Breakpoint[] = [];
  const pauses: Pause[] = [];
  const errors: string[] = [];
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
      if (kind === 'filename') {
        media = validateMedia(result.value, target);
      } else {
        assert(media, 'GM call preceded selected media');
        gmCall = validateGmCall(result.value, media);
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
