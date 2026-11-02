// SPDX-License-Identifier: MIT
// Copyright (c) 2026 PiesP

import assert from 'node:assert/strict';
import { test } from 'vite-plus/test';
import { assessVisitEvidence, isVisitEvidenceV2, type VisitEvidenceV2 } from './qualification-policy.ts';

const finite = (): VisitEvidenceV2['requests'][number] => ({
  occurrenceId: 'occ-1', targetId: 'target-1', sessionId: 'session-1', frameId: 'frame-1',
  relation: 'task-required', class: 'finite', streamContract: 'none',
  requestObservedMs: 1, responseStatus: 200, responseObservedMs: 2,
  terminal: 'finished', terminalObservedMs: 3, failure: 'none',
  deliveredMessageCount: 0, deliveredDataChunkCount: 0, deliveredDataBytes: 0,
  lastTransportObservedMs: null, observerStartMs: 0, observerEndMs: 20_000,
});
const evidence = (): VisitEvidenceV2 => ({
  policyVersion: 2, receiptSchemaVersion: 2, networkChannel: 'page-cdp',
  observationCutoffMs: 20_000,
  recorder: { sealed: true, lostEvents: 0, overflow: 0, incompleteAttribution: 0 },
  api: { supported: true, detachedEarly: false, observerStartMs: 0, observerEndMs: 20_000 },
  requests: [finite()],
  product: { finalUrlExact: true, responseStatus: 200, articleVisible: true,
    extensionAbsent: true, exactMediaReady: true, observationCompleted: true },
  errors: { http: 0, console: 0, page: 0, request: 0 },
  cleanup: { ownedPageClosed: true, originalPagesPreserved: true,
    focusRestored: true, disconnected: true },
  candidate: { state: 'not-run' },
});

test('finite completion qualifies a baseline without claiming candidate functionality', () => {
  const input = evidence();
  assert.equal(isVisitEvidenceV2(input), true);
  const decision = assessVisitEvidence(input);
  assert.deepEqual(Object.values(decision.claims),
    ['pass', 'pass', 'pass', 'pass', 'pass', 'not-run', 'pass']);
  assert.deepEqual(decision.lifecycle, [{ occurrenceId: 'occ-1', state: 'finished' }]);
  assert.equal(decision.baselineQualified, true);
  assert.equal(decision.candidateQualified, false);
});

test('a declared, attributed fetch stream with received data remains ongoing at cutoff', () => {
  const input = evidence();
  input.requests[0] = { ...finite(), class: 'fetch-stream',
    streamContract: 'declared-task-stream', terminal: 'none', terminalObservedMs: null,
    deliveredDataChunkCount: 2, deliveredDataBytes: 64, lastTransportObservedMs: 100 };
  assert.equal(assessVisitEvidence(input).lifecycle[0]?.state, 'ongoing-at-cutoff');
  assert.equal(assessVisitEvidence(input).baselineQualified, true);
});

test('event source delivery is positive but status/MIME alone and one fetch chunk are not', () => {
  const input = evidence();
  input.requests[0] = { ...finite(), class: 'event-source', streamContract: 'declared-task-stream',
    terminal: 'none', terminalObservedMs: null, deliveredMessageCount: 1,
    lastTransportObservedMs: 100 };
  assert.equal(assessVisitEvidence(input).baselineQualified, true);
  input.requests[0].deliveredMessageCount = 0;
  assert.equal(assessVisitEvidence(input).claims.observedLifecycle, 'unknown');
  input.requests[0] = { ...input.requests[0], class: 'fetch-stream',
    deliveredDataChunkCount: 1, deliveredDataBytes: 64 };
  assert.equal(assessVisitEvidence(input).baselineQualified, false);
});

test('pending finite, unsupported coverage, loss, early detach and errors each block', () => {
  const cases: Array<(input: VisitEvidenceV2) => void> = [
    (input) => { input.requests[0].terminal = 'none'; input.requests[0].terminalObservedMs = null; },
    (input) => { input.api.supported = false; },
    (input) => { input.recorder.lostEvents = 1; },
    (input) => { input.api.detachedEarly = true; },
    (input) => { input.errors.http = 1; },
    (input) => { input.errors.console = 1; },
    (input) => { input.product.exactMediaReady = false; },
    (input) => { input.requests[0].targetId = null; },
    (input) => { input.requests[0].failure = 'unexplained-abort'; },
    (input) => { input.requests[0].failure = 'explicit-abort'; },
  ];
  for (const mutate of cases) {
    const input = evidence(); mutate(input);
    assert.equal(assessVisitEvidence(input).baselineQualified, false);
  }
});

test('a complete HTTP error lifecycle is known but diagnostic eligibility fails', () => {
  const input = evidence();
  input.requests[0].responseStatus = 404;
  assert.equal(assessVisitEvidence(input).claims.observedLifecycle, 'pass');
  assert.equal(assessVisitEvidence(input).lifecycle[0]?.state, 'finished');
  assert.equal(assessVisitEvidence(input).claims.diagnosticEligibility, 'fail');
  assert.equal(assessVisitEvidence(input).baselineQualified, false);
});

test('unsupported receipt and policy versions cannot qualify', () => {
  const input = evidence();
  input.policyVersion = 1 as 2;
  assert.equal(isVisitEvidenceV2(input), false);
  assert.equal(assessVisitEvidence(input).baselineQualified, false);
});

test('public visit evidence rejects unbounded or raw request fields', () => {
  const input = evidence();
  assert.equal(isVisitEvidenceV2({ ...input, requests: [{ ...input.requests[0],
    rawUrl: 'https://x.com/private/status/1' }] }), false);
  assert.equal(isVisitEvidenceV2({ ...input, requests: Array.from({ length: 501 }, finite) }), false);
});
