/**
 * @fileoverview Phase 33 Step 2C - Service Layer Bundle Size Guards
 * @description TDD guard tests for service layer optimization
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { Buffer } from 'node:buffer';
import { join } from 'node:path';

const PROJECT_ROOT = join(process.cwd());

interface ServiceSizeConstraint {
  readonly path: string;
  readonly maxLines: number;
  readonly maxKB: number;
  readonly target: string;
}

const SERVICE_CONSTRAINTS: readonly ServiceSizeConstraint[] = [
  {
    path: 'src/shared/services/media-service.ts',
    maxLines: 850,
    maxKB: 25.0,
    target: 'Remove unused extraction strategies, inline small helpers',
  },
  {
    path: 'src/shared/services/bulk-download-service.ts',
    maxLines: 400,
    maxKB: 14.0,
    target: 'Simplify retry logic, extract progress tracking',
  },
  {
    path: 'src/shared/services/media/twitter-video-extractor.ts',
    maxLines: 550,
    maxKB: 18.0,
    target: 'Remove legacy normalizer, inline TwitterAPI helpers',
  },
] as const;

describe('Phase 33 Step 2C - Service Layer Size Guard', () => {
  SERVICE_CONSTRAINTS.forEach(({ path, maxLines, maxKB, target }) => {
    describe(path, () => {
      const fullPath = join(PROJECT_ROOT, path);
      const content = readFileSync(fullPath, 'utf-8');
      const lines = content.split('\n').length;
      const sizeKB = Buffer.byteLength(content, 'utf-8') / 1024;

      it(`should not exceed ${maxLines} lines (current: ${lines}, target: ${target})`, () => {
        expect(lines).toBeLessThanOrEqual(maxLines);
      });

      it(`should not exceed ${maxKB} KB (current: ${sizeKB.toFixed(2)} KB)`, () => {
        expect(sizeKB).toBeLessThanOrEqual(maxKB);
      });
    });
  });

  it('should document optimization strategy in TDD_REFACTORING_PLAN.md', () => {
    const planPath = join(PROJECT_ROOT, 'docs/TDD_REFACTORING_PLAN.md');
    const plan = readFileSync(planPath, 'utf-8');

    expect(plan).toContain('Step 2C');
    expect(plan).toContain('서비스 레이어');
  });
});
