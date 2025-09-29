import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { brotliCompressSync } from 'node:zlib';
import { cwd, env } from 'node:process';

import { describe, it, expect } from 'vitest';

interface MetricEntry {
  readonly baselineBytes: number;
  readonly toleranceBytes: number;
  readonly budgetBytes: number;
}

interface BundleBudgetMetrics {
  readonly version: number;
  readonly artifact: string;
  readonly measurements: {
    readonly rawBytes: MetricEntry;
    readonly brotliBytes: MetricEntry;
  };
  readonly notes?: string;
}

describe('FRAME-ALT-001 Stage C — bundle budget guard', () => {
  const distDir = join(cwd(), 'dist');
  const bundlePath = join(distDir, 'xcom-enhanced-gallery.user.js');
  const metricsPath = join(cwd(), 'metrics', 'bundle-metrics.json');

  const shouldSkip = env.TEST_SKIP_BUILD === 'true' || !existsSync(bundlePath);
  const testCase = shouldSkip ? it.skip : it;

  testCase('keeps bundle metrics within baseline tolerance and budget', () => {
    expect(existsSync(metricsPath)).toBe(true);

    const metrics: BundleBudgetMetrics = JSON.parse(readFileSync(metricsPath, 'utf-8'));

    expect(metrics.version).toBeGreaterThanOrEqual(2);
    expect(metrics.artifact).toBe('xcom-enhanced-gallery.user.js');

    const stageDCalibrationDate = Date.parse('2025-09-28T00:00:00.000Z');
    const generatedAt = Date.parse(metrics.generatedAt ?? '');
    expect(Number.isNaN(generatedAt)).toBe(false);
    expect(generatedAt).toBeGreaterThanOrEqual(stageDCalibrationDate);

    expect(typeof metrics.notes === 'string').toBe(true);
    expect(metrics.notes).toContain('Stage D readiness calibration');

    const artifactContent = readFileSync(bundlePath);
    const rawBytes = artifactContent.byteLength;
    const brotliBytes = brotliCompressSync(artifactContent).byteLength;

    const rawMeasurement = metrics.measurements.rawBytes;
    const brotliMeasurement = metrics.measurements.brotliBytes;

    expect(rawBytes).toBeLessThanOrEqual(rawMeasurement.budgetBytes);
    expect(Math.abs(rawBytes - rawMeasurement.baselineBytes)).toBeLessThanOrEqual(
      rawMeasurement.toleranceBytes
    );

    expect(brotliBytes).toBeLessThanOrEqual(brotliMeasurement.budgetBytes);
    expect(Math.abs(brotliBytes - brotliMeasurement.baselineBytes)).toBeLessThanOrEqual(
      brotliMeasurement.toleranceBytes
    );
  });
});
