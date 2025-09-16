/**
 * Phase 3 — Startup latency guard
 *
 * Goal:
 * - Importing the main entry should not eagerly import/evaluate non-critical services.
 * - Specifically guard BulkDownloadService, ZIP creator, Settings factory, and ServiceDiagnostics.
 * - In test mode, main must not auto-start to avoid wiring global listeners/timers.
 */

import { describe, it, expect, vi } from 'vitest';

// Guard against eager imports on startup. These mocks throw only if the module is actually imported.
// Note: vi.mock is hoisted by Vitest automatically; declaring at top-level is the correct pattern.
vi.mock('../../src/shared/services/BulkDownloadService', () => {
  throw new Error('[eager-import] BulkDownloadService should not be imported at startup');
});
vi.mock('../../src/shared/external/zip/zip-creator', () => {
  throw new Error('[eager-import] zip-creator should not be imported at startup');
});
vi.mock('../../src/shared/services/service-diagnostics', () => {
  throw new Error('[eager-import] service-diagnostics should not be imported at startup');
});
vi.mock('../../src/features/settings/services/settings-factory', () => {
  throw new Error('[eager-import] settings-factory should not be imported at startup');
});

describe('Phase 3 — startup import/eval guard', () => {
  it('importing main should not import non-critical modules eagerly', async () => {
    // Import main entry; in test mode it must not auto start
    const main = await import('../../src/main');

    // Exported API should be present without side-effects
    expect(typeof main.default?.start).toBe('function');
    expect(typeof main.default?.cleanup).toBe('function');
    expect(typeof main.default?.createConfig).toBe('function');
  });
});
