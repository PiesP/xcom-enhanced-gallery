// SPDX-License-Identifier: MIT
// Copyright (c) 2026 PiesP

/** Temporary, opt-in Phase 0 timing. Reports contain numeric data only. */
const ENABLED = import.meta.env.VITE_ZIP_CRC_PROFILE === '1';
const MAX_SPANS = 128;
const REPORT_ATTRIBUTE = 'data-xeg-zip-experiment';

type Phase =
  | 'worker-admission-wait'
  | 'entry-admission'
  | 'owned-blob-wait'
  | 'provider-wait'
  | 'network-fetch'
  | 'blob-array-buffer'
  | 'precommit-yield'
  | 'commit-total'
  | 'commit-queue-wait'
  | 'crc-active'
  | 'crc-table'
  | 'crc-yield'
  | 'local-header'
  | 'finalize'
  | 'blob-create';

interface Span {
  readonly phase: Phase;
  readonly startMs: number;
  readonly endMs: number;
  readonly bytes: number;
}

interface ActiveReport {
  readonly timeOrigin: number;
  readonly startedMs: number;
  readonly itemCount: number;
  readonly spans: Span[];
  overflow: boolean;
  invalidChunkSize: boolean;
  maxCrcChunkBytes: number;
  crcChunks: number;
}

let active: ActiveReport | null = null;

export function startZipExperiment(itemCount: number): void {
  if (!ENABLED) {
    return;
  }
  document.documentElement.removeAttribute(REPORT_ATTRIBUTE);
  active = {
    timeOrigin: performance.timeOrigin,
    startedMs: performance.now(),
    itemCount,
    spans: [],
    overflow: false,
    invalidChunkSize: false,
    maxCrcChunkBytes: 0,
    crcChunks: 0,
  };
}

export function startZipSpan(): number | null {
  return ENABLED && active ? performance.now() : null;
}

export function endZipSpan(phase: Phase, startedMs: number | null, bytes = 0): void {
  const report = active;
  if (!ENABLED || !report || startedMs === null) {
    return;
  }
  const endMs = performance.now();
  if (phase === 'crc-active') {
    report.crcChunks++;
    report.maxCrcChunkBytes = Math.max(report.maxCrcChunkBytes, bytes);
    if (bytes > 1024 * 1024) {
      report.invalidChunkSize = true;
    }
  }
  if (report.spans.length >= MAX_SPANS) {
    report.overflow = true;
    return;
  }
  report.spans.push({ phase, startMs: startedMs, endMs, bytes });
}

/** Capture the exact archive-ready boundary before report serialization. */
export function finishZipExperiment(archiveBytes: number): void {
  publish('owned-blob-ready', archiveBytes);
}

/** A failure/cancellation without an archive still leaves a bounded receipt. */
export function finishZipExperimentWithoutArchive(): void {
  publish('no-archive', 0);
}

function publish(outcome: 'owned-blob-ready' | 'no-archive', archiveBytes: number): void {
  const report = active;
  if (!ENABLED || !report) {
    return;
  }
  const finishedMs = performance.now();
  active = null;
  // Calibrate timer-pair overhead outside the measured action boundary.
  const calibrationStartedMs = performance.now();
  for (let index = 0; index < 1000; index++) {
    performance.now();
    performance.now();
  }
  const calibrationElapsedMs = performance.now() - calibrationStartedMs;
  document.documentElement.setAttribute(
    REPORT_ATTRIBUTE,
    JSON.stringify({
      schemaVersion: 1,
      outcome: report.overflow
        ? 'span-overflow'
        : report.invalidChunkSize
          ? 'invalid-chunk-size'
          : outcome,
      timeOrigin: report.timeOrigin,
      startedMs: report.startedMs,
      finishedMs,
      elapsedMs: finishedMs - report.startedMs,
      itemCount: report.itemCount,
      archiveBytes,
      maxCrcChunkBytes: report.maxCrcChunkBytes,
      crcChunks: report.crcChunks,
      spanLimit: MAX_SPANS,
      spans: report.spans,
      timerPairCalibration: { iterations: 1000, elapsedMs: calibrationElapsedMs },
    })
  );
}
