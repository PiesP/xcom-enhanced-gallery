// SPDX-License-Identifier: MIT
// Copyright (c) 2026 PiesP

import { EventEmitter } from 'node:events';
import { runInNewContext } from 'node:vm';
import { describe, expect, it } from 'vitest';
import {
  createInstalledUserscriptFrameTrace,
  createPreArmPauseGuard,
  LIVE_FILENAME_FRAME_EXPRESSION,
  LIVE_SHARED_GM_FRAME_EXPRESSION,
} from './userscript-frame-trace.ts';

const target = {
  pageUrl: 'https://x.com/yukurach/status/2118323627615785399',
  mediaBasename: 'HWXMF0bbcAEnfk6',
};
const sourceUrl = 'https://pbs.twimg.com/media/HWXMF0bbcAEnfk6.jpg?format=jpg&name=orig';
const selectedMedia = () => ({
  generatedFilename: 'owner_2118323627615785399_0.jpg',
  id: 'photo-1',
  type: 'photo',
  url: sourceUrl,
  originalUrl: sourceUrl,
  downloadSource: { url: sourceUrl, quality: 'verified-original', provenance: 'media-api' },
  filename: null,
  tweetUsername: 'owner',
  tweetId: '2118323627615785399',
  quotedUsername: null,
  quotedTweetId: null,
  sourceLocation: 'primary',
  attachmentOrdinal: 0,
  attachmentSourceKey: null,
  gm: {
    legacyDownloadType: 'function',
    modernDownloadType: 'function',
    handler: 'Tampermonkey',
    version: '5.5.1',
    scriptName: 'X.com Enhanced Gallery',
    scriptVersion: '2.3.3',
    grants: ['GM_download'],
    mode: null,
  },
  frameGlobal: {
    scriptName: 'X.com Enhanced Gallery',
    handler: 'Tampermonkey',
    legacyDownloadType: 'function',
    modernDownloadType: 'function',
  },
});
const gmCall = () => ({
  apiName: 'GM.download',
  args: {
    url: sourceUrl,
    name: 'owner_2118323627615785399_0.jpg',
    saveAs: false,
    timeout: 30000,
  },
  downloadFunctionType: 'function',
  returnType: 'object',
  abortType: 'function',
  thenType: 'function',
});

class FakeTraceSession extends EventEmitter {
  calls: Array<{ method: string; params: Record<string, unknown> | undefined }> = [];
  values: Record<string, unknown> = { media: selectedMedia(), gm: gmCall() };
  badActualLine = false;
  async detach(): Promise<void> {
    this.calls.push({ method: 'detach', params: undefined });
    this.removeAllListeners('Debugger.paused');
  }
  async send(method: string, params?: Record<string, unknown>): Promise<unknown> {
    this.calls.push({ method, params });
    if (method === 'Debugger.setBreakpoint') {
      const location = params?.location as { scriptId: string; lineNumber: number };
      return {
        breakpointId: location.lineNumber === 20 ? 'filename-bp' : 'gm-bp',
        actualLocation: {
          ...location,
          lineNumber: this.badActualLine ? location.lineNumber + 1 : location.lineNumber,
        },
      };
    }
    if (method === 'Debugger.evaluateOnCallFrame') {
      return { result: { value: this.values[params?.callFrameId as string] } };
    }
    return {};
  }
  pause(kind: 'media' | 'gm', overrides: Record<string, unknown> = {}) {
    const filename = kind === 'media';
    this.emit('Debugger.paused', {
      reason: 'other',
      hitBreakpoints: [filename ? 'filename-bp' : 'gm-bp'],
      callFrames: [
        {
          callFrameId: kind,
          location: { scriptId: 'installed-script', lineNumber: filename ? 20 : 40 },
        },
      ],
      ...overrides,
    });
  }
}

function create(session: FakeTraceSession, kind: 'shared' | 'older-modern' = 'shared') {
  return createInstalledUserscriptFrameTrace({
    session,
    scriptId: 'installed-script',
    filenameLine: 20,
    gmCallLine: 40,
    gmCallKind: kind,
    target,
  });
}

const heldOriginalUrl = 'https://pbs.twimg.com/media/GkH1234ABCDEF.jpg?format=jpg&name=orig';

function createHeld(session: FakeTraceSession) {
  return createInstalledUserscriptFrameTrace({
    session,
    scriptId: 'installed-script',
    filenameLine: 20,
    gmCallLine: 40,
    gmCallKind: 'shared',
    target: { kind: 'held-fixture', originalUrl: heldOriginalUrl },
  });
}

