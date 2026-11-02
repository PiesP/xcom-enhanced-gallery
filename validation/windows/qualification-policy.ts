// SPDX-License-Identifier: MIT
// Copyright (c) 2026 PiesP

export const QUALIFICATION_POLICY_VERSION = 2;
export const QUALIFICATION_RECEIPT_SCHEMA_VERSION = 2;

export type ClaimState = 'pass' | 'fail' | 'unknown' | 'not-run';
export type NetworkChannel = 'page-cdp';
export type RequestOccurrenceV2 = {
  occurrenceId: string;
  targetId: string | null;
  sessionId: string | null;
  frameId: string | null;
  relation: 'task-required' | 'task-context' | 'unrelated' | 'unknown';
  class: 'finite' | 'event-source' | 'fetch-stream' | 'unknown';
  streamContract: 'declared-task-stream' | 'none';
  requestObservedMs: number;
  responseStatus: number | null;
  responseObservedMs: number | null;
  terminal: 'finished' | 'failed' | 'none';
  terminalObservedMs: number | null;
  failure: 'none' | 'explicit-abort' | 'unexplained-abort' | 'other';
  deliveredMessageCount: number;
  deliveredDataChunkCount: number;
  deliveredDataBytes: number;
  lastTransportObservedMs: number | null;
  observerStartMs: number;
  observerEndMs: number;
};
export type VisitEvidenceV2 = {
  policyVersion: 2;
  receiptSchemaVersion: 2;
  networkChannel: NetworkChannel;
  observationCutoffMs: number;
  recorder: {
    sealed: boolean;
    lostEvents: number;
    overflow: number;
    incompleteAttribution: number;
  };
  api: {
    supported: boolean;
    detachedEarly: boolean;
    observerStartMs: number;
    observerEndMs: number;
  };
  requests: RequestOccurrenceV2[];
  product: {
    finalUrlExact: boolean;
    responseStatus: number | null;
    articleVisible: boolean;
    extensionAbsent: boolean;
    exactMediaReady: boolean;
    observationCompleted: boolean;
  };
  errors: {
    http: number;
    console: number;
    page: number;
    request: number;
  };
  cleanup: {
    ownedPageClosed: boolean;
    originalPagesPreserved: boolean;
    focusRestored: boolean;
    disconnected: boolean;
  };
  candidate: { state: 'not-run' | 'pass' | 'fail' | 'unknown' };
};
export type VisitDecisionV2 = {
  policyVersion: 2;
  claims: {
    recorderIntegrity: ClaimState;
    apiObservationCoverage: ClaimState;
    observedLifecycle: ClaimState;
    productPrerequisites: ClaimState;
    diagnosticEligibility: ClaimState;
    candidateFunctionalResult: ClaimState;
    cleanup: ClaimState;
  };
  lifecycle: Array<{ occurrenceId: string; state: 'finished' | 'ongoing-at-cutoff' | 'failed' | 'unknown' }>;
  eligibleBeforeFinalCleanup: boolean;
  baselineQualified: boolean;
  candidateQualified: boolean;
};

function validTime(value: number): boolean {
  return Number.isFinite(value) && value >= 0;
}

function coherentOccurrence(
  request: RequestOccurrenceV2,
  cutoff: number,
  api: VisitEvidenceV2['api']
): boolean {
  const response = request.responseObservedMs;
  const terminal = request.terminalObservedMs;
  const transport = request.lastTransportObservedMs;
  return request.observerStartMs === api.observerStartMs &&
    request.observerEndMs === api.observerEndMs &&
    request.observerStartMs <= request.requestObservedMs &&
    request.requestObservedMs <= cutoff && cutoff <= request.observerEndMs &&
    (request.responseStatus === null) === (response === null) &&
    (request.responseStatus === null || httpStatus(request.responseStatus)) &&
    (response === null || response >= request.requestObservedMs && response <= cutoff) &&
    (request.terminal === 'none') === (terminal === null) &&
    (request.terminal === 'failed') === (request.failure !== 'none') &&
    (terminal === null || terminal >= request.requestObservedMs && terminal <= cutoff &&
      (response === null || terminal >= response)) &&
    ((request.deliveredMessageCount > 0 || request.deliveredDataChunkCount > 0) ===
      (transport !== null)) &&
    (request.deliveredDataBytes === 0 || request.deliveredDataChunkCount > 0) &&
    (transport === null || response !== null && transport >= response &&
      transport <= cutoff && (terminal === null || transport <= terminal)) &&
    (request.streamContract !== 'declared-task-stream' ||
      request.relation === 'task-required' &&
      (request.class === 'event-source' || request.class === 'fetch-stream'));
}

