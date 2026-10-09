// SPDX-License-Identifier: MIT
// Copyright (c) 2026 PiesP
// @vitest-environment node

import { createServer, request as httpRequest } from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it } from 'vitest';

type Fixture = {
  handle(request: IncomingMessage, response: ServerResponse): void;
  setImages(images: Buffer[]): void;
  setPhase(phase: string): void;
  armHeld(): void;
  mark(): number;
  findSince(mark: number, cohort: string, index: number, result: string): unknown;
  activeCount(): number;
  snapshot(): { requests: number; unexpectedCount: number; overflow: boolean;
    servedBytes: number; events: Array<{ cohort: string; index: number; result: string }> };
  destroyActive(): void;
};

const loopback = (await import(pathToFileURL(resolve(import.meta.dirname,
  '../../../validation/windows/userscript-loopback.mjs')).href)) as {
  createUserscriptFixtureHandler(cohorts: Record<string, string[]>, avatarPath: string): Fixture;
  validateFixtureCertificate(value: unknown): unknown;
  generateFixtureCertificate(path: string, run: (...args: unknown[]) => Promise<unknown>): Promise<unknown>;
};

const cohorts = {
  normal: ['GkE1234ABCDEF', 'GkE5678GHIJKL', 'GkE9012MNOPQR'],
  failure: ['GkF1234ABCDEF', 'GkF5678GHIJKL', 'GkF9012MNOPQR'],
  partial: ['GkP1234ABCDEF', 'GkP5678GHIJKL', 'GkP9012MNOPQR'],
  held: ['GkH1234ABCDEF', 'GkH5678GHIJKL', 'GkH9012MNOPQR'],
};
const avatarPath = '/profile_images/123456789/public-avatar.jpg';
const mediaPath = (cohort: keyof typeof cohorts, index: number) =>
  `/media/${cohorts[cohort][index]}.jpg?format=jpg&name=large`;

async function withServer(action: (fixture: Fixture, port: number) => Promise<void>) {
  const fixture = loopback.createUserscriptFixtureHandler(cohorts, avatarPath);
  const server = createServer(fixture.handle);
  await new Promise<void>((resolveListen) => server.listen(0, '127.0.0.1', resolveListen));
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Invalid test listener');
  try { await action(fixture, address.port); }
  finally {
    fixture.destroyActive();
    server.closeAllConnections();
    await new Promise<void>((resolveClose) => server.close(() => resolveClose()));
  }
}

function get(port: number, path: string, options: { host?: string; method?: string;
  destination?: string } = {}) {
  return new Promise<{ status: number; body: Buffer }>((resolveResponse, rejectResponse) => {
    const request = httpRequest({ hostname: '127.0.0.1', port, path,
      method: options.method ?? 'GET', headers: {
        Host: options.host ?? 'pbs.twimg.com',
        ...(options.destination && { 'Sec-Fetch-Dest': options.destination }),
      } }, (response) => {
      const chunks: Buffer[] = [];
      response.on('data', (chunk: Buffer) => chunks.push(chunk));
      response.on('end', () => resolveResponse({ status: response.statusCode ?? 0,
        body: Buffer.concat(chunks) }));
    });
    request.once('error', rejectResponse);
    request.end();
  });
}

async function waitFor(read: () => unknown) {
  for (let i = 0; i < 100; i++) {
    const value = read();
    if (value) return value;
    await new Promise((resolveWait) => setTimeout(resolveWait, 10));
  }
  throw new Error('Timed out waiting for fixture event');
}

describe('userscript HTTPS loopback protocol', () => {
  it('serves only declared GETs and records a real post-click 503', async () => {
    await withServer(async (fixture, port) => {
      fixture.setImages([Buffer.from('first'), Buffer.from('second'), Buffer.from('third')]);
      const normal = await get(port, mediaPath('normal', 0));
      expect(normal).toEqual({ status: 200, body: Buffer.from('first') });
      expect((await get(port, `${mediaPath('normal', 0)}&unexpected=1`)).status).toBe(404);
      expect((await get(port, mediaPath('normal', 0), { host: 'other.example' })).status).toBe(404);
      expect((await get(port, mediaPath('normal', 0), { method: 'POST' })).status).toBe(404);
      fixture.setPhase('failure');
      const before = fixture.mark();
      expect((await get(port, mediaPath('failure', 0))).status).toBe(503);
      expect(fixture.findSince(before, 'failure', 0, 'http-503')).toMatchObject({
        phase: 'failure', cohort: 'failure', index: 0, bytes: 0 });
      expect(fixture.snapshot()).toMatchObject({ requests: 5, unexpectedCount: 3,
        overflow: false, servedBytes: 5, activeCount: 0 });
    });
  });

  it('holds only an armed download and observes its socket closure before phase change', async () => {
    await withServer(async (fixture, port) => {
      fixture.setImages([Buffer.from('first'), Buffer.from('second'), Buffer.from('third')]);
      fixture.setPhase('held');
      const previewStart = fixture.mark();
      expect((await get(port, mediaPath('held', 0), { destination: 'image' })).status).toBe(200);
      expect(fixture.findSince(previewStart, 'held', 0, 'served')).toBeUndefined();
      fixture.armHeld();
      const before = fixture.mark();
      const request = httpRequest({ hostname: '127.0.0.1', port, path: mediaPath('held', 0),
        headers: { Host: 'pbs.twimg.com', 'Sec-Fetch-Dest': 'empty' } });
      request.on('error', () => {});
      request.end();
      await waitFor(() => fixture.findSince(before, 'held', 0, 'started'));
      expect(fixture.activeCount()).toBe(1);
      expect(() => fixture.setPhase('normal')).toThrow('active transport');
      request.destroy();
      await waitFor(() => fixture.findSince(before, 'held', 0, 'aborted'));
      expect(fixture.activeCount()).toBe(0);
      fixture.setPhase('normal');
    });
  });

  it('reserves the aggregate byte cap before writing and never exposes certificate output', async () => {
    await withServer(async (fixture, port) => {
      fixture.setImages(Array.from({ length: 3 }, () => Buffer.alloc(64 * 1024, 1)));
      for (let i = 0; i < 32; i++) {
        expect((await get(port, mediaPath('normal', 0))).status).toBe(200);
      }
      await expect(get(port, mediaPath('normal', 0))).rejects.toThrow();
      expect(fixture.snapshot()).toMatchObject({ overflow: true, servedBytes: 2 * 1024 * 1024 });
    });
    expect(() => loopback.validateFixtureCertificate({ private: 'secret' }))
      .toThrow('fixture-certificate-invalid');
    await expect(loopback.generateFixtureCertificate('/trusted/helper.ps1',
      async () => { throw new Error('secret child output'); }))
      .rejects.toThrow(/^fixture-certificate-unavailable$/u);
  });
});