describe('installed userscript lexical frame trace', () => {
  it('evaluates utility and GM call expressions without assuming global GM_info visibility', () => {
    const media = selectedMedia();
    const value = runInNewContext(LIVE_FILENAME_FRAME_EXPRESSION, {
      filename: media.generatedFilename,
      media,
    }) as { gm: { scriptName: string | null; grants: string[] | null } };
    expect(value.gm).toMatchObject({ scriptName: null, grants: null });
    const call = runInNewContext(LIVE_SHARED_GM_FRAME_EXPRESSION, {
      apiName: 'GM.download',
      gmDownload: () => {},
      url: sourceUrl,
      filename: media.generatedFilename,
      GM_DOWNLOAD_TIMEOUT_MS: 30_000,
      handle: { abort: () => {}, then: () => {} },
    }) as { apiName: string; downloadFunctionType: string; args: { url: string; name: string } };
    expect(call).toMatchObject({
      apiName: 'GM.download',
      downloadFunctionType: 'function',
      args: { url: sourceUrl, name: media.generatedFilename },
    });
  });

  it('guards a pre-arm pause and retains the listener through a delayed handoff', async () => {
    const session = new FakeTraceSession();
    let releaseDisable = () => {};
    const disableGate = new Promise<void>((resolve) => {
      releaseDisable = resolve;
    });
    const originalSend = session.send.bind(session);
    session.send = async (method, params) => {
      if (method === 'Debugger.disable') {
        session.calls.push({ method, params });
        await disableGate;
        return {};
      }
      return originalSend(method, params);
    };
    const guard = createPreArmPauseGuard(session);
    guard.start();
    session.pause('media', { hitBreakpoints: [] });
    const handoff = guard.handoff();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(session.listenerCount('Debugger.paused')).toBe(1);
    session.pause('media', { hitBreakpoints: [] });
    releaseDisable();
    await expect(handoff).rejects.toThrow('Pre-arm debugger pause');
    expect(guard.snapshot()).toMatchObject({ pauseCount: 2, disabled: true });
    expect(session.listenerCount('Debugger.paused')).toBe(0);
  });

  it('detaches the owned CDP session if pre-arm disable fails', async () => {
    const session = new FakeTraceSession();
    const originalSend = session.send.bind(session);
    session.send = async (method, params) => {
      if (method === 'Debugger.disable') {
        session.calls.push({ method, params });
        throw new Error('disable unavailable');
      }
      return originalSend(method, params);
    };
    const guard = createPreArmPauseGuard(session);
    guard.start();
    session.pause('media', { hitBreakpoints: [] });
    await expect(guard.handoff()).rejects.toThrow('Pre-arm debugger pause');
    expect(guard.snapshot()).toMatchObject({ pauseCount: 1, disabled: false, detached: true });
    expect(session.calls.filter((call) => call.method === 'Debugger.resume')).toHaveLength(1);
    expect(session.calls.filter((call) => call.method === 'Debugger.disable')).toHaveLength(1);
    expect(session.calls.filter((call) => call.method === 'detach')).toHaveLength(1);
  });

  it('captures one selected filename and GM call, then removes both breakpoints before repeat', async () => {
    const session = new FakeTraceSession();
    const trace = create(session);
    await trace.arm();
    const setup = session.calls.filter((call) => call.method === 'Debugger.setBreakpoint');
    expect(setup).toHaveLength(2);
    expect(setup.every((call) => !Object.hasOwn(call.params ?? {}, 'condition'))).toBe(true);
    session.pause('media');
    expect((await trace.waitForMedia()).generatedFilename).toBe(gmCall().args.name);
    session.pause('gm');
    expect(await trace.waitForGmCall()).toMatchObject({
      apiName: 'GM.download',
      downloadFunctionType: 'function',
      args: { url: sourceUrl, name: gmCall().args.name },
    });
    const stopped = await trace.stop();
    expect(stopped).toMatchObject({ removed: true, debuggerDisabled: true, errors: [] });
    expect(trace.snapshot()).toMatchObject({
      pauseCount: 2,
      captureJobs: 2,
      errors: [],
      evaluatedObservations: [
        { kind: 'filename', status: 'captured' },
        { kind: 'gm', status: 'captured' },
      ],
    });
    expect(session.calls.filter((call) => call.method === 'Debugger.resume')).toHaveLength(2);
    expect(
      session.calls.filter((call) => call.method === 'Debugger.removeBreakpoint')
    ).toHaveLength(2);
    expect(session.calls.at(-1)?.method).toBe('Debugger.disable');
    expect(session.listenerCount('Debugger.paused')).toBe(0);
  });

  it('binds the held original to one abortable GM.download return', async () => {
    const session = new FakeTraceSession();
    session.values.media = {
      ...selectedMedia(),
      url: heldOriginalUrl,
      originalUrl: heldOriginalUrl,
      downloadSource: {
        url: heldOriginalUrl,
        quality: 'verified-original',
        provenance: 'media-api',
      },
    };
    session.values.gm = { ...gmCall(), args: { ...gmCall().args, url: heldOriginalUrl } };
    const trace = createHeld(session);
    await trace.arm();
    session.pause('media');
    expect((await trace.waitForMedia()).downloadSource?.url).toBe(heldOriginalUrl);
    session.pause('gm');
    expect((await trace.waitForGmCall()).abortType).toBe('function');
    expect((await trace.stop()).removed).toBe(true);
  });

  it('rejects a held source mismatch or a non-abortable GM result', async () => {
    for (const change of ['source', 'abort'] as const) {
      const session = new FakeTraceSession();
      session.values.media = {
        ...selectedMedia(),
        url: heldOriginalUrl,
        originalUrl: heldOriginalUrl,
        downloadSource: {
          url: change === 'source' ? sourceUrl : heldOriginalUrl,
          quality: 'verified-original',
          provenance: 'media-api',
        },
      };
      session.values.gm = {
        ...gmCall(),
        args: { ...gmCall().args, url: heldOriginalUrl },
        abortType: change === 'abort' ? 'undefined' : 'function',
      };
      const trace = createHeld(session);
      await trace.arm();
      session.pause('media');
      if (change === 'source') {
        await expect(trace.waitForMedia()).rejects.toThrow('selected original');
      } else {
        await trace.waitForMedia();
        session.pause('gm');
        await expect(trace.waitForGmCall()).rejects.toThrow('abort handle');
      }
      await expect(trace.stop()).rejects.toThrow('Installed frame trace teardown');
      expect(session.listenerCount('Debugger.paused')).toBe(0);
    }
  });

  it('rejects a changed actual location and still cleans the partially armed breakpoint', async () => {
    const session = new FakeTraceSession();
    session.badActualLine = true;
    const trace = create(session);
    await expect(trace.arm()).rejects.toThrow('Breakpoint resolved to other line');
    await expect(trace.stop()).rejects.toThrow('Installed frame trace teardown');
    expect(session.calls.some((call) => call.method === 'Debugger.removeBreakpoint')).toBe(true);
    expect(session.calls.some((call) => call.method === 'Debugger.disable')).toBe(true);
    expect(session.listenerCount('Debugger.paused')).toBe(0);
  });

  it('rejects call-frame exceptions and disables after resuming the paused script', async () => {
    const session = new FakeTraceSession();
    session.send = async (method, params) => {
      session.calls.push({ method, params });
      if (method === 'Debugger.setBreakpoint') {
        const location = params?.location as { lineNumber: number } | undefined;
        if (!location) {
          throw new Error('Missing fixture breakpoint location');
        }
        return {
          breakpointId: location.lineNumber === 20 ? 'filename-bp' : 'gm-bp',
          actualLocation: location,
        };
      }
      if (method === 'Debugger.evaluateOnCallFrame') {
        return { exceptionDetails: { text: 'ReferenceError' }, result: { value: null } };
      }
      return {};
    };
    const trace = create(session);
    await trace.arm();
    session.pause('media');
    await expect(trace.waitForMedia()).rejects.toThrow('CDP call-frame expression threw');
    await expect(trace.stop()).rejects.toThrow('Installed frame trace teardown');
    expect(session.calls.some((call) => call.method === 'Debugger.resume')).toBe(true);
    expect(session.calls.some((call) => call.method === 'Debugger.disable')).toBe(true);
    expect(session.listenerCount('Debugger.paused')).toBe(0);
  });

  it('bounds unknown pause storms without queuing capture jobs and resumes on the emergency path', async () => {
    const session = new FakeTraceSession();
    const trace = create(session);
    await trace.arm();
    for (let index = 0; index < 100; index++) {
      session.pause('media', { hitBreakpoints: ['foreign-bp'] });
    }
    await expect(trace.waitForMedia()).rejects.toThrow('Unexpected');
    await expect(trace.stop()).rejects.toThrow('Installed frame trace teardown');
    expect(trace.snapshot().captureJobs).toBe(0);
    expect(trace.snapshot().pauseCount).toBe(5);
    expect(trace.snapshot().errors.length).toBeLessThanOrEqual(4);
    expect(session.calls.some((call) => call.method === 'Debugger.resume')).toBe(true);
    expect(session.calls.some((call) => call.method === 'Debugger.disable')).toBe(true);
    expect(session.listenerCount('Debugger.paused')).toBe(0);
  });

  it('detaches the owned CDP session after one failed emergency disable', async () => {
    const session = new FakeTraceSession();
    const originalSend = session.send.bind(session);
    session.send = async (method, params) => {
      if (method === 'Debugger.disable') {
        session.calls.push({ method, params });
        throw new Error('disable unavailable');
      }
      return originalSend(method, params);
    };
    const trace = create(session);
    await trace.arm();
    session.pause('media', { hitBreakpoints: ['foreign-bp'] });
    await expect(trace.waitForMedia()).rejects.toThrow('Unexpected');
    await expect(trace.stop()).rejects.toThrow('Installed frame trace teardown');
    expect(trace.snapshot()).toMatchObject({ debuggerDisabled: false, debuggerDetached: true });
    expect(session.calls.filter((call) => call.method === 'Debugger.resume')).toHaveLength(1);
    expect(session.calls.filter((call) => call.method === 'Debugger.disable')).toHaveLength(1);
    expect(session.calls.filter((call) => call.method === 'detach')).toHaveLength(1);
  });

  it('drains a late emergency during breakpoint removal before completing teardown', async () => {
    const session = new FakeTraceSession();
    const originalSend = session.send.bind(session);
    let releaseEmergencyDisable = () => {};
    const emergencyGate = new Promise<void>((resolve) => {
      releaseEmergencyDisable = resolve;
    });
    let removalInjected = false;
    let disableCalls = 0;
    session.send = async (method, params) => {
      if (method === 'Debugger.removeBreakpoint' && !removalInjected) {
        removalInjected = true;
        session.pause('media', { hitBreakpoints: ['foreign-bp'] });
      }
      if (method === 'Debugger.disable') {
        session.calls.push({ method, params });
        disableCalls++;
        if (disableCalls === 1) {
          await emergencyGate;
        }
        return {};
      }
      return originalSend(method, params);
    };
    const trace = create(session);
    await trace.arm();
    session.pause('media');
    await trace.waitForMedia();
    session.pause('gm');
    await trace.waitForGmCall();
    let finished = false;
    const stopped = trace.stop().finally(() => {
      finished = true;
    });
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(finished).toBe(false);
    releaseEmergencyDisable();
    await expect(stopped).rejects.toThrow('Installed frame trace teardown');
    expect(session.listenerCount('Debugger.paused')).toBe(0);
  });

  it('rejects a different media URL and an invalid GM frame without accepting either capture', async () => {
    const mediaSession = new FakeTraceSession();
    mediaSession.values.media = {
      ...selectedMedia(),
      downloadSource: { url: 'https://other.invalid/a.jpg' },
    };
    const mediaTrace = create(mediaSession);
    await mediaTrace.arm();
    mediaSession.pause('media');
    await expect(mediaTrace.waitForMedia()).rejects.toThrow('selected original');
    expect(mediaTrace.snapshot().evaluatedObservations).toMatchObject([
      { kind: 'filename', status: 'captured', value: { generatedFilename: gmCall().args.name } },
    ]);
    await expect(mediaTrace.stop()).rejects.toThrow();

    const gmSession = new FakeTraceSession();
    gmSession.values.gm = { ...gmCall(), args: { ...gmCall().args, name: 'other.jpg' } };
    const gmTrace = create(gmSession, 'older-modern');
    await gmTrace.arm();
    gmSession.pause('media');
    await gmTrace.waitForMedia();
    gmSession.pause('gm');
    await expect(gmTrace.waitForGmCall()).rejects.toThrow('GM frame name differs');
    expect(gmTrace.snapshot().evaluatedObservations).toHaveLength(2);
    await expect(gmTrace.stop()).rejects.toThrow();

    const wrongUrl = new FakeTraceSession();
    wrongUrl.values.gm = {
      ...gmCall(),
      args: { ...gmCall().args, url: 'https://other.invalid/a.jpg' },
    };
    const urlTrace = create(wrongUrl);
    await urlTrace.arm();
    wrongUrl.pause('media');
    await urlTrace.waitForMedia();
    wrongUrl.pause('gm');
    await expect(urlTrace.waitForGmCall()).rejects.toThrow('GM frame URL differs');
    await expect(urlTrace.stop()).rejects.toThrow();
  });

  it('accepts selected media when GM_info and grants are invisible in its utility frame', async () => {
    const session = new FakeTraceSession();
    session.values.media = {
      ...selectedMedia(),
      gm: {
        legacyDownloadType: 'undefined',
        modernDownloadType: 'undefined',
        handler: null,
        version: null,
        scriptName: null,
        scriptVersion: null,
        grants: null,
        mode: null,
      },
      frameGlobal: {
        scriptName: null,
        handler: null,
        legacyDownloadType: 'undefined',
        modernDownloadType: 'undefined',
      },
    };
    const trace = create(session);
    await trace.arm();
    session.pause('media');
    expect((await trace.waitForMedia()).generatedFilename).toBe(gmCall().args.name);
    session.pause('gm');
    expect((await trace.waitForGmCall()).downloadFunctionType).toBe('function');
    await expect(trace.stop()).resolves.toMatchObject({ removed: true, errors: [] });
  });

  it('retains a visible but mismatched GM_info value as a diagnostic', async () => {
    const session = new FakeTraceSession();
    session.values.media = {
      ...selectedMedia(),
      gm: { ...selectedMedia().gm, scriptName: 'Other script', grants: [] },
    };
    const trace = create(session);
    await trace.arm();
    session.pause('media');
    expect((await trace.waitForMedia()).gm).toMatchObject({
      scriptName: 'Other script',
      grants: [],
    });
    expect(trace.snapshot().evaluatedObservations[0]).toMatchObject({
      kind: 'filename',
      status: 'captured',
      value: { gm: { scriptName: 'Other script', grants: [] } },
    });
    await trace.stop();
  });

  it('probes adapter capabilities only from the exact source-bound caller frame', async () => {
    const session = new FakeTraceSession();
    session.values.caller = { modernType: 'function', legacyType: 'undefined' };
    const trace = createInstalledUserscriptFrameTrace({
      session,
      scriptId: 'installed-script',
      filenameLine: 20,
      gmCallLine: 40,
      gmCallKind: 'shared',
      gmCallerLines: { modern: 50, legacy: 51 },
      target,
    });
    await trace.arm();
    session.pause('media');
    await trace.waitForMedia();
    session.pause('gm', {
      callFrames: [
        { callFrameId: 'gm', location: { scriptId: 'installed-script', lineNumber: 40 } },
        { callFrameId: 'caller', location: { scriptId: 'installed-script', lineNumber: 50 } },
      ],
    });
    expect((await trace.waitForGmCall()).callerCapability).toEqual({
      status: 'captured',
      modernType: 'function',
      legacyType: 'undefined',
    });
    expect(
      session.calls.filter((call) => call.method === 'Debugger.evaluateOnCallFrame')
    ).toHaveLength(3);
    await trace.stop();

    const wrong = new FakeTraceSession();
    const unknown = createInstalledUserscriptFrameTrace({
      session: wrong,
      scriptId: 'installed-script',
      filenameLine: 20,
      gmCallLine: 40,
      gmCallKind: 'shared',
      gmCallerLines: { modern: 50, legacy: 51 },
      target,
    });
    await unknown.arm();
    wrong.pause('media');
    await unknown.waitForMedia();
    wrong.pause('gm', {
      callFrames: [
        { callFrameId: 'gm', location: { scriptId: 'installed-script', lineNumber: 40 } },
        { callFrameId: 'caller', location: { scriptId: 'foreign-script', lineNumber: 50 } },
      ],
    });
    expect((await unknown.waitForGmCall()).callerCapability).toEqual({
      status: 'unknown',
      modernType: null,
      legacyType: null,
    });
    expect(
      wrong.calls.filter((call) => call.method === 'Debugger.evaluateOnCallFrame')
    ).toHaveLength(2);
    await unknown.stop();
  });

  it('keeps failed evaluated observations bounded and rejects a missing GM function', async () => {
    const large = new FakeTraceSession();
    large.values.media = { ...selectedMedia(), generatedFilename: 'x'.repeat(5000) };
    const largeTrace = create(large);
    await largeTrace.arm();
    large.pause('media');
    await expect(largeTrace.waitForMedia()).rejects.toThrow('CDP frame value exceeded bound');
    expect(largeTrace.snapshot().evaluatedObservations).toMatchObject([
      { kind: 'filename', status: 'over-limit' },
    ]);
    await expect(largeTrace.stop()).rejects.toThrow();

    const missing = new FakeTraceSession();
    missing.values.gm = { ...gmCall(), downloadFunctionType: 'undefined' };
    const missingTrace = create(missing);
    await missingTrace.arm();
    missing.pause('media');
    await missingTrace.waitForMedia();
    missing.pause('gm');
    await expect(missingTrace.waitForGmCall()).rejects.toThrow('download function unavailable');
    expect(missingTrace.snapshot().evaluatedObservations).toHaveLength(2);
    await expect(missingTrace.stop()).rejects.toThrow();
  });
});