function requestState(
  request: RequestOccurrenceV2,
  cutoff: number,
  api: VisitEvidenceV2['api']
): VisitDecisionV2['lifecycle'][number]['state'] {
  const attributed = request.occurrenceId.length > 0 && request.targetId && request.sessionId &&
    request.frameId;
  if (!attributed || !coherentOccurrence(request, cutoff, api)) return 'unknown';
  if (request.terminal === 'failed' || request.failure !== 'none') return 'failed';
  if (request.terminal === 'finished') {
    return request.terminalObservedMs !== null &&
      request.responseStatus !== null && request.responseStatus >= 100 &&
      request.responseStatus <= 599 &&
      request.responseObservedMs !== null &&
      request.terminalObservedMs >= request.responseObservedMs ? 'finished' : 'unknown';
  }
  const transport = request.relation === 'task-required' &&
    request.streamContract === 'declared-task-stream' &&
    request.class === 'event-source'
    ? request.deliveredMessageCount > 0
    : request.relation === 'task-required' &&
      request.streamContract === 'declared-task-stream' &&
      request.class === 'fetch-stream' && request.deliveredDataChunkCount >= 2 &&
      request.deliveredDataBytes > 0;
  if (request.terminal === 'none' && transport && request.responseStatus === 200 &&
      request.responseObservedMs !== null && request.lastTransportObservedMs !== null &&
      request.lastTransportObservedMs >= request.responseObservedMs &&
      request.lastTransportObservedMs <= cutoff) return 'ongoing-at-cutoff';
  return 'unknown';
}

export function assessVisitEvidence(input: VisitEvidenceV2): VisitDecisionV2 {
  const cutoff = input.observationCutoffMs;
  const versionSupported = input.policyVersion === QUALIFICATION_POLICY_VERSION &&
    input.receiptSchemaVersion === QUALIFICATION_RECEIPT_SCHEMA_VERSION;
  const recorderIntegrity: ClaimState = versionSupported && input.recorder.sealed &&
    input.recorder.lostEvents === 0 && input.recorder.overflow === 0 &&
    input.recorder.incompleteAttribution === 0 &&
    [input.recorder.lostEvents, input.recorder.overflow, input.recorder.incompleteAttribution]
      .every((count) => Number.isSafeInteger(count) && count >= 0) ? 'pass' : 'fail';
  const apiObservationCoverage: ClaimState = versionSupported && input.networkChannel === 'page-cdp' &&
    input.api.supported && !input.api.detachedEarly && validTime(cutoff) &&
    validTime(input.api.observerStartMs) && input.api.observerStartMs <= cutoff &&
    input.api.observerEndMs >= cutoff ? 'pass' : 'unknown';
  const lifecycle = input.requests.map((request) => ({
    occurrenceId: request.occurrenceId,
    state: requestState(request, cutoff, input.api),
  }));
  const distinctOccurrences = new Set(input.requests.map((request) => request.occurrenceId)).size === input.requests.length;
  const observedLifecycle: ClaimState = lifecycle.some((entry) => entry.state === 'failed')
    ? 'fail' : lifecycle.length > 0 && lifecycle.every((entry) =>
      entry.state === 'finished' || entry.state === 'ongoing-at-cutoff') && distinctOccurrences
        ? 'pass' : 'unknown';
  const productPrerequisites: ClaimState = input.product.finalUrlExact &&
    input.product.responseStatus === 200 && input.product.articleVisible &&
    input.product.extensionAbsent && input.product.exactMediaReady &&
    input.product.observationCompleted ? 'pass' : 'fail';
  const errorsClear = Object.values(input.errors).every((count) => count === 0) &&
    input.requests.every((request) => request.responseStatus === null || request.responseStatus < 400);
  const diagnosticEligibility: ClaimState = recorderIntegrity === 'pass' &&
    apiObservationCoverage === 'pass' && observedLifecycle === 'pass' && errorsClear
      ? 'pass' : errorsClear && observedLifecycle !== 'fail' && recorderIntegrity === 'pass'
        ? 'unknown' : 'fail';
  const cleanup: ClaimState = input.cleanup.ownedPageClosed &&
    input.cleanup.originalPagesPreserved && input.cleanup.focusRestored &&
    input.cleanup.disconnected ? 'pass' : 'fail';
  const candidateFunctionalResult: ClaimState = input.candidate.state;
  const eligibleBeforeFinalCleanup = diagnosticEligibility === 'pass' &&
    productPrerequisites === 'pass' && input.cleanup.ownedPageClosed;
  const baselineQualified = eligibleBeforeFinalCleanup && cleanup === 'pass';
  return {
    policyVersion: 2,
    claims: { recorderIntegrity, apiObservationCoverage, observedLifecycle,
      productPrerequisites, diagnosticEligibility, candidateFunctionalResult, cleanup },
    lifecycle,
    eligibleBeforeFinalCleanup,
    baselineQualified,
    candidateQualified: baselineQualified && candidateFunctionalResult === 'pass',
  };
}

function object(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown> : null;
}

function keysOnly(value: Record<string, unknown>, allowed: string[]): boolean {
  return Object.keys(value).every((key) => allowed.includes(key));
}

function count(value: unknown, maximum: number): boolean {
  return typeof value === 'number' && Number.isSafeInteger(value) &&
    value >= 0 && value <= maximum;
}

function oneOf(value: unknown, allowed: readonly string[]): boolean {
  return typeof value === 'string' && allowed.includes(value);
}

function httpStatus(value: unknown): value is number {
  return typeof value === 'number' && count(value, 599) && value >= 100;
}

function timestamp(value: unknown): boolean {
  return typeof value === 'number' && validTime(value) && value <= 3_600_000;
}

function optionalTimestamp(value: unknown): boolean {
  return value === null || timestamp(value);
}

function boundedId(value: unknown): boolean {
  return typeof value === 'string' && value.length > 0 && value.length <= 128 &&
    /^[A-Za-z0-9_.:-]+$/u.test(value);
}

export function isVisitEvidenceV2(value: unknown): value is VisitEvidenceV2 {
  const input = object(value);
  const recorder = object(input?.recorder);
  const api = object(input?.api);
  const product = object(input?.product);
  const errors = object(input?.errors);
  const cleanup = object(input?.cleanup);
  const candidate = object(input?.candidate);
  if (!input || input.policyVersion !== 2 || input.receiptSchemaVersion !== 2 ||
      !keysOnly(input, ['policyVersion', 'receiptSchemaVersion', 'networkChannel',
        'observationCutoffMs', 'recorder', 'api', 'requests', 'product', 'errors',
        'cleanup', 'candidate']) ||
      input.networkChannel !== 'page-cdp' || !timestamp(input.observationCutoffMs) ||
      !recorder || recorder.sealed !== true || !count(recorder.lostEvents, 500) ||
      !keysOnly(recorder, ['sealed', 'lostEvents', 'overflow', 'incompleteAttribution']) ||
      !count(recorder.overflow, 500) || !count(recorder.incompleteAttribution, 500) ||
      !api || typeof api.supported !== 'boolean' || typeof api.detachedEarly !== 'boolean' ||
      !keysOnly(api, ['supported', 'detachedEarly', 'observerStartMs', 'observerEndMs']) ||
      !timestamp(api.observerStartMs) || !timestamp(api.observerEndMs) ||
      !Array.isArray(input.requests) || input.requests.length > 500 ||
      !product || typeof product.finalUrlExact !== 'boolean' ||
      !(product.responseStatus === null || httpStatus(product.responseStatus)) ||
      typeof product.articleVisible !== 'boolean' ||
      typeof product.extensionAbsent !== 'boolean' ||
      typeof product.exactMediaReady !== 'boolean' ||
      typeof product.observationCompleted !== 'boolean' ||
      !keysOnly(product, ['finalUrlExact', 'responseStatus', 'articleVisible',
        'extensionAbsent', 'exactMediaReady', 'observationCompleted']) ||
      !errors || !['http', 'console', 'page', 'request'].every((key) => count(errors[key], 500)) ||
      !keysOnly(errors, ['http', 'console', 'page', 'request']) ||
      !cleanup || !['ownedPageClosed', 'originalPagesPreserved', 'focusRestored', 'disconnected']
        .every((key) => typeof cleanup[key] === 'boolean') ||
      !keysOnly(cleanup, ['ownedPageClosed', 'originalPagesPreserved',
        'focusRestored', 'disconnected']) ||
      !candidate || !keysOnly(candidate, ['state']) ||
      !oneOf(candidate.state, ['not-run', 'pass', 'fail', 'unknown'])) {
    return false;
  }
  return input.requests.every((value: unknown) => {
    const request = object(value);
    return !!request && boundedId(request.occurrenceId) &&
      keysOnly(request, ['occurrenceId', 'targetId', 'sessionId', 'frameId',
        'relation', 'class', 'streamContract', 'requestObservedMs',
        'responseStatus', 'responseObservedMs', 'terminal', 'terminalObservedMs',
        'failure', 'deliveredMessageCount', 'deliveredDataChunkCount',
        'deliveredDataBytes', 'lastTransportObservedMs', 'observerStartMs', 'observerEndMs']) &&
      (request.targetId === null || boundedId(request.targetId)) &&
      (request.sessionId === null || boundedId(request.sessionId)) &&
      (request.frameId === null || boundedId(request.frameId)) &&
      oneOf(request.relation, ['task-required', 'task-context', 'unrelated', 'unknown']) &&
      oneOf(request.class, ['finite', 'event-source', 'fetch-stream', 'unknown']) &&
      oneOf(request.streamContract, ['declared-task-stream', 'none']) &&
      timestamp(request.requestObservedMs) &&
      (request.responseStatus === null || httpStatus(request.responseStatus)) &&
      optionalTimestamp(request.responseObservedMs) &&
      oneOf(request.terminal, ['finished', 'failed', 'none']) &&
      optionalTimestamp(request.terminalObservedMs) &&
      oneOf(request.failure, ['none', 'explicit-abort', 'unexplained-abort', 'other']) &&
      count(request.deliveredMessageCount, 500) &&
      count(request.deliveredDataChunkCount, 500) &&
      count(request.deliveredDataBytes, Number.MAX_SAFE_INTEGER) &&
      optionalTimestamp(request.lastTransportObservedMs) &&
      timestamp(request.observerStartMs) && timestamp(request.observerEndMs) &&
      coherentOccurrence(request as unknown as RequestOccurrenceV2,
        input.observationCutoffMs as number, api as unknown as VisitEvidenceV2['api']);
  });
}
